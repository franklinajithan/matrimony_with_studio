import { NextResponse } from 'next/server';import { requireServerAdmin } from '@/lib/auth/admin';export async function GET(){if(!await requireServerAdmin())return NextResponse.json({error:'Forbidden'},{status:403});return NextResponse.json({adminSecurity:'server-authorized-v1',billing:'launch-v1'});}

