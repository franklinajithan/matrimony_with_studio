import {NextResponse} from 'next/server';
import {getServerSubscription} from '@/lib/subscriptions/server';
import {publicCatalogue} from '@/lib/subscriptions/live-catalogue';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(){try{const {user}=await getServerSubscription();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401,headers});const plans=await publicCatalogue();return NextResponse.json({enabled:false,configured:Object.fromEntries(plans.filter(p=>p.code!=='free').map(p=>[p.code,false])),plans},{headers});}catch{return NextResponse.json({error:'Current prices unavailable',enabled:false},{status:503,headers});}}
