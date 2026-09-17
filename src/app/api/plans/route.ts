import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/subscriptions/plans';

export async function GET() {
  return NextResponse.json({ plans: Object.values(PLANS) }, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } });
}
