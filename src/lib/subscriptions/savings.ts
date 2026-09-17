import { BILLING_MONTHS } from './durations';
import { getPlanPrice, type BillingTerm, type PlanCode } from './plans';
export function savingsPence(plan:PlanCode,term:BillingTerm){const monthly=getPlanPrice(plan,'monthly');return Math.max(0,monthly*BILLING_MONTHS[term]-getPlanPrice(plan,term));}
