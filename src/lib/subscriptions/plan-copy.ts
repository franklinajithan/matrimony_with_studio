import type { PlanCode } from './plans';
export const PLAN_TAGLINES: Record<PlanCode,string> = {
  free: 'Start your search',
  premium: 'For serious partner searching',
  premium_plus: 'Privacy, visibility and priority',
};
export const MOST_POPULAR_TERM = { plan: 'premium' as const, term: 'three_months' as const, label: 'Most Popular' };
