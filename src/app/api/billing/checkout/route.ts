import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertBillingConfiguration } from '@/lib/subscriptions/checkout';
import { getServerSubscription } from '@/lib/subscriptions/server';

const Input = z.object({
  plan: z.enum(['premium', 'premium_plus']),
  term: z.enum(['monthly', 'three_months', 'six_months']),
});

export async function POST(request: Request) {
  const { user } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid plan or billing term' }, { status: 400 });
  try {
    assertBillingConfiguration(parsed.data.plan, parsed.data.term);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Billing unavailable' }, { status: 503 });
  }
  // Never activate membership here. Checkout creation will be enabled once Stripe
  // credentials/product IDs are present; only the verified webhook may grant access.
  return NextResponse.json({ error: 'Stripe checkout provider is not enabled in this build.' }, { status: 503 });
}
