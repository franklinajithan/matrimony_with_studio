import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {test,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
const db=new PGlite();after(()=>db.close());
const admin='10000000-0000-4000-8000-000000000001', member='10000000-0000-4000-8000-000000000002', story='20000000-0000-4000-8000-000000000001';
await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create function public.is_admin()returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
create function private.account_session_active()returns boolean language sql stable as $$select coalesce(nullif(current_setting('test.live',true),''),'true')::boolean$$;
create table admin_audit_log(actor_id uuid,action text,target_type text,target_id text,metadata jsonb);
create table success_stories(id uuid primary key default gen_random_uuid(),couple_names text,story_text text,original_story_text text,submitted_by_uid uuid,status text default 'pending',admin_notes text,approved_at timestamptz,updated_at timestamptz default now());
alter table success_stories enable row level security;
create policy read_story on success_stories for select using(status='approved' or submitted_by_uid=auth.uid() or is_admin());
create policy insert_story on success_stories for insert to authenticated with check(submitted_by_uid=auth.uid());
create table member_subscriptions(id int,user_id uuid);create table subscription_events(id int);create table subscription_plans(code text,active boolean);
alter table member_subscriptions enable row level security;alter table subscription_events enable row level security;alter table subscription_plans enable row level security;
create policy own_subscription on member_subscriptions for select to authenticated using(user_id=auth.uid());
create policy active_plan on subscription_plans for select using(active);
grant usage on schema public,auth,private to authenticated,anon;
grant select,insert,update on success_stories to authenticated;grant select on success_stories to anon;
insert into member_subscriptions values(1,'${member}'),(2,'${admin}');insert into subscription_events values(1);insert into subscription_plans values('free',true),('disabled',false);
`);
const migration=await readFile('supabase/migrations/20261102082805_admin_story_moderation_and_billing_reads.sql','utf8');
await db.exec(migration);
const actor=async(id=admin,live=true)=>db.exec(`reset role;select set_config('test.uid','${id}',false);select set_config('test.live','${live}',false);set role authenticated;`);
beforeEach(async()=>{await db.exec(`reset role;delete from success_stories;delete from admin_audit_log;insert into success_stories(id,couple_names,story_text,submitted_by_uid)values('${story}','Couple','Submitted evidence','${member}');`);await actor();});
test('story approval stamps server time and atomically records verified admin/reason',async()=>{
 await db.exec(`update success_stories set status='approved',admin_notes='Reviewed with consent',approved_at='2000-01-01' where id='${story}'`);
 const row=(await db.query('select * from success_stories')).rows[0];assert.equal(row.status,'approved');assert.ok(new Date(row.approved_at).getUTCFullYear()>2000);assert.equal(row.admin_notes,null);
 await db.exec('reset role');const audit=(await db.query('select * from admin_audit_log')).rows[0];assert.equal(audit.actor_id,admin);assert.equal(audit.metadata.reason,'Reviewed with consent');assert.equal(audit.metadata.previousStatus,'pending');
});
test('rejection removes publication time while preserving submitted content',async()=>{
 await db.exec(`update success_stories set status='approved',admin_notes='Reviewed and approved';update success_stories set status='rejected',admin_notes='Consent was withdrawn';`);
 const row=(await db.query('select * from success_stories')).rows[0];assert.equal(row.approved_at,null);assert.equal(row.story_text,'Submitted evidence');
});
test('forged evidence and invalid/no-op reviews fail without audit or publication',async()=>{
 for(const update of ["status='approved',story_text='Changed',admin_notes='Valid long reason'","status='approved',admin_notes='short'","status='pending',admin_notes='Valid long reason'"]){await assert.rejects(db.exec(`update success_stories set ${update}`));}
 await db.exec('reset role');assert.equal((await db.query('select * from admin_audit_log')).rows.length,0);assert.equal((await db.query('select status from success_stories')).rows[0].status,'pending');
});
test('stale expected-status update affects zero rows and creates no second audit',async()=>{
 await db.exec("update success_stories set status='approved',admin_notes='Valid approval reason' where status='pending'");
 const result=await db.query("update success_stories set status='rejected',admin_notes='Another review reason' where status='pending' returning id");assert.equal(result.rows.length,0);
 await db.exec('reset role');assert.equal((await db.query('select * from admin_audit_log')).rows.length,1);
});
test('members cannot self-publish, forge review metadata or update an existing story',async()=>{
 await actor(member);
 for(const columns of ["status", "admin_notes", "approved_at"]){const value=columns==='status'?"'approved'":columns==='admin_notes'?"'Forged review reason'":"now()";await assert.rejects(db.exec(`insert into success_stories(submitted_by_uid,${columns})values('${member}',${value})`));}
 assert.equal((await db.query("update success_stories set status='approved',admin_notes='Fake review reason' returning id")).rows.length,0);
 await db.exec(`insert into success_stories(submitted_by_uid,couple_names,story_text)values('${member}','A and B','A real submission')`);
});
test('expired admin cannot moderate or read private billing rows',async()=>{
 await actor(admin,false);assert.equal((await db.query("update success_stories set status='approved',admin_notes='Valid review reason' returning id")).rows.length,0);assert.equal((await db.query('select * from subscription_events')).rows.length,0);assert.equal((await db.query("select * from subscription_plans where not active")).rows.length,0);
});
test('billing read policies expose all records to admins and only owned subscriptions to members',async()=>{
 assert.equal((await db.query('select * from member_subscriptions')).rows.length,2);assert.equal((await db.query('select * from subscription_events')).rows.length,1);assert.equal((await db.query('select * from subscription_plans')).rows.length,2);
 await actor(member);assert.equal((await db.query('select * from member_subscriptions')).rows.length,1);assert.equal((await db.query('select * from subscription_events')).rows.length,0);assert.equal((await db.query('select * from subscription_plans')).rows.length,1);
 await assert.rejects(db.exec('update member_subscriptions set id=3'));await assert.rejects(db.exec('select private.guard_story_review()'));
});
test('audit failure rolls back approval and migration can be reapplied',async()=>{
 await db.exec(`reset role;create function fail_audit()returns trigger language plpgsql as $$begin raise exception 'Audit unavailable';end$$;create trigger fail_audit before insert on admin_audit_log for each row execute function fail_audit();`);await actor();
 await assert.rejects(db.exec("update success_stories set status='approved',admin_notes='Valid review reason'"),/Audit unavailable/);
 assert.equal((await db.query('select status from success_stories')).rows[0].status,'pending');await db.exec('reset role;drop trigger fail_audit on admin_audit_log');await db.exec(migration);
});
test('migration-owned review RPC enforces session, admin role and optimistic state',async()=>{
 const call=`select admin_review_success_story('${story}','approved','pending','Verified consent and content') result`;
 await actor(member);await assert.rejects(db.query(call),/Forbidden/);
 await actor(admin,false);await assert.rejects(db.query(call),/Forbidden/);
 await actor();assert.equal((await db.query(call)).rows[0].result.status,'approved');assert.equal((await db.query(call)).rows[0].result,null);
 await db.exec("reset role;set role anon");await assert.rejects(db.query(call),/permission denied/);
});
test('staged moderation migration tolerates absent payment tables without creating billing data',async()=>{
 await db.exec('reset role;drop table member_subscriptions;drop table subscription_events;');await db.exec(migration);
 assert.equal((await db.query("select to_regclass('public.member_subscriptions') name")).rows[0].name,null);
 assert.equal((await db.query('select count(*)::int n from success_stories')).rows[0].n,1);
});
