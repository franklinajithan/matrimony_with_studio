const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/load-ts.cjs');
const old=process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED;
after(()=>{if(old===undefined)delete process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED;else process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED=old;});
function fixture({checkoutReady=true,portalReady=true,gate=true,configured=true}={}){
 let rpcCount=0;
 const api=load('src/app/api/billing/provider-state/route.ts',{
  'next/server':{NextResponse:{json:(body,options={})=>({body,headers:options.headers})}},
  '@/lib/subscriptions/stripe-api':{stripeCheckoutReady:()=>checkoutReady,stripePortalReady:()=>portalReady},
  '@/lib/subscriptions/stripe-configuration':{stripeConfiguration:()=>({configured,mode:'live'})},
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({rpc:async name=>{assert.equal(name,'stripe_checkout_allowed');rpcCount++;return {data:gate,error:null};}})}
 });
 return {api,getRpcCount:()=>rpcCount};
}
test('enabled Stripe reports checkout, webhook, and portal separately',async()=>{
 process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED='true';
 const f=fixture();
 const r=await f.api.GET();
 assert.equal(r.body.checkoutEnabled,true);
 assert.equal(r.body.webhookEnabled,true);
 assert.equal(r.body.portalEnabled,true);
 assert.equal(f.getRpcCount(),1);
});
test('paused new checkout does not falsely disable existing member billing portal and webhooks',async()=>{
 process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED='true';
 const f=fixture({gate:false});
 const r=await f.api.GET();
 assert.equal(r.body.checkoutEnabled,false);
 assert.equal(r.body.webhookEnabled,true);
 assert.equal(r.body.portalEnabled,true);
});
test('disabled webhooks never report checkout enabled',async()=>{
 process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED='false';
 const f=fixture({checkoutReady:false});
 const r=await f.api.GET();
 assert.equal(r.body.checkoutEnabled,false);
 assert.equal(r.body.webhookEnabled,false);
 assert.equal(r.body.portalEnabled,true);
 assert.equal(f.getRpcCount(),0);
});
