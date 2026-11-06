import {NextResponse} from 'next/server';
import {stripeCheckoutReady} from '@/lib/subscriptions/stripe-api';
import {stripeConfiguration} from '@/lib/subscriptions/stripe-configuration';
export const dynamic='force-dynamic';
export async function GET(){
 const conf=stripeConfiguration();
 const ready=stripeCheckoutReady() && process.env.STRIPE_WEBHOOK_PROCESSING_ENABLED==='true';
 return NextResponse.json({
  provider:'stripe',mode:conf.mode,
  configured:conf.configured,checkoutEnabled:ready,webhookEnabled:ready,portalEnabled:ready,
  supportedCurrency:'GBP',supportedTerms:['monthly']
 },{headers:{'Cache-Control':'no-store'}});
}
