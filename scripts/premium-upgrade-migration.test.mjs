import {PGlite} from '@electric-sql/pglite';import{readFile}from'node:fs/promises';import{test}from'node:test';import assert from'node:assert/strict';
test('upgrade from the staged six-month table preserves every stored timestamp',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create table auth.users(id uuid primary key,email_confirmed_at timestamptz);insert into auth.users values('10000000-0000-4000-8000-000000000001',now());
 create function auth.uid()returns uuid language sql as $$select '10000000-0000-4000-8000-000000000001'::uuid$$;
 create function private.account_session_active()returns boolean language sql as $$select true$$;
 create function public.member_is_active(uuid)returns boolean language sql as $$select true$$;
 create function public.is_admin()returns boolean language sql as $$select false$$;
 create table public.member_trials(user_id uuid,starts_at timestamptz,ends_at timestamptz,duration_months integer);
 create table public.admin_audit_log(actor_id uuid,action text,target_type text,target_id text,metadata jsonb);
 create table public.premium_launch_offers(user_id uuid primary key references auth.users(id),starts_at timestamptz not null,ends_at timestamptz not null,duration_months integer not null default 6 check(duration_months=6),check(ends_at=starts_at+interval '6 months'));
 insert into premium_launch_offers values('10000000-0000-4000-8000-000000000001','2026-11-01 10:30:00+00','2027-05-01 10:30:00+00',6);`);
 const before=(await db.query('select * from premium_launch_offers')).rows;
 await db.exec(await readFile('supabase/migrations/20261104125818_two_month_premium_offer.sql','utf8'));
 assert.deepEqual((await db.query('select * from premium_launch_offers')).rows,before);
 const r=(await db.query('select public.claim_premium_launch_offer() r')).rows[0].r;
 assert.equal(r.durationMonths,6);assert.equal(Date.parse(r.endsAt),Date.parse('2027-05-01T10:30:00Z'));
 }finally{await db.close();}
});
