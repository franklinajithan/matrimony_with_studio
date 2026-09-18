import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/auth/admin';
export async function GET(){const admin=await requireServerAdmin();if(!admin)return NextResponse.json({error:'Forbidden'},{status:403});return NextResponse.json({readPlans:true,readSubscriptions:true,readBillingEvents:true,readAudit:true,editPlans:false,grantSubscriptions:false});}

