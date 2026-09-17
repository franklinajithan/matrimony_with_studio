import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireServerAdmin } from '@/lib/subscriptions/server';
export const dynamic='force-dynamic';
export async function GET(){
 const admin=await requireServerAdmin(); if(!admin)return NextResponse.json({error:'Forbidden'},{status:403});
 const supabase=await createSupabaseServerClient();
 const [profiles,subs]=await Promise.all([supabase.from('profiles').select('id',{count:'exact',head:true}),supabase.from('member_subscriptions').select('id',{count:'exact',head:true}).in('status',['active','trialing'])]);
 return NextResponse.json({members:profiles.count??0,activeSubscriptions:subs.count??0},{headers:{'Cache-Control':'no-store'}});
}
