# CupidMatch subscriptions

Launch catalogue:

- Free: £0
- Premium: £7.99 monthly, £19.99 / 3 months, £34.99 / 6 months
- Premium+: £14.99 monthly, £34.99 / 3 months, £59.99 / 6 months

`src/lib/subscriptions/plans.ts` is the application fallback catalogue. `subscription_plans` is the database catalogue. Paid feature decisions must be made server-side from verified subscription state; a browser-provided plan name must never grant access.

## Stripe production activation

The application intentionally fails closed until Stripe is configured. Required server environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_PREMIUM_3_MONTHS`
- `STRIPE_PRICE_PREMIUM_6_MONTHS`
- `STRIPE_PRICE_PREMIUM_PLUS_MONTHLY`
- `STRIPE_PRICE_PREMIUM_PLUS_3_MONTHS`
- `STRIPE_PRICE_PREMIUM_PLUS_6_MONTHS`

Checkout redirects must never activate a membership. Implement/enable Stripe Checkout and verify the raw webhook signature before inserting/updating `member_subscriptions`. Store Stripe event IDs in `subscription_events` and treat them idempotently.

Until those credentials and the Stripe SDK/provider implementation are present, `/api/billing/checkout` and `/api/billing/webhook` return 503 rather than accidentally granting paid access.
