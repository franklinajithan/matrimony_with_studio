const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/load-ts.cjs');
const keys=['STRIPE_CHECKOUT_ENABLED','STRIPE_PRICE_PLUS_MONTHLY','STRIPE_PRICE_PREMIUM_MONTHLY'];
const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
Object.assign(process.env,{
 STRIPE_CHECKOUT_ENABLED:'true',
 STRIPE_PRICE_PLUS_MONTHLY:'price_plusSynthetic123',
 STRIPE_PRICE_PREMIUM_MONTHLY:'price_premiumSynthetic123'
});
after(()=>{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
const intentId='10000000-0000-4000-8000-000000000001';
const user={id:'20000000-0000-4000-8000-000000000001',email:'sample@example.invalid'};
function fixture({plan='plus',priceAmount=499,priceActive=true,dbGate=true,sub=null,stripeReady=true}={}){
 const calls=[];
 const priceId=plan==='plus'?'price_plusSynthetic123':'price_premiumSynthetic123';
 const db={
  rpc:async name=>{calls.push(['rpc',name]);return {data:dbGate,error:null}},
  from:table=>{
   assert.equal(table,'payment_intents');
   return {
    insert:record=>{calls.push(['insert',record]);return {select:()=>({single:async()=>({data:{id:intentId},error:null})})}},
    update:record=>{calls.push(['update',record]);return {eq:()=>({eq:async()=>({error:null})})}}
   };
  }
 };
 const handler=load('src/app/api/billing/checkout/route.ts',{
  'next/server':{NextResponse:{json:(body,init={})=>Response.json(body,init)}},
  '@/lib/subscriptions/payment-gateway':{paymentGateway:()=>({provider:'stripe',readiness:()=>({reason:'Payments paused'})})},
  '@/lib/subscriptions/server':{getServerSubscription:async()=>({user,subscription:sub})},
  '@/lib/subscriptions/stripe-api':{
   stripeCheckoutReady:()=>stripeReady,
   stripeRequest:async(path,options)=>{
    calls.push(['stripe',path,options]);
    if(path.startsWith('prices/'))return {id:priceId,unit_amount:priceAmount,currency:'gbp',active:priceActive,recurring:{interval:'month'}};
    if(path==='checkout/sessions')return {id:'cs_live_synthetic123',url:'https://checkout.stripe.com/c/pay/cs_live_synthetic123'};
    throw new Error('Unexpected Stripe call');
   }
  },
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db}
 });
 return {handler,calls};
}
const request=(plan='plus',term='monthly')=>new Request('https://cupidmatch.co.uk/api/billing/checkout',{method:'POST',headers:{origin:'https://cupidmatch.co.uk','content-type':'application/json'},body:JSON.stringify({plan,term})});
test('monthly Plus checkout creates pending intent and Stripe subscription session without charging',async()=>{
 const f=fixture();const response=await f.handler.POST(request());const body=await response.json();
 assert.equal(response.status,200);assert.equal(body.provider,'stripe');
 assert.match(body.url,/^https:\/\/checkout\.stripe\.com\//);
 const inserted=f.calls.find(x=>x[0]==='insert')[1];assert.equal(inserted.amount_pence,499);
 assert.equal(inserted.currency,'GBP');assert.equal(inserted.user_id,user.id);assert.equal(inserted.status,'pending');
 const session=f.calls.find(x=>x[0]==='stripe'&&x[1]==='checkout/sessions')[2];
 assert.equal(session.body.get('mode'),'subscription');
 assert.equal(session.body.get('client_reference_id'),intentId);
 assert.equal(session.body.get('subscription_data[metadata][cupidmatch_intent_id]'),intentId);
 assert.equal(session.body.get('line_items[0][quantity]'),'1');
 assert.equal(session.body.get('line_items[0][price]'),'price_plusSynthetic123');
});
test('monthly Premium checkout uses exact Premium price and amount',async()=>{
 const f=fixture({plan:'premium',priceAmount:799});
 const response=await f.handler.POST(request('premium'));assert.equal(response.status,200);
 assert.equal(f.calls.find(x=>x[0]==='insert')[1].amount_pence,799);
 assert.equal(f.calls.find(x=>x[0]==='stripe'&&x[1]==='checkout/sessions')[2].body.get('line_items[0][price]'),'price_premiumSynthetic123');
});
test('mismatched Stripe price, disabled database gate and paid existing membership cannot charge',async()=>{
 const invalid=fixture({priceAmount:799});
 assert.equal((await invalid.handler.POST(request())).status,503);
 assert.equal(invalid.calls.some(x=>x[0]==='insert'),false);
 const gated=fixture({dbGate:false});
 assert.equal((await gated.handler.POST(request())).status,503);
 assert.equal(gated.calls.some(x=>x[0]==='insert'),false);
 const existing=fixture({sub:{status:'active',current_period_end:new Date(Date.now()+86400000).toISOString()}});
 assert.equal((await existing.handler.POST(request())).status,409);
 assert.equal(existing.calls.length,0);
});
