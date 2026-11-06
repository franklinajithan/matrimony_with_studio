import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
const db=new PGlite();
after(()=>db.close());
const intent='10000000-0000-4000-8000-000000000001';
const user='20000000-0000-4000-8000-000000000001';
await db.exec(\`
 create role service_role;
 create table public.payment_intents(
  id uuid primary key, user_id uuid not null,provider text not null,
  plan_code text not null,billing_term text not null,amount_pence integer not null,
  currency text not null,status text not null default 'pending',provider_reference text,
  verified_at timestamptz,updated_at timestamptz not null default now()
 );
 create table public.payment_events(
  id uuid primary key default gen_random_uuid(),intent_id uuid not null,
  provider text not null,provider_event_id text not null,previous_status text not null,
  status text not null,created_at timestamptz not null default now(),
  unique(provider,provider_event_id)
 );
 create table public.user_subscriptions(
  id uuid primary key default gen_random_uuid(),user_id uuid not null,plan_code text not null,
  status text not null,provider text,provider_customer_id text,provider_subscription_id text,
  current_period_start timestamptz,current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  payment_intent_id uuid unique,updated_at timestamptz not null default now()
 );
 insert into public.payment_intents(id,user_id,provider,plan_code,billing_term,amount_pence,currency)
 values('\${intent}','\${user}','stripe','plus','monthly',499,'GBP');
\`);
await db.exec(await readFile('supabase/migrations/20261106121500_stripe_verified_webhook_memberships.sql','utf8'));
const start=new Date(Date.now()-86400000).toISOString();
const end=new Date(Date.now()+29*86400000).toISOString();
const apply=(event,paid,status,customer='cus_good123',intentId=intent,sub='sub_good123')=>db.query(
 'select public.apply_verified_stripe_subscription($1,$2,$3,$4,$5,$6,$7,$8,$9) accepted',
 [event,intentId,sub,customer,paid,status,start,end,false]
);
test('pending webhook does not grant membership and paid webhook activates Plus exactly once',async()=>{
 const pending=await apply('evt_pending123',false,'active');
 assert.equal(pending.rows[0].accepted,true);
 assert.equal((await db.query('select count(*)::integer n from user_subscriptions')).rows[0].n,0);
 const paid=await apply('evt_paid123',true,'active');
 assert.equal(paid.rows[0].accepted,true);
 assert.equal((await apply('evt_paid123',true,'active')).rows[0].accepted,false);
 const rows=(await db.query('select plan_code,status,provider_subscription_id from user_subscriptions')).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].plan_code,'plus');
 assert.equal(rows[0].status,'active');assert.equal(rows[0].provider_subscription_id,'sub_good123');
 assert.equal((await db.query('select status from payment_intents where id=$1',[intent])).rows[0].status,'paid');
 assert.equal((await db.query('select count(*)::integer n from payment_events')).rows[0].n,2);
});
test('cancellation changes subscription without erasing paid payment records',async()=>{
 await apply('evt_cancel123',false,'canceled');
 assert.equal((await db.query('select status from user_subscriptions')).rows[0].status,'cancelled');
 assert.equal((await db.query('select status from payment_intents')).rows[0].status,'paid');
});
test('unrecognized payment intent cannot create entitlement',async()=>{
 await assert.rejects(apply('evt_bad123',true,'active','cus_good123','30000000-0000-4000-8000-000000000003'));
 assert.equal((await db.query('select count(*)::integer n from user_subscriptions')).rows[0].n,1);
});
