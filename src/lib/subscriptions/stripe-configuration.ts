/**
 * Server-only Stripe configuration. Do not expose secret keys in NEXT_PUBLIC_*.
 * This module never authorises a charge or grants a membership.
 * Live billing requires signed webhooks, durable event processing, verified
 * plan mapping, and explicit merchant approval.
 */
export type StripePlan = 'plus' | 'premium';
export type StripeConfiguration = {
  mode: 'unconfigured' | 'test' | 'live';
  configured: boolean;
  checkoutEnabled: false;
  automaticActivationEnabled: false;
  reason: string;
  priceIds: Partial<Record<StripePlan, string>>;
};

export function stripeConfiguration(env: NodeJS.ProcessEnv = process.env): StripeConfiguration {
  const key = env.STRIPE_SECRET_KEY || '';
  const webhook = env.STRIPE_WEBHOOK_SECRET || '';
  const plus = env.STRIPE_PRICE_PLUS_MONTHLY || '';
  const premium = env.STRIPE_PRICE_PREMIUM_MONTHLY || '';
  const isTest = key.startsWith('sk_test_');
  const isLive = key.startsWith('sk_live_');
  const mode = isTest ? 'test' : isLive ? 'live' : 'unconfigured';
  const validPrices = [plus, premium].every(x => /^price_[A-Za-z0-9]+$/.test(x)) && plus !== premium;
  const configured = (isTest || isLive) && webhook.startsWith('whsec_') && validPrices;
  return {
    mode, configured,
    // Deliberately disabled until the full provider-to-database lifecycle exists.
    checkoutEnabled: false, automaticActivationEnabled: false,
    priceIds: {
      ...(validPrices ? { plus, premium } : {}),
    },
    reason: !configured
      ? 'Stripe server credentials, webhook secret, and distinct monthly Price IDs must be configured.'
      : 'Stripe credentials are configured, but checkout remains disabled until verified webhook processing, plan mapping, tests, and business approval are complete.',
  };
}
