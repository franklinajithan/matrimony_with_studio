import { NextResponse } from 'next/server';
import { type EntitlementKey } from '@/lib/subscriptions/entitlements';
import { getServerSubscription } from '@/lib/subscriptions/server';

const FEATURES = new Set<EntitlementKey>(['advancedFilters','fullCompatibility','seeWhoLikesYou','seeProfileVisitors','messagingAfterMatch','readReceipts','familyIntroduction','incognitoMode','priorityVisibility','premiumBadge','prioritySupport','interestsPerMonth','profileSharesPerMonth','biodataTemplates','profileBoostsPerMonth']);

export async function GET(_request: Request, context: { params: Promise<{ feature: string }> }) {
  const { user, plan } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { feature } = await context.params;
  if (!FEATURES.has(feature as EntitlementKey)) return NextResponse.json({ error: 'Unknown feature' }, { status: 404 });
  const value = plan.entitlements[feature as EntitlementKey];
  const allowed = value === true || value === null || (typeof value === "number" && value > 0);
  return NextResponse.json({ plan: plan.code, feature, allowed, value }, { headers: { 'Cache-Control': 'no-store' } });
}
