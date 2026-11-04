import { NextResponse } from 'next/server';
import { z } from 'zod';
import { paymentGateway } from '@/lib/subscriptions/payment-gateway';
import { getServerSubscription } from '@/lib/subscriptions/server';
const headers={'Cache-Control':'private, no-store'};
const Input=z.object({plan:z.enum(['plus','premium','premium_plus']),term:z.enum(['monthly','three_months','six_months'])}).strict();
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Invalid origin'},{status:403,headers});
 try{
  const {user}=await getServerSubscription();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401,headers});
  const parsed=Input.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:'Invalid plan or billing term'},{status:400,headers});
  const gateway=paymentGateway();
  return NextResponse.json({error:gateway.readiness().reason,provider:gateway.provider,enabled:false},{status:503,headers});
 }catch{return NextResponse.json({error:'Checkout is unavailable. No payment has been initiated.'},{status:503,headers});}
}
