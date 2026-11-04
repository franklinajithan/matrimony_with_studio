import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const user="10000000-0000-4000-8000-000000000001";
const other="10000000-0000-4000-8000-000000000002";

test("membership pricing migrations enforce audited edits and atomic monthly quotas",async()=>{
 const db=new PGlite();
 const run=async(stage,sql)=>{try{await db.exec(sql)}catch(e){throw new Error(`${stage}: ${e instanceof Error?e.message:String(e)}`,{cause:e});}};
 try{
 await run("bootstrap",`create role anon;create role authenticated;
 create schema auth;create schema private;
 create table auth.users(id uuid primary key);
 insert into auth.users values('${user}'),('${other}');
 create function auth.uid() returns uuid language sql stable as $$ select '${user}'::uuid $$;
 create function public.is_admin() returns boolean language sql stable as $$ select false $$;
 create table public.subscription_plans(code text primary key,name text,currency text,monthly_price_pence integer,three_month_price_pence integer,six_month_price_pence integer,is_active boolean,entitlements jsonb,updated_at timestamptz,sort_order integer);
 create table public.admin_audit_log(actor_id uuid,action text,target_type text,target_id text,metadata jsonb);
 create table public.user_subscriptions(user_id uuid,plan_code text,status text,current_period_end timestamptz,created_at timestamptz);
 create table public.member_trials(user_id uuid,starts_at timestamptz,ends_at timestamptz);
 create table public.premium_launch_offers(user_id uuid,starts_at timestamptz,ends_at timestamptz);
 create table public.subscription_usage(user_id uuid,feature_key text,period_start date,used_count integer,updated_at timestamptz default now(), primary key(user_id,feature_key,period_start));
 create table public.profiles(id uuid primary key,is_published boolean,suspended_at timestamptz);
 create table public.match_requests(id text primary key,sender_id uuid,receiver_id uuid,status text,created_at timestamptz default now());
 create table public.messages(id uuid default gen_random_uuid() primary key,chat_id text,sender_id uuid,text text);
 insert into public.profiles values('${user}',true,null),('${other}',true,null);
 insert into public.subscription_plans values
 ('free','Free','GBP',0,null,null,true,'{"interestsPerMonth":10,"messagesPerMonth":2,"profileViewsPerMonth":50,"searchPlacement":0,"advancedFilters":false}',now(),1),
 ('plus','Plus','GBP',499,null,null,true,'{"interestsPerMonth":30,"messagesPerMonth":30,"profileViewsPerMonth":400,"searchPlacement":20,"advancedFilters":true}',now(),2),
 ('premium','Premium','GBP',799,null,null,true,'{"interestsPerMonth":null,"messagesPerMonth":null,"profileViewsPerMonth":null,"searchPlacement":10,"advancedFilters":true}',now(),3);`);
 await run("admin-price-migration",await readFile("supabase/migrations/20261104202700_admin_subscription_pricing.sql","utf8"));
 await run("membership-quota-migration",await readFile("supabase/migrations/20261104204000_membership_quotas.sql","utf8"));
 const rows=(await db.query("select code,monthly_price_pence,entitlements->>'interestsPerMonth' interests from public.subscription_plans order by sort_order")).rows;
 assert.deepEqual(rows.map(row=>[row.code,row.monthly_price_pence,row.interests]),[["free",0,"2"],["plus",499,"30"],["premium",799,null]]);
 const updatedAt=(await db.query("select updated_at from public.subscription_plans where code='plus'")).rows[0].updated_at;
 await assert.rejects(db.query("select public.admin_update_subscription_plan('plus',599,null,null,'{\"interestsPerMonth\":30}'::jsonb,$1)",[updatedAt]),/Not authorized/);
 await db.exec("create or replace function public.is_admin() returns boolean language sql stable as $$ select true $$;");
 const plan=(await db.query("select entitlements from public.subscription_plans where code='plus'")).rows[0].entitlements;
 const changed={...plan,interestsPerMonth:31};
 const updated=await db.query("select public.admin_update_subscription_plan('plus',599,null,null,$1::jsonb,$2::timestamptz) as value",[JSON.stringify(changed),updatedAt]);
 assert.equal(updated.rows[0].value.monthly_price_pence,599);
 assert.equal((await db.query("select count(*)::int n from public.admin_audit_log")).rows[0].n,1);
 await assert.rejects(db.query("select public.admin_update_subscription_plan('plus',499,null,null,$1::jsonb,$2::timestamptz)",[JSON.stringify(changed),updatedAt]),/modified/);
 await db.query("insert into public.match_requests(id,sender_id,receiver_id,status) values ('m1',$1,$2,'pending'),('m2',$1,$2,'pending')",[user,other]);
 await assert.rejects(db.query("insert into public.match_requests(id,sender_id,receiver_id,status) values ('m3',$1,$2,'pending')",[user,other]),/Monthly membership limit/);
 await db.query("insert into public.messages(chat_id,sender_id,text) values ('c1',$1,'hello'),('c1',$1,'hello again')",[user]);
 await assert.rejects(db.query("insert into public.messages(chat_id,sender_id,text) values ('c1',$1,'third')",[user]),/Monthly membership limit/);
 let count=(await db.query("select used_count from public.subscription_usage where user_id=$1 and feature_key='messagesPerMonth'",[user])).rows[0].used_count;
 assert.equal(count,2);
 const viewed1=(await db.query("select public.consume_member_profile_view($1) as value",[other])).rows[0].value;
 const viewed2=(await db.query("select public.consume_member_profile_view($1) as value",[other])).rows[0].value;
 assert.equal(viewed1.charged,true);assert.equal(viewed2.charged,false);
 count=(await db.query("select used_count from public.subscription_usage where user_id=$1 and feature_key='profileViewsPerMonth'",[user])).rows[0].used_count;
 assert.equal(count,1);
 }finally{await db.close();}
});
