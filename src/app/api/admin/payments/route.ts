import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/auth/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { tidePaymentReadiness } from '@/lib/subscriptions/tide-preparation';
import { publicCatalogue } from '@/lib/subscriptions/live-catalogue';
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
  return NextResponse.json({summary:summary.data,payments:(payments.data??[]).slice(0,25),trials:(trials.data??[]).slice(0,25),legacyTrials:(memberships.data?.legacyTrials??[]).slice(0,25),subscriptions:(memberships.data?.subscriptions??[]).slice(0,25),events:(events.data??[]).slice(0,25),hasMore:(memberships.data?.legacyTrials??[]).length>25||(memberships.data?.subscriptions??[]).length>25||results.slice(1).some(r=>Array.isArray(r.data)&&r.data.length>25),plans:await publicCatalogue(),readiness:tidePaymentReadiness()},{headers});
 }catch{return NextResponse.json({error:'Payment dashboard is unavailable. No payment state has changed.'},{status:503,headers});}
}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 try{
  if(!await requireServerAdmin())return NextResponse.json({error:'Forbidden'},{status:403,headers});
  const body=await request.json().catch(()=>null);
  if(!body||Object.keys(body).length!==1||body.action!=='disable')return NextResponse.json({error:'Only disabling payments is supported. Live activation requires a verified provider and approval.'},{status:400,headers});
  const db=await createSupabaseServerClient();const {error}=await db.rpc('disable_payments');if(error)throw error;
  return NextResponse.json({enabled:false},{headers});
 }catch{return NextResponse.json({error:'Could not confirm payments were disabled. Please retry.'},{status:503,headers});}
}
