import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getServerSubscription } from '@/lib/subscriptions/server';
import type { MeteredFeature } from '@/lib/subscriptions/usage';

const FEATURES = new Set<MeteredFeature>(['interestsPerMonth','profileSharesPerMonth','biodataTemplates','profileBoostsPerMonth']);
export async function POST(_request: Request, context: { params: Promise<{ feature: string }> }) {
  const { user, plan } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { feature } = await context.params;
  if (!FEATURES.has(feature as MeteredFeature)) return NextResponse.json({ error: 'Unknown metered feature' }, { status: 404 });
  const limit = plan.entitlements[feature as MeteredFeature];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('consume_subscription_usage', { p_feature_key: feature, p_limit: limit });
  if (error) return NextResponse.json({ error: 'Could not meter feature usage' }, { status: 500 });
  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ plan: plan.code, feature, limit, ...result }, { status: result?.allowed === false ? 429 : 200, headers: { 'Cache-Control': 'no-store' } });
}
