import { NextResponse } from 'next/server';
import { z } from 'zod';
import { paymentGateway } from '@/lib/subscriptions/payment-gateway';
import { getServerSubscription } from '@/lib/subscriptions/server';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };
const Input = z.object({
 plan:z.enum(['plus','premium','premium_plus']),
 term:z.enum(['monthly','three_months','six_months'])
}).strict();

export async function POST(request:Request) {
 if(request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 try {
  const {user, subscription} = await getServerSubscription();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
  const parsed=Input.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Invalid plan or billing term'},{status:400,headers});
  // This environment flag is intentionally off by default, including production.
  if(process.env.STRIPE_CHECKOUT_ENABLED!=='true') {
   const gateway=paymentGateway();
   return NextResponse.json({error:gateway.readiness().reason,provider:gateway.provider,enabled:false},{status:503,headers});
  }
  const {stripeCheckoutReady,stripeRequest}=await import('@/lib/subscriptions/stripe-api');
  if(!stripeCheckoutReady())return NextResponse.json({error:'Stripe checkout has not passed activation checks.'},{status:503,headers});
  if(parsed.data.term!=='monthly'||parsed.data.plan==='premium_plus')return NextResponse.json({error:'Only monthly Plus and Premium are available.'},{status:400,headers});
  if(subscription && ['active','trialing','past_due'].includes(subscription.status) && subscription.current_period_end && new Date(subscription.current_period_end).getTime()>Date.now())
   return NextResponse.json({error:'Manage your existing membership before purchasing another.'},{status:409,headers});
  const plan=parsed.data.plan;
  const expected=plan==='plus'?499:799;
  const priceId=plan==='plus'?process.env.STRIPE_PRICE_PLUS_MONTHLY!:process.env.STRIPE_PRICE_PREMIUM_MONTHLY!;
  const price=await stripeRequest<{id:string;unit_amount:number;currency:string;active:boolean;recurring?:{interval:string}}>('prices/'+encodeURIComponent(priceId));
  if(price.id!==priceId||price.unit_amount!==expected||price.currency!=='gbp'||!price.active||price.recurring?.interval!=='month')
   return NextResponse.json({error:'The configured membership price does not match CupidMatch.'},{status:503,headers});
  const {createSupabaseAdminClient}=await import('@/lib/supabase/admin');
  const {randomUUID}=await import('node:crypto');
  const db=createSupabaseAdminClient();
  const idempotencyKey=randomUUID();
  const {data:intent,error:dbError}=await db.from('payment_intents').insert({
   user_id:user.id,provider:'stripe',plan_code:plan,billing_term:'monthly',
   amount_pence:expected,currency:'GBP',idempotency_key:idempotencyKey,status:'pending'
  }).select('id').single();
  if(dbError||!intent)throw new Error('Could not record pending checkout');
  const form=new URLSearchParams({
   mode:'subscription',
   'line_items[0][price]':priceId,
   'line_items[0][quantity]':'1',
   client_reference_id:intent.id,
   'metadata[cupidmatch_intent_id]':intent.id,
   'subscription_data[metadata][cupidmatch_intent_id]':intent.id,
   'subscription_data[metadata][cupidmatch_user_id]':user.id,
   success_url:new URL('/membership?checkout=return',request.url).toString(),
   cancel_url:new URL('/membership?checkout=cancelled',request.url).toString(),
  });
  if(user.email)form.set('customer_email',user.email);
  const session=await stripeRequest<{id:string;url:string}>('checkout/sessions',{
   method:'POST',body:form,idempotencyKey:'cupidmatch-checkout-'+intent.id
  });
  if(!/^cs_(test_|live_)/.test(session.id)||!session.url?.startsWith('https://checkout.stripe.com/'))throw new Error('Invalid checkout session');
  const {error:updateError}=await db.from('payment_intents').update({provider_reference:session.id}).eq('id',intent.id).eq('status','pending');
  if(updateError)throw updateError;
  return NextResponse.json({url:session.url,provider:'stripe'},{headers});
 } catch {
  return NextResponse.json({error:'Checkout is unavailable. No verified payment has been recorded.'},{status:503,headers});
 }
}
