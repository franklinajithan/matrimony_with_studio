import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/auth/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { publicCatalogue } from '@/lib/subscriptions/live-catalogue';
import { stripeCheckoutReady } from '@/lib/subscriptions/stripe-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 try{
  if(!await requireServerAdmin())return NextResponse.json({error:'Forbidden'},{status:403,headers});
  const page=Number(new URL(request.url).searchParams.get('page')??0);
  if(!Number.isSafeInteger(page)||page<0||page>10000)return NextResponse.json({error:'Invalid page'},{status:400,headers});
  const db=await createSupabaseServerClient();
  const results=await Promise.all([
   db.rpc('payment_summary'),
   db.from('payment_intents').select('id,user_id,plan_code,billing_term,amount_pence,currency,status,verified_at,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*25,page*25+25),
   db.from('premium_launch_offers').select('user_id,starts_at,ends_at,duration_months').order('ends_at',{ascending:false}).order('user_id',{ascending:false}).range(page*25,page*25+25),
   db.rpc('payment_memberships',{p_page:page}),
   db.from('payment_events').select('id,intent_id,previous_status,status,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*25,page*25+25),
  ]);
  if(results.some(r=>r.error))throw Error('Unavailable');
  const [summary,payments,trials,memberships,events]=results;
  let paymentsEnabled=false;
  if(stripeCheckoutReady()){
   try{
    const gate=await createSupabaseAdminClient().rpc('stripe_checkout_allowed');
    paymentsEnabled=!gate.error && gate.data===true;
   }catch {paymentsEnabled=false;}
  }
  const readiness={
   provider:'stripe' as const,
   mode:process.env.VERCEL_ENV==='production'?'live':'test',
   enabled:paymentsEnabled,
   reason:paymentsEnabled
    ?'Stripe live subscription checkout is enabled.'
    :'Stripe subscription checkout is paused or requires configuration.',
  };
  return NextResponse.json({summary:summary.data,payments:(payments.data??[]).slice(0,25),trials:(trials.data??[]).slice(0,25),legacyTrials:(memberships.data?.legacyTrials??[]).slice(0,25),subscriptions:(memberships.data?.subscriptions??[]).slice(0,25),events:(events.data??[]).slice(0,25),hasMore:(memberships.data?.legacyTrials??[]).length>25||(memberships.data?.subscriptions??[]).length>25||results.slice(1).some(r=>Array.isArray(r.data)&&r.data.length>25),plans:await publicCatalogue(),readiness},{headers});
 }catch{return NextResponse.json({error:'Payment dashboard is unavailable. No payment state has changed.'},{status:503,headers});}
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 try{
  if(!await requireServerAdmin())return NextResponse.json({error:'Forbidden'},{status:403,headers});
  const body=await request.json().catch(()=>null);
  if(!body || typeof body!=='object' || Array.isArray(body))return NextResponse.json({error:'Invalid payment action'},{status:400,headers});
  const keys=Object.keys(body);
  const disabling=keys.length===1&&body.action==='disable';
  const enabling=keys.length===2&&body.action==='enable_stripe'&&body.confirmation==='ENABLE STRIPE PAYMENTS';
  if(!disabling&&!enabling)return NextResponse.json({error:'Invalid payment action or confirmation'},{status:400,headers});
  // Server environment and account readiness must be explicitly approved
  // before any administrator can enable a new subscription checkout.
  if(enabling&&!stripeCheckoutReady())return NextResponse.json({error:'Stripe activation checks are incomplete. No payment state was changed.'},{status:503,headers});
  const db=await createSupabaseServerClient();
  const {error}=await db.rpc(enabling?'enable_stripe_payments':'disable_payments');
  if(error)throw error;
  return NextResponse.json({enabled:enabling},{headers});
 }catch{return NextResponse.json({error:'Could not confirm payment configuration change. No activation was confirmed.'},{status:503,headers});}
}
