const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { load } = require('./helpers/load-ts.cjs');

const SECRET='whsec_synthetic_test_only';
const PLUS='price_plusSynthetic123';
const PREMIUM='price_premiumSynthetic123';
const previous=Object.fromEntries(['STRIPE_WEBHOOK_PROCESSING_ENABLED','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_PLUS_MONTHLY','STRIPE_PRICE_PREMIUM_MONTHLY'].map(key=>[key,process.env[key]]));
Object.assign(process.env,{
 STRIPE_WEBHOOK_PROCESSING_ENABLED:'true',
 STRIPE_WEBHOOK_SECRET:SECRET,
 STRIPE_PRICE_PLUS_MONTHLY:PLUS,
 STRIPE_PRICE_PREMIUM_MONTHLY:PREMIUM,
});
after(()=>{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});

const intent='10000000-0000-4000-8000-000000000001';
const sub='sub_synthetic123';
const customer='cus_synthetic123';
const start=Math.floor(Date.now()/1000)-3600;
const end=start+30*86400;
const signature=load('src/lib/subscriptions/stripe-webhook-signature.ts').verifyStripeWebhookSignature;

function fixture({stripeStatus='active',dbError=null,wrongPrice=false}={}) {
 const rpcCalls=[];const stripeCalls=[];
 const subscription={
  id:sub,customer,status:stripeStatus,cancel_at_period_end:false,
  current_period_start:start,current_period_end:end,
  items:{data:[{price:{id:wrongPrice?'price_wrong':PLUS},current_period_start:start,current_period_end:end}]},
  metadata:{cupidmatch_intent_id:intent}
 };
 const webhookHandler=load('src/app/api/billing/webhook/route.ts',{
  'next/server':{NextResponse:{json:(body,init={})=>Response.json(body,init)}},
  '@/lib/subscriptions/stripe-invoice-period':load('src/lib/subscriptions/stripe-invoice-period.ts'),
  '@/lib/subscriptions/stripe-api':{stripeRequest:async path=>{stripeCalls.push(path);return subscription}},
  '@/lib/subscriptions/stripe-webhook-signature':{verifyStripeWebhookSignature:signature},
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({rpc:async(name,args)=>{rpcCalls.push({name,args});return {error:dbError}}})}
 });
 return {webhookHandler,rpcCalls,stripeCalls};
}
async function send(f,event,{tamper=false,malformedSignature=false}={}) {
 const raw=JSON.stringify(event);const stamp=Math.floor(Date.now()/1000);
 const hash=createHmac('sha256',SECRET).update(stamp+'.'+raw).digest('hex');
 const header=malformedSignature?`t=${stamp},v1=0000`:`t=${stamp},v1=${hash}`;
 const response=await f.webhookHandler.POST(new Request('https://cupidmatch.co.uk/api/billing/webhook',{
  method:'POST',headers:{'stripe-signature':header,'content-type':'application/json'},
  body:tamper?raw+' ':raw
 }));
 return {status:response.status,body:await response.json()};
}
const checkout=(paymentStatus='paid',id='evt_checkoutSynthetic1')=>({
 id,type:'checkout.session.completed',
 data:{object:{id:'cs_live_synthetic',subscription:sub,client_reference_id:intent,payment_status:paymentStatus}}
});
const invoice=(id='evt_invoiceSynthetic1')=>({
 id,type:'invoice.paid',data:{object:{
  id:'in_synthetic123',paid:true,status:'paid',currency:'gbp',amount_paid:499,
  parent:{subscription_details:{subscription:sub}},
  lines:{has_more:false,data:[{
   pricing:{type:'price_details',price_details:{price:PLUS}},
   parent:{subscription_item_details:{subscription:sub,proration:false}},
   period:{start,end}
  }]}
 }}
});

test('authentic paid checkout invokes one verified membership reconciliation',async()=>{
 const f=fixture();const result=await send(f,checkout());
 assert.equal(result.status,200);assert.equal(f.rpcCalls.length,1);
 assert.equal(f.rpcCalls[0].name,'apply_verified_stripe_subscription');
 const p=f.rpcCalls[0].args;assert.equal(p.p_paid,true);assert.equal(p.p_plan_code,'plus');
 assert.equal(p.p_intent_id,intent);assert.equal(p.p_subscription_id,sub);
 assert.deepEqual(f.stripeCalls,['subscriptions/'+sub]);
});
test('unpaid checkout can never grant paid membership',async()=>{
 const f=fixture();const result=await send(f,checkout('unpaid','evt_checkoutUnpaid123'));
 assert.equal(result.status,200);assert.equal(f.rpcCalls.length,1);
 assert.equal(f.rpcCalls[0].args.p_paid,false);
});
test('signed invoice renewal reconciles exact paid invoice period',async()=>{
 const f=fixture();const result=await send(f,invoice());
 assert.equal(result.status,200);assert.equal(f.rpcCalls.length,1);
 assert.equal(f.rpcCalls[0].args.p_paid,true);
 assert.equal(f.rpcCalls[0].args.p_period_start,new Date(start*1000).toISOString());
 assert.equal(f.rpcCalls[0].args.p_period_end,new Date(end*1000).toISOString());
});
test('invoices with wrong subscription, truncated lines or wrong price fail closed',async()=>{
 for(const mutate of [
  e=>{e.data.object.lines.data[0].parent.subscription_item_details.subscription='sub_wrong';},
  e=>{e.data.object.lines.has_more=true;},
  e=>{e.data.object.lines.data[0].pricing.price_details.price='price_wrong';}
 ]) {
  const f=fixture();const event=invoice('evt_invoiceRejected123');mutate(event);
  const result=await send(f,event);assert.equal(result.status,503);
  assert.equal(f.rpcCalls.length,0);
 }
});
test('invalid or tampered signature cannot reach Stripe or the database',async()=>{
 for(const type of [{tamper:true},{malformedSignature:true}]){
  const f=fixture();const response=await send(f,checkout(),type);
  assert.equal(response.status,400);assert.equal(f.stripeCalls.length,0);
  assert.equal(f.rpcCalls.length,0);
 }
});
test('wrong Stripe price and database failures return retryable errors and no membership success',async()=>{
 const wrong=fixture({wrongPrice:true});
 assert.equal((await send(wrong,checkout())).status,503);
 assert.equal(wrong.rpcCalls.length,0);
 const failed=fixture({dbError:{code:'synthetic_db_failure',message:'private synthetic error'}});
 const response=await send(failed,checkout());
 assert.equal(response.status,503);assert.doesNotMatch(JSON.stringify(response.body),/private synthetic/);
});
