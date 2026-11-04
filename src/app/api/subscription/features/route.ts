import { NextResponse } from 'next/server';
import { getServerSubscription } from '@/lib/subscriptions/server';
import { PAID_FEATURES } from '@/lib/subscriptions';

export const dynamic='force-dynamic';
export async function GET(){
 const {user,plan}=await getServerSubscription();
 if(!user) return NextResponse.json({error:'Unauthorized'},{status:401});
 const features=Object.fromEntries(Object.entries(PAID_FEATURES).map(([name,key])=>[name,typeof plan.entitlements[key]==='boolean'?plan.entitlements[key]:plan.entitlements[key]===null||Number(plan.entitlements[key])>0]));
 return NextResponse.json({plan:plan.code,features},{headers:{'Cache-Control':'no-store'}});
}
