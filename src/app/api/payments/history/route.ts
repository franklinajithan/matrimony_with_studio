import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
 try {
  const db=await createSupabaseServerClient();
  const {data,error:authError}=await db.auth.getUser();
  if(authError||!data.user)return NextResponse.json({error:'Sign in to view payments.'},{status:401,headers});
  const page=Number(new URL(request.url).searchParams.get('page')??0);
  if(!Number.isSafeInteger(page)||page<0||page>10000)return NextResponse.json({error:'Invalid page.'},{status:400,headers});
  const {data:payments,error}=await db.from('payment_intents').select('id,plan_code,billing_term,amount_pence,currency,status,verified_at,created_at').eq('user_id',data.user.id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*25,page*25+25);
  if(error)throw error;
  return NextResponse.json({payments:(payments??[]).slice(0,25),hasMore:(payments??[]).length>25},{headers});
 }catch{return NextResponse.json({error:'Payment history is unavailable. Please retry.'},{status:503,headers});}
}
