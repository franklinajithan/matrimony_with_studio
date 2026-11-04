// Isolated PostgreSQL acceptance of the production guard definitions, not a live GoTrue session.
import {PGlite}from'@electric-sql/pglite';import{readFile}from'node:fs/promises';import{test,after,beforeEach}from'node:test';import assert from'node:assert/strict';
const db=new PGlite();after(()=>db.close());
const owner='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002',admin='10000000-0000-4000-8000-000000000003';
const session='20000000-0000-4000-8000-000000000001',otherSession='20000000-0000-4000-8000-000000000002';
await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
insert into auth.users values('${owner}',now()),('${other}',null),('${admin}',now());
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));
create table public.profiles(id uuid primary key,is_admin boolean default false,suspended_at timestamptz,deactivated_at timestamptz,deletion_requested_at timestamptz);
insert into public.profiles(id,is_admin)values('${owner}',false),('${other}',false),('${admin}',true);
create function auth.jwt()returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create function auth.uid()returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
-- Exact guard definitions inspected from production on 4 November.
create function private.account_session_active()returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions s join public.profiles p on p.id=s.user_id
 where s.id=nullif(auth.jwt()->>'session_id','')::uuid and s.user_id=auth.uid()
 and p.deletion_requested_at is null)$$;
create function public.member_is_active(p_id uuid)returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=p_id and suspended_at is null and deactivated_at is null and deletion_requested_at is null)$$;
create function public.is_admin()returns boolean language sql stable security definer set search_path='' as $$select coalesce((select is_admin from public.profiles where id=auth.uid()),false)$$;
create table public.member_trials(user_id uuid primary key,starts_at timestamptz,ends_at timestamptz,duration_months integer,promo_code_id uuid);
create table public.admin_audit_log(actor_id uuid,action text,target_type text,target_id text,metadata jsonb);
grant usage on schema public,auth,private to anon,authenticated;`);
await db.exec(await readFile('supabase/migrations/20261104125818_two_month_premium_offer.sql','utf8'));
async function caller(id=owner,sid=session,extra={}){await db.exec('reset role');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,session_id:sid,role:'authenticated',...extra})]);await db.exec('set role authenticated');}
const claim=()=>db.query('select public.claim_premium_launch_offer() result');
beforeEach(async()=>{await db.exec(`reset role;delete from premium_launch_offers;delete from member_trials;delete from admin_audit_log;delete from auth.sessions;insert into auth.sessions values('${session}','${owner}'),('${otherSession}','${other}');update profiles set suspended_at=null,deactivated_at=null,deletion_requested_at=null;`);await caller();});
test('confirmed real-session row and active profile grant exactly one two-month window',async()=>{const first=(await claim()).rows[0].result;const second=(await claim()).rows[0].result;assert.deepEqual(second,first);assert.equal(first.durationMonths,2);await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from admin_audit_log')).rows[0].n,1);});
test('deleted session denies claim and hides the previously owned offer',async()=>{await claim();await db.exec('reset role;delete from auth.sessions');await caller();await assert.rejects(claim(),/active account/);assert.equal((await db.query('select * from premium_launch_offers')).rows.length,0);});
test('another members session ID cannot authenticate a claim, including forged admin metadata',async()=>{await caller(owner,otherSession,{user_metadata:{is_admin:true}});await assert.rejects(claim(),/active account/);assert.equal((await db.query('select public.is_admin() allowed')).rows[0].allowed,false);});
test('missing session claim and unconfirmed email fail before any grant',async()=>{await caller(owner,'');await assert.rejects(claim(),/active account/);await caller(other,otherSession);await assert.rejects(claim(),/Confirm your email/);});
test('suspended, deactivated and deletion-pending members cannot activate',async()=>{for(const field of['suspended_at','deactivated_at','deletion_requested_at']){await db.exec(`reset role;update profiles set ${field}=now() where id='${owner}'`);await caller();await assert.rejects(claim(),/active account/);await db.exec(`reset role;update profiles set ${field}=null where id='${owner}'`);}});
test('owner-only reads and active admin reads do not grant write privileges',async()=>{await claim();await caller(other,otherSession);assert.equal((await db.query('select * from premium_launch_offers')).rows.length,0);await db.exec(`reset role;insert into auth.sessions values('20000000-0000-4000-8000-000000000003','${admin}')`);await caller(admin,'20000000-0000-4000-8000-000000000003');assert.equal((await db.query('select * from premium_launch_offers')).rows.length,1);await assert.rejects(db.exec("update premium_launch_offers set ends_at=ends_at+interval '1 month'"),/permission denied/);});
