import { NextResponse } from 'next/server';
import { getServerSubscription } from '@/lib/subscriptions/server';
import { usageDecision, type MeteredFeature } from '@/lib/subscriptions/usage';

const FEATURES = new Set<MeteredFeature>(['interestsPerMonth','profileSharesPerMonth','biodataTemplates','profileBoostsPerMonth']);
export async function GET(_request: Request, context: { params: Promise<{ feature: string }> }) {
  const { user, plan } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { feature } = await context.params;
  if (!FEATURES.has(feature as MeteredFeature)) return NextResponse.json({ error: 'Unknown metered feature' }, { status: 404 });
  // Usage persistence is still on the legacy subscription_usage table; callers must
  // increment usage atomically when performing the protected action.
  return NextResponse.json(usageDecision(plan.entitlements, feature as MeteredFeature, 0), { headers: { 'Cache-Control': 'no-store' } });
}
