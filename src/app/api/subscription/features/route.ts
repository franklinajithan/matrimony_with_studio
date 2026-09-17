import { NextResponse } from 'next/server';
import { getServerSubscription } from '@/lib/subscriptions/server';
import { PAID_FEATURES, hasEntitlement } from '@/lib/subscriptions';

export const dynamic='force-dynamic';
export async function GET(){
 const {user,plan}=await getServerSubscription();
 if(!user) return NextResponse.json({error:'Unauthorized'},{status:401});
 const features=Object.fromEntries(Object.entries(PAID_FEATURES).map(([name,key])=>[name,hasEntitlement(plan.code,key)]));
 return NextResponse.json({plan:plan.code,features},{headers:{'Cache-Control':'no-store'}});
}
