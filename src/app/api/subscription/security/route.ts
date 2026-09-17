import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({clientCanGrantPaidAccess:false,activation:'verified-webhook-only',checkoutRedirectActivates:false});}
