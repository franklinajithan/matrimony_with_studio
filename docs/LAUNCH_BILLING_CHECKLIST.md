# Production billing checklist

1. Apply all Supabase migrations in order and verify `subscription_plans` contains only Free, Premium and Premium+.
2. Create six Stripe recurring Prices matching the configured GBP launch amounts/terms.
3. Set the Stripe secret, webhook signing secret and six Price ID environment variables in Vercel.
4. Install/enable the Stripe provider implementation for Checkout, Portal and signature-verified webhooks.
5. Test successful checkout, failed payment, renewal, cancellation-at-period-end, expiry and duplicate webhook delivery in Stripe test mode.
6. Confirm no client can INSERT/UPDATE `member_subscriptions`, `subscription_events`, `subscription_plans` or usage counters.
7. Confirm paid features use server entitlement checks rather than UI-only checks.
8. Only then enable purchase buttons in production.
