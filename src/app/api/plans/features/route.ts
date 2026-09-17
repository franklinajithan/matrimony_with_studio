import { NextResponse } from 'next/server';import { FEATURE_LABELS } from '@/lib/subscriptions';export async function GET(){return NextResponse.json({features:FEATURE_LABELS});}
