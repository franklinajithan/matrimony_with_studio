import { NextResponse } from 'next/server';
import { billingConfigured } from '@/lib/subscriptions/checkout';
import { getServerSubscription } from '@/lib/subscriptions/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const { user, plan, subscription } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ configured: billingConfigured(), plan: plan.code, subscription }, { headers: { 'Cache-Control': 'no-store' } });
}
