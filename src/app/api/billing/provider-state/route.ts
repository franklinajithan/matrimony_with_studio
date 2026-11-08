import {NextResponse} from 'next/server';
import {stripeCheckoutReady,stripePortalReady} from '@/lib/subscriptions/stripe-api';
import {stripeConfiguration} from '@/lib/subscriptions/stripe-configuration';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
export const dynamic='force-dynamic';
export async function GET(){
 const conf=stripeConfiguration();
 let adminAllowed=false;
 if(stripeCheckoutReady() && process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED==='true'){
  try{
   const db=createSupabaseAdminClient();
   const gate=await db.rpc('stripe_checkout_allowed');
   adminAllowed=!gate.error && gate.data===true;
  }catch {adminAllowed=false;}
 }
 const webhookEnabled=conf.configured && process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED==='true';
 const ready=stripeCheckoutReady() && webhookEnabled && adminAllowed;
 return NextResponse.json({
  provider:'stripe',mode:conf.mode,configured:conf.configured,
  checkoutEnabled:ready,webhookEnabled,portalEnabled:stripePortalReady(),
  supportedCurrency:'GBP',supportedTerms:['monthly']
 },{headers:{'Cache-Control':'no-store'}});
}
