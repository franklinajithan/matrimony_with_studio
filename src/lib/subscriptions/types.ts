import type { BillingTerm, PlanCode } from './plans';

export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'canceled' | 'expired' | 'refunded' | 'trialing';
export type MemberSubscription = {
  id: string;
  user_id: string;
  plan_code: PlanCode;
  billing_term: BillingTerm;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};
