import { NextResponse } from 'next/server';
import { getServerSubscription } from '@/lib/subscriptions/server';
import { stripeCheckoutReady, stripeRequest } from '@/lib/subscriptions/stripe-api';
export const runtime = 'nodejs';
export async function POST(request:Request) {
 const headers={'Cache-Control':'private, no-store'};
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 if(!stripeCheckoutReady())return NextResponse.json({error:'Billing portal is not available yet.'},{status:503,headers});
 try {
  const {user,subscription}=await getServerSubscription();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
  if(!subscription?.provider_customer_id || !/^cus_[A-Za-z0-9]+$/.test(subscription.provider_customer_id))
   return NextResponse.json({error:'No eligible Stripe subscription found.'},{status:404,headers});
  const body=new URLSearchParams({customer:subscription.provider_customer_id,return_url:new URL('/membership',request.url).toString()});
  const portal=await stripeRequest<{url:string}>('billing_portal/sessions',{method:'POST',body});
  if(!portal.url?.startsWith('https://billing.stripe.com/'))throw new Error('Unexpected billing portal');
  return NextResponse.json({url:portal.url},{headers});
 }catch{return NextResponse.json({error:'Unable to open Stripe billing portal.'},{status:503,headers});}
}
