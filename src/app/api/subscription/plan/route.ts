import { NextResponse } from 'next/server';
import { getServerSubscription } from '@/lib/subscriptions/server';
export const dynamic='force-dynamic';
export async function GET(){const {user,plan}=await getServerSubscription();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});return NextResponse.json({code:plan.code,name:plan.name,pricesPence:plan.pricesPence},{headers:{'Cache-Control':'no-store'}});}
