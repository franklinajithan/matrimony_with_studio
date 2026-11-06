import {PGlite} from "@electric-sql/pglite";
import {readFile} from "node:fs/promises";
import {test} from "node:test";
import assert from "node:assert/strict";
test("country pricing migration: admin writes, audits, conflict protection, and read permissions",async()=>{
 const db=new PGlite();
 try{
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    insert into auth.users values ('10000000-0000-4000-8000-000000000001');
    create function auth.uid() returns uuid language sql stable as $$ select '10000000-0000-4000-8000-000000000001'::uuid $$;
    create function public.is_admin() returns boolean language sql stable as $$ select false $$;
    create table public.admin_audit_log(actor_id uuid,action text,target_type text,target_id text,metadata jsonb);
    create table public.subscription_plans(code text primary key);
  `);
  const migration=await readFile("supabase/migrations/20261106073000_country_membership_prices.sql","utf8");
  await db.exec(migration);
  await assert.rejects(db.query("select public.admin_list_country_prices()"),/Administrator required/);
  await assert.rejects(db.query("select public.admin_save_country_prices('LK','LKR',true,149900,249900,null,null,null,null,null)"),/Administrator required/);
  await db.exec("create or replace function public.is_admin() returns boolean language sql stable as $$ select true $$;");
  await assert.rejects(db.query("select public.admin_save_country_prices('GB','GBP',true,499,799,null,null,null,null,null)"),/Invalid country/);
  const first=await db.query("select public.admin_save_country_prices('LK','LKR',true,149900,249900,null,null,null,null,null) as item");
  assert.equal(first.rows[0].item.enabled,true);
  assert.equal(first.rows[0].item.plus_monthly_minor,149900);
  assert.equal((await db.query("select count(*)::integer n from public.admin_audit_log")).rows[0].n,1);
  const date=first.rows[0].item.updated_at;
  await assert.rejects(db.query("select public.admin_save_country_prices('LK','LKR',true,199900,299900,null,null,null,null,null)"),/Market changed/);
  const second=await db.query("select public.admin_save_country_prices('LK','LKR',false,199900,299900,null,null,null,null,$1) as item",[date]);
  assert.equal(second.rows[0].item.enabled,false);
  assert.equal((await db.query("select count(*)::integer n from public.admin_audit_log")).rows[0].n,2);
  await db.exec("set role authenticated");
  await assert.rejects(db.query("update public.subscription_country_prices set enabled=true"),/permission denied/);
  await db.exec("reset role");
 }finally{await db.close();}
});
