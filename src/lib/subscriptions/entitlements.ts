import { getPlan, type PlanCode, type PlanEntitlements } from './plans';

export type EntitlementKey = keyof PlanEntitlements;
export function hasEntitlement(plan: PlanCode | string | null | undefined, key: EntitlementKey): boolean {
  const value = getPlan(plan).entitlements[key];
  return typeof value === 'boolean' ? value : value === null || value > 0;
}
export function featureLimit(plan: PlanCode | string | null | undefined, key: EntitlementKey): number | null {
  const value = getPlan(plan).entitlements[key];
  return typeof value === 'number' || value === null ? value : value ? null : 0;
}
export function remainingAllowance(limit: number | null, used: number): number | null {
  return limit === null ? null : Math.max(0, limit - Math.max(0, used));
}

export const canUseAdvancedFilters = (plan?: string | null) => hasEntitlement(plan, 'advancedFilters');
export const canSeeFullCompatibility = (plan?: string | null) => hasEntitlement(plan, 'fullCompatibility');
export const canSeeLikes = (plan?: string | null) => hasEntitlement(plan, 'seeWhoLikesYou');
export const canSeeProfileVisitors = (plan?: string | null) => hasEntitlement(plan, 'seeProfileVisitors');
export const canMessageAfterMatch = (plan?: string | null) => hasEntitlement(plan, 'messagingAfterMatch');
export const canUseReadReceipts = (plan?: string | null) => hasEntitlement(plan, 'readReceipts');
export const canUseFamilyIntroduction = (plan?: string | null) => hasEntitlement(plan, 'familyIntroduction');
export const canUseIncognito = (plan?: string | null) => hasEntitlement(plan, 'incognitoMode');
export const hasPriorityVisibility = (plan?: string | null) => hasEntitlement(plan, 'priorityVisibility');
export const hasPremiumBadge = (plan?: string | null) => hasEntitlement(plan, 'premiumBadge');
