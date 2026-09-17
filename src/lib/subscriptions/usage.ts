import type { PlanEntitlements } from './plans';
import { remainingAllowance, withinMonthlyLimit } from './entitlements';

export type MeteredFeature = 'interestsPerMonth' | 'profileSharesPerMonth' | 'biodataTemplates' | 'profileBoostsPerMonth';
export function usageDecision(entitlements: PlanEntitlements, feature: MeteredFeature, used: number) {
  const limit = entitlements[feature];
  return { allowed: withinMonthlyLimit(limit, used), limit, used: Math.max(0, used), remaining: remainingAllowance(limit, used) };
}
