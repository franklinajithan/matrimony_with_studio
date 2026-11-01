import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
const db=new PGlite();after(()=>db.close());
const a='10000000-0000-4000-8000-000000000001',b='10000000-0000-4000-8000-000000000002',c='10000000-0000-4000-8000-000000000003',admin='10000000-0000-4000-8000-000000000004';
await db.exec(`
create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema private;
create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function private.account_session_active()returns boolean language sql stable as $$select coalesce(nullif(current_setting('test.session',true),''),'true')::boolean$$;
create function public.is_admin()returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}'),('${c}'),('${admin}');
create table profiles(id uuid primary key references auth.users,is_published boolean default true,public_title text default 'Published alias',private_note text default 'Private');insert into profiles(id) select id from auth.users;
create view public.discovery_profiles as select id,public_title from profiles where is_published and auth.uid() is not null and private.account_session_active();grant select on public.discovery_profiles to authenticated;
create table member_public_references(member_id uuid primary key references profiles,number bigint unique);insert into member_public_references values('${a}',1),('${b}',2),('${c}',3),('${admin}',4);
create table admin_audit_log(actor_id uuid,action text,target_type text,target_id text,metadata jsonb);
create table blocks(id uuid primary key default gen_random_uuid(),blocker_id uuid not null references auth.users,blocked_id uuid not null references profiles,reason text,created_at timestamptz default now(),unique(blocker_id,blocked_id));
create table match_requests(id text primary key,sender_id uuid not null,receiver_id uuid not null,status text not null default 'pending',message text,withdrawn_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now());
create table connections(id uuid primary key default gen_random_uuid(),member_a_id uuid,member_b_id uuid,created_from_request_id text,unique(member_a_id,member_b_id));
create table chats(id text primary key,participant_1 uuid,participant_2 uuid,unread_by jsonb default '{}',updated_at timestamptz default now());
create table messages(id uuid primary key default gen_random_uuid(),chat_id text references chats,sender_id uuid,text text);
alter table blocks enable row level security;alter table match_requests enable row level security;alter table connections enable row level security;alter table chats enable row level security;alter table messages enable row level security;
create policy blocks_read on blocks for select to authenticated using(auth.uid() in(blocker_id,blocked_id));
create policy blocks_insert on blocks for insert to authenticated with check(blocker_id=auth.uid());
create policy blocks_update on blocks for update to authenticated using(blocker_id=auth.uid())with check(blocker_id=auth.uid());
create policy blocks_delete on blocks for delete to authenticated using(blocker_id=auth.uid());
create policy account_live_session on blocks as restrictive for all to authenticated using(private.account_session_active())with check(private.account_session_active());
-- Deliberately broad legacy grants: actual new triggers/restrictive gates must protect writes.
create policy legacy_requests on match_requests for all to authenticated using(true)with check(true);
create policy legacy_connections on connections for all to authenticated using(true)with check(true);
create policy legacy_chats on chats for all to authenticated using(true)with check(true);
create policy legacy_messages on messages for all to authenticated using(true)with check(true);
grant usage on schema public,auth,private to authenticated,anon,service_role;
grant select,insert,update,delete on blocks,match_requests,connections,chats,messages to authenticated,service_role;
insert into chats(id,participant_1,participant_2)values('history','${a}','${b}');insert into messages(chat_id,sender_id,text)values('history','${a}','Historical message');
insert into blocks(blocker_id,blocked_id)values('${a}','${b}');insert into connections(member_a_id,member_b_id)values('${a}','${b}');
`);
await db.exec(await readFile('supabase/migrations/20261101124051_interest_authorization_boundaries.sql','utf8'));
const migration=await readFile('supabase/migrations/20261101223726_member_safety_enforcement.sql','utf8');await db.exec(migration);
// Existing blocked connections are severed at migration; history remains.
assert.equal((await db.query('select count(*)::int n from connections')).rows[0].n,0);
assert.equal((await db.query('select count(*)::int n from messages')).rows[0].n,1);
const actor=async(id=a)=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${id}',false);select set_config('test.session','true',false);set role authenticated;`);
beforeEach(async()=>{
 await db.exec(`reset role;delete from admin_audit_log;delete from reports;delete from blocks;delete from connections;delete from match_requests;`);await actor();
});
const denied=sql=>assert.rejects(db.exec(sql),/row-level security|permission denied|Interaction unavailable|cannot change|evidence cannot be edited|Forbidden/i);
const reportId='20000000-0000-4000-8000-000000000001';
async function report(){await db.exec(`insert into reports(id,reporter_id,reported_id,reason,description)values('${reportId}','${a}','${b}','harassment','Evidence')`);}
test('reporter may submit but cannot read their own report or spoof status/reviewer',async()=>{
 await report();assert.equal((await db.query('select * from reports')).rows.length,0);
 await denied(`insert into reports(reporter_id,reported_id,reason,status)values('${a}','${b}','spam','resolved')`);
 await denied(`insert into reports(reporter_id,reported_id,reason,reviewed_by)values('${a}','${b}','spam','${admin}')`);
 await denied(`insert into reports(reporter_id,reported_id,reason)values('${c}','${b}','spam')`);
 await denied(`insert into reports(reporter_id,reported_id,reason)values('${a}','${a}','spam')`);
});
test('reported member and unrelated member cannot identify the reporter or modify a report',async()=>{
 await report();for(const user of [b,c]){await actor(user);assert.equal((await db.query('select * from reports')).rows.length,0);assert.equal((await db.query("update reports set status='dismissed' returning id")).rows.length,0);}
});
test('admin status changes stamp verified actor, preserve evidence and create audit events',async()=>{
 await report();await actor(admin);
 await db.exec(`update reports set status='reviewing',reviewed_by='${b}' where id='${reportId}'`);
 const row=(await db.query('select * from reports')).rows[0];assert.equal(row.reviewed_by,admin);assert.ok(row.reviewed_at);
 await denied("update reports set description='Edited evidence'");await denied(`update reports set reporter_id='${c}'`);
 await db.exec('reset role');const events=(await db.query('select * from admin_audit_log')).rows;assert.equal(events.length,1);assert.equal(events[0].actor_id,admin);assert.deepEqual(events[0].metadata,{previousStatus:'pending',status:'reviewing'});
});
test('revoked admin session cannot read or update reports',async()=>{
 await report();await actor(admin);await db.exec("select set_config('test.session','false',false)");assert.equal((await db.query('select * from reports')).rows.length,0);assert.equal((await db.query("update reports set status='resolved' returning id")).rows.length,0);
});
test('reciprocal blocks are supported; blocked member cannot see who blocked them',async()=>{
 await db.exec(`insert into blocks(blocker_id,blocked_id)values('${a}','${b}')`);await actor(b);
 assert.equal((await db.query('select * from blocks')).rows.length,0);
 assert.equal((await db.query(`select are_blocked('${a}','${b}') blocked`)).rows[0].blocked,true);
 await db.exec(`insert into blocks(blocker_id,blocked_id)values('${b}','${a}')`);
 assert.equal((await db.query(`select are_blocked('${a}','${b}') blocked`)).rows[0].blocked,true);
 await actor(c);await denied(`select are_blocked('${a}','${b}')`);
});
test('blocks cannot be retargeted and self/forged blocks are rejected',async()=>{
 await db.exec(`insert into blocks(blocker_id,blocked_id)values('${a}','${b}')`);
 await denied(`update blocks set blocked_id='${c}'`);await denied(`insert into blocks(blocker_id,blocked_id)values('${a}','${a}')`);await denied(`insert into blocks(blocker_id,blocked_id)values('${c}','${b}')`);
});
test('blocking removes a connection atomically but retains chats/messages; unblock does not restore it',async()=>{
 await db.exec(`reset role;insert into connections(member_a_id,member_b_id)values('${a}','${b}')`);await actor();
 await db.exec(`insert into blocks(blocker_id,blocked_id)values('${a}','${b}')`);assert.equal((await db.query('select count(*)::int n from connections')).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int n from messages')).rows[0].n,1);
 await db.exec('delete from blocks');assert.equal((await db.query('select count(*)::int n from connections')).rows[0].n,0);
});
for(const blocker of [a,b])test(`block by ${blocker===a?'sender':'receiver'} prevents interests, connections, chats and messages`,async()=>{
 await actor(blocker);await db.exec(`insert into blocks(blocker_id,blocked_id)values('${blocker}','${blocker===a?b:a}')`);await actor();
 await denied(`insert into match_requests(id,sender_id,receiver_id)values('blocked','${a}','${b}')`);
 await actor(b);await denied(`insert into connections(member_a_id,member_b_id)values('${a}','${b}')`);
 await denied(`insert into chats(id,participant_1,participant_2)values('new','${a}','${b}')`);
 await denied(`insert into messages(chat_id,sender_id,text)values('history','${b}','New message')`);
 await db.exec("update chats set unread_by='{}' where id='history'");
});
test('blocks allow safe decline/withdraw cleanup but not acceptance',async()=>{
 await db.exec(`insert into match_requests(id,sender_id,receiver_id)values('request','${a}','${b}')`);await actor(b);await db.exec(`insert into blocks(blocker_id,blocked_id)values('${b}','${a}')`);
 await denied("select * from accept_interest_and_connect('request')");
 await db.exec("update match_requests set status='declined' where id='request'");
});
test('own block list returns only caller blocks and public references, with session checks',async()=>{
 await db.exec(`insert into blocks(blocker_id,blocked_id)values('${a}','${b}')`);
 const rows=(await db.query('select * from own_blocked_members(500)')).rows;assert.equal(rows.length,1);assert.equal(rows[0].reference,'CM-000002');assert.equal(rows[0].blocked_id,b);
 await actor(b);assert.equal((await db.query('select * from own_blocked_members()')).rows.length,0);
 await db.exec("select set_config('test.session','false',false)");await assert.rejects(db.exec('select * from own_blocked_members()'),/Sign in/);
});
test('anonymous callers cannot query safety RPCs; trigger routines cannot be executed directly',async()=>{
 await db.exec('reset role;set role anon');await denied(`select are_blocked('${a}','${b}')`);await denied('select * from own_blocked_members()');await actor();
 for(const name of ['guard_member_report_update','audit_member_report_review','reject_blocked_member_write','disconnect_blocked_members'])assert.equal((await db.query(`select has_function_privilege('authenticated','public.${name}()','execute') allowed`)).rows[0].allowed,false);
});
test('reapplying the migration keeps report history and restrictive session rules',async()=>{
 await report();await db.exec('reset role');await db.exec(migration);assert.equal((await db.query('select count(*)::int n from reports')).rows[0].n,1);assert.equal((await db.query("select polpermissive from pg_policy where polname='account_live_session' and polrelid='reports'::regclass")).rows[0].polpermissive,false);
});

test('discovery excludes blocks in both directions without widening its projection',async()=>{
 await db.exec(`insert into blocks(blocker_id,blocked_id)values('${a}','${b}')`);
 for(const [actorId,excluded] of [[a,b],[b,a]]){await actor(actorId);const rows=(await db.query('select * from discovery_profiles')).rows;assert.equal(rows.some(row=>row.id===excluded),false);assert.equal(rows.some(row=>row.id===c),true);assert.ok(rows.every(row=>!('private_note' in row)));}
 await db.exec('reset role');const before=(await db.query("select pg_get_viewdef('discovery_profiles'::regclass,true) v")).rows[0].v;await db.exec(migration);const after=(await db.query("select pg_get_viewdef('discovery_profiles'::regclass,true) v")).rows[0].v;assert.equal(after,before);
});
test('report submission rate limit ignores forged client timestamps',async()=>{
 for(let i=0;i<5;i++)await db.exec(`insert into reports(reporter_id,reported_id,reason,created_at)values('${a}','${b}','spam','2000-01-01')`);
 await assert.rejects(db.exec(`insert into reports(reporter_id,reported_id,reason)values('${a}','${b}','spam')`),/submitted several reports/);
});

test('strangers cannot use historical unread acknowledgements as an interaction bypass',async()=>{
 await actor(c);await denied("update chats set unread_by='{}' where id='history'");
});
