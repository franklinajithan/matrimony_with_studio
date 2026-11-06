# CupidMatch — Stripe integration preparation

Stripe products created in the Dashboard:
- Plus — GBP 4.99/month
- Premium — GBP 7.99/month

**Current status: preparation only. No Stripe checkout or automatic membership activation is enabled by this change.** The existing billing checkout/webhook routes deliberately fail closed.

## Where to put the API keys (Vercel)

Open the **CupidMatch Vercel project** → **Settings** → **Environment Variables**. Add the following variables for **Preview** only while testing:

| Variable | Source |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → **test-mode secret key**, `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks / Workbench → webhook endpoint signing secret, `whsec_...` |
| `STRIPE_PRICE_PLUS_MONTHLY` | Stripe Product catalog → Plus → monthly price ID, `price_...` |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | Stripe Product catalog → Premium → monthly price ID, `price_...` |

For local testing, use `.env.local` (git-ignored). **Never commit keys or paste them in chat**. Do not prefix server-only secrets with `NEXT_PUBLIC_`.

A Stripe *publishable* key (`pk_test_...` / `pk_live_...`) is not necessary for hosted Checkout Sessions; add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only if using Stripe.js on the client.

After saving Vercel variables, redeploy the Preview deployment to make them available to the server.

## Before enabling real checkout

1. Confirm Stripe has approved CupidMatch's marriage-focused international matchmaking activities and verify payouts to Tide.
2. Reconcile the existing database plan catalogue and entitlements: legacy `premium` / `premium_plus` definitions do not map directly to the new `plus` / `premium` products.
3. Add authenticated, idempotent Checkout Session creation using server-side price IDs; do not trust client-supplied prices or user IDs.
4. Add Stripe webhook endpoint and verify the *raw-body* Stripe signature. Persist event IDs uniquely, verify session/subscription owner, customer and price, and update database subscriptions transactionally. Never grant membership based solely on a redirect.
5. Handle `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, and `customer.subscription.deleted` with out-of-order/retry-safe state reconciliation.
6. Add Customer Portal for cancellations and payment-method management; test account deletion, refunds, renewal failure, trial and country-pricing edge cases.
7. Test end-to-end with Stripe test-mode keys and Stripe test clocks where appropriate. Keep live checkout disabled until acceptance and approval.

Security: Stripe webhook signing secret differs between Stripe CLI, Preview webhook endpoint and Production endpoint. Do not reuse it across environments.

Run: `node --test scripts/stripe-preparation.test.cjs`.
