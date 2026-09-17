import { NextResponse } from 'next/server';
import { billingConfigured } from '@/lib/subscriptions/checkout';
import { getServerSubscription } from '@/lib/subscriptions/server';

export async function POST() {
  const { user, subscription } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!subscription) return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  if (!billingConfigured()) return NextResponse.json({ error: 'Billing provider is not configured.' }, { status: 503 });
  return NextResponse.json({ error: 'Use the Stripe customer portal when provider integration is enabled.' }, { status: 503 });
}
