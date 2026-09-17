import { NextResponse } from 'next/server';import { SUBSCRIPTION_ARCHITECTURE } from '@/lib/subscriptions';export async function GET(){return NextResponse.json(SUBSCRIPTION_ARCHITECTURE);}
