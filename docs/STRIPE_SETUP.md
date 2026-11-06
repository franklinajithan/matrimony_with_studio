# CupidMatch Stripe integration — staged release

## Current integration code

- Authenticated Plus (£4.99/month) and Premium (£7.99/month) hosted Stripe Checkout.
- Provider-side price verification (currency, price amount, recurring interval).
- Pending payment records before redirects; no card numbers stored by CupidMatch.
- Signed raw-body Stripe webhook intake; webhook events re-fetch the subscription using Stripe's API.
- Transactional, replay-safe reconciliation into the existing payment and membership tables.
- Self-service Stripe Customer Portal for cancellation and payment methods.
- Separate Plus/Premium entitlements and admin payment pause/kill switch.
- GBP monthly checkout only. Other country-specific display prices are not chargeable until corresponding Stripe prices and tax/compliance checks are configured.

**Not enabled in production.** This branch must pass CI, preview end-to-end tests, and be approved by the merchant owner and Stripe before any live charging. Do not activate live flags just because credentials exist.

## Environment variables — Vercel

Open the CupidMatch Vercel project > Settings > Environment Variables. Store keys as **Secret** and never commit them, paste them into a ticket or chat, or prefix them with `NEXT_PUBLIC_`.

| Key | Value | Scope |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe restricted test `rk_test_...` or test secret `sk_test_...` | Preview initially |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` for the **same** test webhook destination | Preview initially |
| `STRIPE_PRICE_PLUS_MONTHLY` | Test-mode Plus `price_...` ID (£4.99 monthly) | Preview initially |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | Test-mode Premium `price_...` ID (£7.99 monthly) | Preview initially |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-only service role credential for the correct isolated preview database | Preview only initially |
| `STRIPE_CHECKOUT_ENABLED` | `true` only after preview migration and tests pass | Preview after verification |
| `STRIPE_WEBHOOK_PROCESSING_ENABLED` | `true` only after preview migration and tests pass | Preview after verification |
| `STRIPE_LIVE_APPROVED` | `true` only with confirmed written Stripe eligibility and explicit launch approval | Production at launch only |

The corresponding **Production** keys must be live-mode Stripe keys and prices. Test API keys cannot retrieve live Price IDs. The API refuses production test keys and preview live keys. Redeploy a target deployment after Vercel environment changes. Never create a live payment to test configuration.

**Do not use the production Supabase service-role key in Preview if preview points at the same production database.** Create a genuinely isolated test database or keep all checkout flags disabled.

## Database migration order

1. `20261106121500_stripe_verified_webhook_memberships.sql` — service-role-only atomic Stripe reconciliation.
2. `20261106123000_protect_paid_subscription_records.sql` — revoke broad member insert/update/delete privileges, replace permissive RLS with owner/admin read.
3. `20261106124000_stripe_payment_kill_switch.sql` — honour the existing admin pause state.

Apply to staging/test first and verify that member permissions and signup flows remain correct. The existing `private.payment_configuration.enabled` singleton defaults to `false`. Keep it false in production. Enable it only through a reviewed administrator-controlled database change after checkout acceptance. A user-facing admin Pause Payments action returns it to false.

## Stripe workbench and webhook

Create a **test-mode** webhook destination to the deployed **Preview** URL (not `cupidmatch.co.uk`) ending in `/api/billing/webhook`. Listen for:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The separately created live destination currently points to `https://cupidmatch.co.uk/api/billing/webhook`. Leave live payments off until the full handler has been deployed, Stripe account approval is confirmed and delivery is proven successful.

Configure the Stripe Customer Portal for subscription cancellation and payment method updates.

## Verification

Run `npm run test:payments`, `npm run test:stripe`, `npm run typecheck`, `npm run lint`, and `npm run build`. Also run browser tests and an isolated Stripe test-mode end-to-end checkout including first payment, renewal, retries, cancellation and duplicate/out-of-order webhook delivery.

Do not grant paid membership from a success redirect. Stripe API verification and the signed webhook must drive database membership updates.

Release only after confirming Stripe permits CupidMatch's international matrimonial service, bank payouts work, and legal/recurring subscription disclosures are approved.
