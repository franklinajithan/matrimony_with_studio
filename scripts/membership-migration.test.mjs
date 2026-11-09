import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const user="10000000-0000-4000-8000-000000000001";
const other="10000000-0000-4000-8000-000000000002";

test("membership pricing migrations enforce audited edits and atomic monthly quotas",async()=>{
 const db=new PGlite();
 const run=async(stage,sql)=>{try{await db.exec(sql)}catch(e){throw new Error(`${stage}: ${e instanceof Error?e.message:String(e)} (position ${e?.position??"none"}, detail ${e?.detail??"none"}, internal ${e?.internalQuery??"none"})`,{cause:e});}};
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
 const adminSql=await readFile("supabase/migrations/20261104202700_admin_subscription_pricing.sql","utf8");
 const atFunction=adminSql.indexOf("create or replace function public.admin_update_subscription_plan(");
 const atGrant=adminSql.indexOf("\nrevoke all on function public.admin_update_subscription_plan");
 await run("admin-permission-revoke",adminSql.slice(0,atFunction));
 await run("admin-pricing-function",adminSql.slice(atFunction,atGrant));
 await run("admin-function-grants",adminSql.slice(atGrant));
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
 await run("allowance snapshot migration",await readFile("supabase/migrations/20261109095845_membership_allowance_snapshot.sql","utf8"));
 await assert.rejects(db.query("insert into public.match_requests(id,sender_id,receiver_id,status) values ('bypass',$1,$2,'accepted')", [user,other]), /must be pending/);
 await assert.rejects(db.query("update public.match_requests set receiver_id=$1 where id='m1'", [user]), /participants cannot be changed/);
 await assert.rejects(db.query("update public.match_requests set status='accepted' where id='m1'"), /Only the recipient/);
 const snapshot = async () => (await db.query("select public.my_membership_allowances() as value")).rows[0].value;
 let membership = await snapshot();
 assert.equal(membership.plan, "free");
 assert.equal(membership.profileHighlighting, false);
 assert.equal(membership.advancedFilters, false);
 assert.deepEqual(membership.allowances.messagesPerMonth, { used: 2, limit: 2, remaining: 0 });
 assert.deepEqual(membership.allowances.profileViewsPerMonth, { used: 1, limit: 50, remaining: 49 });
 assert.equal(membership.resetsAt, (await db.query("select ((date_trunc('month',now() at time zone 'UTC') + interval '1 month')::date)::text as reset")).rows[0].reset);
 await assert.rejects(db.query("select * from public.consume_subscription_usage('interestsPerMonth',null)"), /Unsupported feature/);
 await db.exec("update public.subscription_plans set entitlements = entitlements || '{\"profileBoostsPerMonth\":0}'::jsonb where code='free'");
 assert.deepEqual((await db.query("select * from public.consume_subscription_usage('profileBoostsPerMonth',null)")).rows, [
   { allowed: false, used_count: 0 },
 ]);
 const free = (await db.query("select entitlements, updated_at from public.subscription_plans where code='free'")).rows[0];
 await db.query("select public.admin_update_subscription_plan('free',0,null,null,$1::jsonb,$2::timestamptz)", [
   JSON.stringify({ ...free.entitlements, messagesPerMonth: 3, profileHighlighting: true }), free.updated_at,
 ]);
 membership = await snapshot();
 assert.equal(membership.profileHighlighting, true);
 assert.deepEqual(membership.allowances.messagesPerMonth, { used: 2, limit: 3, remaining: 1 });
 await db.query("insert into public.messages(chat_id,sender_id,text) values ('c1',$1,'allowed after change')", [user]);
 await db.query("insert into public.user_subscriptions values ($1,'premium','active',now() + interval '1 day',now())", [user]);
 membership = await snapshot();
 assert.equal(membership.plan, "premium");
 assert.deepEqual(membership.allowances.messagesPerMonth, { used: 3, limit: null, remaining: null });
 await db.query("update public.user_subscriptions set current_period_end=now()-interval '1 day' where user_id=$1", [user]);
 membership = await snapshot();
 assert.equal(membership.plan, "free");
 assert.deepEqual(membership.allowances.messagesPerMonth, { used: 3, limit: 3, remaining: 0 });
 await assert.rejects(db.query("insert into public.messages(chat_id,sender_id,text) values ('c1',$1,'over limit after expiry')", [user]), /Monthly membership limit/);
 await db.exec(`
   alter table public.messages add column is_read boolean default false;
   alter table public.messages add column created_at timestamptz default clock_timestamp();
   create table public.chats(id text primary key, participant_1 uuid, participant_2 uuid,
     unread_by jsonb, last_message_text text, last_message_sender_id uuid, last_message_at timestamptz);
   insert into public.chats(id,participant_1,participant_2) values('c1','${user}','${other}');
   create view public.discovery_profiles as select id, 'Name'::text as display_name, 'private bio'::text as bio,
     null::text as photo_url, null::text as data_ai_hint, null::text as location, null::text as profession,
     null::text as country, null::text as region, '[]'::jsonb as languages, false as is_verified,
     '["gallery"]'::jsonb as additional_photo_urls, 30 as age_years, now() as created_at, now() as updated_at,
     null::text as religion, '170'::text as height, 'Degree'::text as education_level, null::text as smoking_habits,
     null::text as drinking_habits, '{}'::jsonb as relationship_intentions, '{}'::jsonb as values_lifestyle,
     '{}'::jsonb as cultural_family, '{}'::jsonb as settlement, '{"matchDetails":{"maritalStatus":"Never married"}}'::jsonb as extra
     from public.profiles where is_published and suspended_at is null;
   grant usage on schema auth to authenticated;
   grant select on public.chats, public.messages to authenticated;
   grant insert on public.messages to authenticated;
   grant update on public.chats to authenticated;
 `);
 await run("profile and message enforcement",await readFile("supabase/migrations/20261109101448_enforce_member_profile_access.sql","utf8"));
 await db.exec("set role authenticated");
 let card = (await db.query("select bio, height, additional_photo_urls from public.discovery_profiles where id=$1",[other])).rows[0];
 assert.deepEqual(card, { bio: null, height: null, additional_photo_urls: [] });
 await assert.rejects(db.query("select * from private.membership_profile_details"), /permission denied/);
 const detail = (await db.query("select public.open_member_profile($1) as value",[other])).rows[0].value;
 assert.equal(detail.bio,"private bio");
 await db.exec("reset role");
 await db.exec(`insert into public.user_subscriptions values ('${user}','plus','active',now() + interval '1 day',now())`);
 await db.exec("set role authenticated");
 card = (await db.query("select bio, height, additional_photo_urls from public.discovery_profiles where id=$1",[other])).rows[0];
 assert.deepEqual(card, { bio: null, height: "170", additional_photo_urls: [] });
 const message = "10000000-0000-4000-8000-000000000003";
 await db.query("select public.send_member_message($1,'c1','same message')",[message]);
 await db.query("select public.send_member_message($1,'c1','same message')",[message]);
 await assert.rejects(db.query("select public.send_member_message($1,'c1','changed message')",[message]), /Message ID already used/);
 assert.equal((await snapshot()).allowances.messagesPerMonth.used,4);
 assert.equal((await db.query("select unread_by from public.chats where id='c1'")).rows[0].unread_by[other],1);
 await db.exec("reset role");
 const freshProfile = "10000000-0000-4000-8000-000000000004";
 await db.query("insert into auth.users values ($1)",[freshProfile]);
 await db.query("insert into public.profiles values ($1,true,null)",[freshProfile]);
 await db.exec("update public.subscription_usage set used_count=case feature_key when 'messagesPerMonth' then 29 when 'profileViewsPerMonth' then 400 else 30 end");
 await db.exec("set role authenticated");
 const lastPlus = "10000000-0000-4000-8000-000000000005";
 await db.query("select public.send_member_message($1,'c1','last Plus message')",[lastPlus]);
 await db.query("select public.send_member_message($1,'c1','last Plus message')",[lastPlus]);
 await assert.rejects(db.query("select public.send_member_message(gen_random_uuid(),'c1','over quota')"), /Monthly membership limit/);
 await assert.rejects(db.query("select public.open_member_profile($1)",[freshProfile]), /Monthly membership limit/);
 assert.equal((await snapshot()).allowances.messagesPerMonth.remaining,0);
 await db.exec("reset role");
 await db.exec("update public.user_subscriptions set plan_code='premium' where status='active'");
 await db.exec("set role authenticated");
 await db.query("select public.send_member_message(gen_random_uuid(),'c1','Premium message')");
 assert.equal((await db.query("select public.open_member_profile($1) as value",[freshProfile])).rows[0].value.bio,"private bio");
 assert.deepEqual((await snapshot()).allowances.profileViewsPerMonth,{used:401,limit:null,remaining:null});
 await db.exec("reset role");
 await db.exec("create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;");
 await assert.rejects(db.query("select public.my_membership_allowances()"), /Authentication required/);
 }finally{await db.close();}
});
