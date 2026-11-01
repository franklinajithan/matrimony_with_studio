import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite();
after(() => db.close());
const a='10000000-0000-4000-8000-000000000001',b='10000000-0000-4000-8000-000000000002',c='10000000-0000-4000-8000-000000000003';
await db.exec(`
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema private;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function private.account_session_active() returns boolean language sql stable as $$select coalesce(nullif(current_setting('test.live_session',true),''),'true')::boolean$$;
create table match_requests(id text primary key,sender_id uuid not null,receiver_id uuid not null,status text not null default 'pending',message text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),withdrawn_at timestamptz,check(sender_id<>receiver_id));
create table connections(id uuid primary key default gen_random_uuid(),member_a_id uuid not null,member_b_id uuid not null,created_from_request_id text references match_requests(id),unique(member_a_id,member_b_id));
alter table match_requests enable row level security; alter table connections enable row level security;
-- Reproduce the live overlapping permissive rules and restrictive session gate.
create policy match_requests_select_participants on match_requests for select to authenticated using(auth.uid() in(sender_id,receiver_id));
create policy match_requests_insert_sender on match_requests for insert to authenticated with check(sender_id=auth.uid());
create policy match_requests_insert_as_sender on match_requests for insert to authenticated with check(sender_id=auth.uid() and status='pending');
create policy match_requests_update_participants on match_requests for update to authenticated using(auth.uid() in(sender_id,receiver_id)) with check(auth.uid() in(sender_id,receiver_id));
create policy match_requests_update_involved on match_requests for update to authenticated using(auth.uid() in(sender_id,receiver_id)) with check((sender_id=auth.uid() and status='withdrawn') or(receiver_id=auth.uid() and status in('accepted','declined')));
create policy match_requests_delete_participants on match_requests for delete to authenticated using(auth.uid() in(sender_id,receiver_id));
create policy connections_select_involved on connections for select to authenticated using(auth.uid() in(member_a_id,member_b_id));
create policy connections_insert_involved on connections for insert to authenticated with check(auth.uid() in(member_a_id,member_b_id) and member_a_id<member_b_id);
create policy connections_delete_involved on connections for delete to authenticated using(auth.uid() in(member_a_id,member_b_id));
create policy account_live_session on match_requests as restrictive for all to authenticated using(private.account_session_active()) with check(private.account_session_active());
create policy account_live_session on connections as restrictive for all to authenticated using(private.account_session_active()) with check(private.account_session_active());
grant usage on schema public,auth,private to authenticated,anon,service_role;
grant select,insert,update,delete on match_requests,connections to authenticated,service_role;
`);
const actor=async(id=a)=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${id}',false);select set_config('test.live_session','true',false);set role authenticated;`);
const migration=await readFile('supabase/migrations/20261101124051_interest_authorization_boundaries.sql','utf8');
// Demonstrate the pre-fix defect with disposable IDs, never production writes.
await actor();
await db.exec(`insert into match_requests(id,sender_id,receiver_id,status)values('forged','${a}','${b}','accepted');insert into connections(member_a_id,member_b_id,created_from_request_id)values('${a}','${b}','forged');reset role;delete from connections;delete from match_requests;`);
await db.exec(migration);
beforeEach(async()=>{
 await db.exec(`reset role;delete from connections;delete from match_requests;insert into match_requests(id,sender_id,receiver_id)values('request','${a}','${b}');`);
 await actor();
});
const denied=(sql)=>assert.rejects(db.exec(sql),/not allowed|cannot change|pending interest|row-level security|permission denied|receiver|unavailable/i);
const state=async()=>{await db.exec('reset role');return(await db.query("select status,message from match_requests where id='request'")).rows[0];};
test('sender cannot insert an already accepted request, including with a forged admin claim',async()=>{
 await db.exec(`select set_config('request.jwt.claims','{"user_metadata":{"is_admin":true}}',false)`);
 await denied(`insert into match_requests(id,sender_id,receiver_id,status)values('forged','${a}','${c}','accepted')`);
});
test('sender cannot accept/decline own interest or edit pending content',async()=>{
 await denied("update match_requests set status='accepted' where id='request'");
 await denied("update match_requests set status='declined' where id='request'");
 await denied("update match_requests set message='replacement' where id='request'");
 assert.equal((await state()).status,'pending');
});
test('both participants cannot rewrite identity, participants or creation time',async()=>{
 for(const id of [a,b]){await actor(id);for(const assignment of [`sender_id='${c}'`,`receiver_id='${c}'`,"id='replacement'","created_at=now()+interval '1 day'"]){await denied(`update match_requests set ${assignment} where id='request'`);}}
});
test('receiver alone accepts and RPC creates one canonical connection, including retries',async()=>{
 await actor(b);
 await db.exec("select * from accept_interest_and_connect('request')");
 await db.exec("select * from accept_interest_and_connect('request')");
 const rows=(await db.query('select * from connections')).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].member_a_id,a);assert.equal(rows[0].member_b_id,b);assert.equal(rows[0].created_from_request_id,'request');
 assert.equal((await state()).status,'accepted');
});
test('sender and strangers cannot use accept RPC',async()=>{
 await denied("select * from accept_interest_and_connect('request')");
 await actor(c);await assert.rejects(db.exec("select * from accept_interest_and_connect('request')"),/not found/);
 assert.equal((await state()).status,'pending');
});
test('decline, withdraw and sender resend work; receiver cannot resend',async()=>{
 await actor(b);await db.exec("update match_requests set status='declined' where id='request'");
 await denied("update match_requests set status='pending' where id='request'");
 await actor(a);await db.exec("update match_requests set status='pending',message='Hello',withdrawn_at=null where id='request'");
 await db.exec("update match_requests set status='withdrawn',withdrawn_at=now() where id='request'");
 await db.exec("update match_requests set status='pending',message='Again',withdrawn_at=null where id='request'");
 assert.deepEqual(await state(),{status:'pending',message:'Again'});
});
test('accepted request can be resent only after connection removal',async()=>{
 await actor(b);await db.exec("select * from accept_interest_and_connect('request')");await actor(a);
 await denied("update match_requests set status='pending' where id='request'");
 await db.exec('delete from connections');
 await db.exec("update match_requests set status='pending',withdrawn_at=null where id='request'");
 assert.equal((await state()).status,'pending');
});
test('connection insert requires actual receiver consent and exact request pair',async()=>{
 await denied(`insert into connections(member_a_id,member_b_id,created_from_request_id)values('${a}','${b}','request')`);
 await actor(b);await db.exec("update match_requests set status='accepted' where id='request'");await actor(a);
 await denied(`insert into connections(member_a_id,member_b_id,created_from_request_id)values('${a}','${b}','request')`);
 await actor(b);await denied(`insert into connections(member_a_id,member_b_id,created_from_request_id)values('${b}','${c}','request')`);
});
test('revoked sessions cannot read or mutate interests/connections',async()=>{
 await db.exec("select set_config('test.live_session','false',false)");
 assert.equal((await db.query('select * from match_requests')).rows.length,0);
 await denied(`insert into match_requests(id,sender_id,receiver_id)values('revoked','${a}','${c}')`);
 const result=await db.query("update match_requests set status='withdrawn',withdrawn_at=now() where id='request' returning id");assert.equal(result.rows.length,0);
});
test('nonparticipants cannot read/update/delete requests; receiver cannot erase history',async()=>{
 await actor(c);assert.equal((await db.query('select * from match_requests')).rows.length,0);
 assert.equal((await db.query("update match_requests set status='accepted' returning id")).rows.length,0);
 assert.equal((await db.query('delete from match_requests returning id')).rows.length,0);
 await actor(b);assert.equal((await db.query('delete from match_requests returning id')).rows.length,0);
 assert.equal((await state()).status,'pending');
});
test('failed connection insertion rolls acceptance back atomically',async()=>{
 await db.exec(`reset role;create function reject_test_connection()returns trigger language plpgsql as $$begin raise exception 'Simulated blocked connection';end$$;create trigger reject_test_connection before insert on connections for each row execute function reject_test_connection();`);
 await actor(b);await assert.rejects(db.exec("select * from accept_interest_and_connect('request')"),/Simulated blocked connection/);
 assert.equal((await state()).status,'pending');
 await db.exec('drop trigger reject_test_connection on connections;drop function reject_test_connection()');
});
test('stale resend cannot overwrite a later status change',async()=>{
 await db.exec("update match_requests set status='withdrawn',withdrawn_at=now() where id='request'");
 await db.exec("update match_requests set status='pending',withdrawn_at=null where id='request'");
 await actor(b);await db.exec("select * from accept_interest_and_connect('request')");await actor(a);
 assert.equal((await db.query("update match_requests set status='pending',withdrawn_at=null where id='request' and status='withdrawn' returning id")).rows.length,0);
 assert.equal((await state()).status,'accepted');
});
test('trusted service cleanup survives and migration reapplication preserves records/grants/session policy',async()=>{
 await db.exec('reset role');await db.exec(migration);
 assert.equal((await db.query("select count(*)::int n from match_requests")).rows[0].n,1);
 assert.equal((await db.query("select polpermissive from pg_policy where polrelid='match_requests'::regclass and polname='account_live_session'")).rows[0].polpermissive,false);
 assert.equal((await db.query("select has_function_privilege('anon','public.accept_interest_and_connect(text)','execute') as allowed")).rows[0].allowed,false);
 assert.equal((await db.query("select has_function_privilege('authenticated','public.guard_member_interest_write()','execute') as allowed")).rows[0].allowed,false);
 await db.exec("set role service_role;delete from match_requests where id='request';reset role");
 assert.equal((await db.query('select count(*)::int n from match_requests')).rows[0].n,0);
});
