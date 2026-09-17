import { NextResponse } from 'next/server';
import { getServerSubscription } from '@/lib/subscriptions/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getServerSubscription();
  if (!result.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    plan: result.plan.code,
    name: result.plan.name,
    entitlements: result.plan.entitlements,
    subscription: result.subscription,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
