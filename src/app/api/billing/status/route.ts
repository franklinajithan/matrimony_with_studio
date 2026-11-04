import { NextResponse } from 'next/server';
import { tidePaymentReadiness } from '@/lib/subscriptions/tide-preparation';
import { getServerSubscription } from '@/lib/subscriptions/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const { user, plan, subscription } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ configured: tidePaymentReadiness().credentialsConfigured, enabled:false, provider:'tide', plan: plan.code, subscription }, { headers: { 'Cache-Control': 'no-store' } });
}
