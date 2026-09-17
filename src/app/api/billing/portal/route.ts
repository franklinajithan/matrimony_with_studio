import { NextResponse } from 'next/server';
import { billingConfigured } from '@/lib/subscriptions/checkout';
import { getServerSubscription } from '@/lib/subscriptions/server';

export async function POST() {
  const { user, subscription } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!billingConfigured() || !subscription?.stripe_customer_id) return NextResponse.json({ error: 'Billing portal is not available.' }, { status: 503 });
  return NextResponse.json({ error: 'Stripe customer portal provider is not enabled in this build.' }, { status: 503 });
}
