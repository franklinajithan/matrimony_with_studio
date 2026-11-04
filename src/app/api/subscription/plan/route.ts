import {NextResponse} from 'next/server';
import {getServerSubscription} from '@/lib/subscriptions/server';
import {publicCatalogue} from '@/lib/subscriptions/live-catalogue';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){try{const {user,plan,subscription}=await getServerSubscription();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401,headers});const catalogue=await publicCatalogue();const current=catalogue.find(p=>p.code===(subscription?.plan_code??plan.code));return NextResponse.json({code:plan.code,name:plan.name,pricesPence:current?.pricesPence??null,currency:current?.currency??null},{headers});}catch{return NextResponse.json({error:'Current membership prices unavailable'},{status:503,headers});}}
