import 'server-only';
import type { BillingTerm, PlanCode } from './plans';

const ENV_KEYS: Record<Exclude<PlanCode, 'free'>, Record<BillingTerm, string>> = {
  premium: {
    monthly: 'STRIPE_PRICE_PREMIUM_MONTHLY',
    three_months: 'STRIPE_PRICE_PREMIUM_3_MONTHS',
    six_months: 'STRIPE_PRICE_PREMIUM_6_MONTHS',
  },
  premium_plus: {
    monthly: 'STRIPE_PRICE_PREMIUM_PLUS_MONTHLY',
    three_months: 'STRIPE_PRICE_PREMIUM_PLUS_3_MONTHS',
    six_months: 'STRIPE_PRICE_PREMIUM_PLUS_6_MONTHS',
  },
};

export function billingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function stripePriceId(plan: PlanCode, term: BillingTerm) {
  if (plan === 'free') return null;
  return process.env[ENV_KEYS[plan][term]] || null;
}

export function assertBillingConfiguration(plan: PlanCode, term: BillingTerm) {
  if (!billingConfigured()) throw new Error('Stripe billing is not configured on this environment.');
  const priceId = stripePriceId(plan, term);
  if (!priceId) throw new Error(`Stripe price is not configured for ${plan}/${term}.`);
  return priceId;
}
