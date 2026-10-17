import "server-only";
import Stripe from "stripe";
import { stripePriceId } from "@/lib/subscriptions/checkout";
import {
  PLANS,
  type BillingTerm,
  type PlanCode,
} from "@/lib/subscriptions/plans";
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^([sr]k)_test_/.test(key))
    throw new Error(
      "Stripe test-mode credentials are required. Live payments are disabled.",
    );
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 });
}
export function stripeTestConfigured() {
  return /^([sr]k)_test_/.test(process.env.STRIPE_SECRET_KEY || "");
}
export function priceMapping(id: string) {
  for (const plan of ["premium", "premium_plus"] as const)
    for (const term of ["monthly", "three_months", "six_months"] as const)
      if (stripePriceId(plan, term) === id) return { plan, term };
  return null;
}
export async function validatedPrice(
  plan: Exclude<PlanCode, "free">,
  term: BillingTerm,
) {
  const id = stripePriceId(plan, term);
  if (!id) throw new Error("This plan price is not configured.");
  const p = await getStripe().prices.retrieve(id);
  const months = term === "monthly" ? 1 : term === "three_months" ? 3 : 6;
  if (
    !p.active ||
    p.livemode ||
    p.currency !== "gbp" ||
    p.unit_amount !== PLANS[plan].pricesPence[term] ||
    p.recurring?.interval !== "month" ||
    p.recurring.interval_count !== months
  )
    throw new Error(
      "Configured Stripe price does not match the advertised GBP plan.",
    );
  return p.id;
}
export function providerError() {
  return "The provider could not complete this request. Please retry or contact support.";
}

/** Sandbox billing/identity must never mutate an ordinary production member. */
export function isProviderTestMember(memberId: string) {
  return (process.env.PROVIDER_TEST_MEMBER_IDS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .includes(memberId);
}
