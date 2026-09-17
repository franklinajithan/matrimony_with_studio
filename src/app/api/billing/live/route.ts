import { NextResponse } from 'next/server';import { LIVE_BILLING_ENABLED } from '@/lib/subscriptions';export async function GET(){return NextResponse.json({enabled:LIVE_BILLING_ENABLED});}
