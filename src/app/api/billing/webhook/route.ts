import { NextResponse } from 'next/server';
import { paidInvoicePeriod } from '@/lib/subscriptions/stripe-invoice-period';
export const runtime='nodejs';
const safe={ 'Cache-Control':'no-store' };
const kinds=new Set([
 'checkout.session.completed','checkout.session.async_payment_succeeded',
 'invoice.paid','invoice.payment_failed',
 'customer.subscription.updated','customer.subscription.deleted'
]);
type Obj=Record<string,any>;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function subscriptionRef(type:string,obj:Obj):string|null {
 if(type.startsWith('customer.subscription.'))return typeof obj.id==='string'?obj.id:null;
 if(type.startsWith('checkout.session.'))return typeof obj.subscription==='string'?obj.subscription:null;
 if(type.startsWith('invoice.'))return typeof obj.parent?.subscription_details?.subscription==='string'
  ?obj.parent.subscription_details.subscription:typeof obj.subscription==='string'?obj.subscription:null;
 return null;
}
export async function POST(request:Request) {
 if(process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED!=='true')return NextResponse.json({error:'Webhook processing is not enabled.'},{status:503,headers:safe});
 try {
  const {stripeRequest}=await import('@/lib/subscriptions/stripe-api');
  const {verifyStripeWebhookSignature}=await import('@/lib/subscriptions/stripe-webhook-signature');
  const secret=process.env.STRIPE_WEBHOOK_SECRET||'';
  const raw=await request.text();
  if(raw.length>1024*1024)return NextResponse.json({error:'Payload too large'},{status:413,headers:safe});
  if(!verifyStripeWebhookSignature(raw,request.headers.get('stripe-signature'),secret))
   return NextResponse.json({error:'Invalid Stripe signature'},{status:400,headers:safe});
  const event=JSON.parse(raw);
  if(!event||!/^evt_[A-Za-z0-9]+$/.test(event.id)||typeof event.type!=='string')
   return NextResponse.json({error:'Invalid event'},{status:400,headers:safe});
  if(!kinds.has(event.type))return NextResponse.json({received:true,ignored:true},{headers:safe});
  const obj=event.data?.object as Obj|undefined;
  if(!obj)return NextResponse.json({error:'Invalid event object'},{status:400,headers:safe});
  const subId=subscriptionRef(event.type,obj);
  if(!subId||!/^sub_[A-Za-z0-9]+$/.test(subId))return NextResponse.json({received:true,ignored:true},{headers:safe});
  const subscription=await stripeRequest<{
   id:string;customer:string;status:string;cancel_at_period_end:boolean;
   current_period_start?:number;current_period_end?:number;
   items:{data:Array<{price:{id:string};current_period_start?:number;current_period_end?:number}>};
   metadata:Record<string,string>;
  }>('subscriptions/'+encodeURIComponent(subId));
  if(subscription.id!==subId || !/^cus_[A-Za-z0-9]+$/.test(subscription.customer))
   throw new Error('Stripe subscription mismatch');
  const intentId=subscription.metadata?.cupidmatch_intent_id;
  if(!intentId||!uuid.test(intentId))return NextResponse.json({received:true,ignored:true},{headers:safe});
  const item=subscription.items?.data?.[0];
  if(subscription.items?.data?.length!==1 || !item)throw new Error('Unexpected subscription items');
  const priceId=item.price.id;
  const expectedPlan=priceId===process.env.STRIPE_PRICE_PLUS_MONTHLY?'plus':
   priceId===process.env.STRIPE_PRICE_PREMIUM_MONTHLY?'premium':null;
  const expected=expectedPlan==='plus'?499:expectedPlan==='premium'?799:null;
  if(expected===null||!expectedPlan)throw new Error('Stripe subscription is not a configured plan');
  if(event.type.startsWith('checkout.session.')) {
   if(obj.client_reference_id!==intentId||obj.subscription!==subId)
    throw new Error('Checkout reference mismatch');
  }
  let paid=false;
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded') {
   paid=obj.payment_status==='paid';
  } else if(event.type==='invoice.paid'){
   paid=obj.paid===true && obj.status==='paid' && obj.currency==='gbp' && Number(obj.amount_paid)>=expected;
  }
  let start=item.current_period_start??subscription.current_period_start;
  let end=item.current_period_end??subscription.current_period_end;
  if(event.type==='invoice.paid') {
   // A paid invoice proves only its own service period, never a later period
   // already visible on the Stripe subscription due to out-of-order delivery.
   const invoicePeriod=paidInvoicePeriod(obj,subId,priceId);
   if(!invoicePeriod)throw new Error('Paid invoice period cannot be verified');
   start=invoicePeriod.start;
   end=invoicePeriod.end;
  }
  if(typeof start!=='number'||typeof end!=='number'||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end<=start)throw new Error('Invalid billing period');
  const {createSupabaseAdminClient}=await import('@/lib/supabase/admin');
  const db=createSupabaseAdminClient();
  const {error}=await db.rpc('apply_verified_stripe_subscription',{
   p_event_id:event.id,p_intent_id:intentId,p_plan_code:expectedPlan,
   p_subscription_id:subId,p_customer_id:subscription.customer,
   p_paid:paid,p_stripe_status:subscription.status,
   p_period_start:new Date(start*1000).toISOString(),
   p_period_end:new Date(end*1000).toISOString(),
   p_cancel_at_period_end:!!subscription.cancel_at_period_end,
  });
  if(error)throw new Error('Stripe reconciliation failed');
  return NextResponse.json({received:true},{headers:safe});
 } catch {
  // Failure responses tell Stripe to retry. Never expose event details or secrets.
  return NextResponse.json({error:'Unable to verify and reconcile Stripe event'},{status:503,headers:safe});
 }
}
