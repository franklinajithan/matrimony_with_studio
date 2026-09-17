import { NextResponse } from 'next/server';import { SUBSCRIPTION_PHASE } from '@/lib/subscriptions';export async function GET(){return NextResponse.json(SUBSCRIPTION_PHASE);}
