import { getPlan, type PlanCode, type PlanEntitlements } from './plans';
import { periodIsCurrent } from './period';

export type EntitlementKey = keyof PlanEntitlements;
export type SubscriptionState = { planCode?: string | null; status?: string | null; currentPeriodEnd?: string | Date | null };
const PAID_STATES = new Set(['active', 'trialing']);
export function effectivePlanCode(subscription?: SubscriptionState | null): PlanCode {
  if (!subscription?.planCode || !PAID_STATES.has(subscription.status ?? '') || !periodIsCurrent(subscription.currentPeriodEnd)) return 'free';
  if (subscription.planCode === 'premium_plus') return 'premium_plus';
  if (subscription.planCode === 'premium') return 'premium';
  return 'free';
}
export function hasEntitlement(plan: PlanCode | string | null | undefined, key: EntitlementKey): boolean { const value=getPlan(plan).entitlements[key]; return typeof value==='boolean'?value:value===null||value>0; }
export function hasSubscriptionEntitlement(subscription: SubscriptionState | null | undefined,key:EntitlementKey){return hasEntitlement(effectivePlanCode(subscription),key);}
export function featureLimit(plan: PlanCode | string | null | undefined,key:EntitlementKey):number|null{const value=getPlan(plan).entitlements[key];return typeof value==='number'||value===null?value:value?null:0;}
export function remainingAllowance(limit:number|null,used:number):number|null{return limit===null?null:Math.max(0,limit-Math.max(0,used));}
export function withinMonthlyLimit(limit:number|null,used:number){return limit===null||used<limit;}
export const canUseAdvancedFilters=(plan?:string|null)=>hasEntitlement(plan,'advancedFilters');
export const canSeeFullCompatibility=(plan?:string|null)=>hasEntitlement(plan,'fullCompatibility');
export const canSeeLikes=(plan?:string|null)=>hasEntitlement(plan,'seeWhoLikesYou');
export const canSeeProfileVisitors=(plan?:string|null)=>hasEntitlement(plan,'seeProfileVisitors');
export const canMessageAfterMatch=(plan?:string|null)=>hasEntitlement(plan,'messagingAfterMatch');
export const canUseReadReceipts=(plan?:string|null)=>hasEntitlement(plan,'readReceipts');
export const canUseFamilyIntroduction=(plan?:string|null)=>hasEntitlement(plan,'familyIntroduction');
export const canUseIncognito=(plan?:string|null)=>hasEntitlement(plan,'incognitoMode');
export const hasPriorityVisibility=(plan?:string|null)=>hasEntitlement(plan,'priorityVisibility');
export const hasPremiumBadge=(plan?:string|null)=>hasEntitlement(plan,'premiumBadge');
