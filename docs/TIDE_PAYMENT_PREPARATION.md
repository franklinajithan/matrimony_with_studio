# Disabled Tide payment preparation — 4 November 2026

## Delivery boundary

The two-month trial ships in separate draft PR #91. This draft extends existing #90 and reuses #80's trial architecture, current subscription records, prices and admin authorization. #40 was audited but is not merged: it includes a different Stripe test integration, broad feature changes and missing migrations. #85 is untouched.

**This is not a completed or enabled Tide gateway.** The generic checkout/ledger/verification boundary is prepared; an actual merchant adapter cannot be implemented honestly until Tide confirms its supported merchant integration contract. No customer has been charged, no real payment/refund has been attempted, no production schema changed and no new infrastructure was purchased.

## Official capability verification

Sources checked 4 November 2026:

- https://www.tide.co/help-centre/get-paid-faster-digital-payments/ — Payment Links are created through Tide and shared with customers; payments can use cards or UK Pay by Bank. The guide says international payments cannot currently be received.
- https://www.tide.co/help-centre/tide-merchant-account/ — merchant account statuses and operator refund/receipt management. A successful payment and settled funds are different states.
- https://developers.tide.co/perry/developer/welcome — Open Banking AIS/PIS/funds confirmation for regulated third-party providers.
- https://developers.tide.co/perry/developer/documentation?document=docs%2Ftpp-onboarding%2Fintroduction.md&resource=tide-uk-portal — production Open Banking access requires authorised TPP enrolment. This is not proof of an ordinary merchant checkout API.

No merchant checkout-creation API, signed merchant webhook contract, automated transaction-verification API or recurring-membership contract was established by these sources. No Tide endpoint, credential format, signature or Adyen access has been invented. An underlying processor's role does not grant CupidMatch its API access.

## Prepared architecture

- Replaceable PaymentGateway interface with normalized checkout result and verified receipt types; disabled Tide adapter always refuses creation/verification. Readiness and HTTP checkout fail closed even if an operator sets an environment variable to true.
- Existing membership plan models and user_subscriptions are retained. Payment intents hold server-resolved GBP price snapshots and account idempotency keys. Statuses are Pending, Paid, Failed, Cancelled and Refunded.
- Database configuration starts disabled. Admins may disable it through an origin-checked, permission-checked, atomically audited RPC. There is no enable, mark-paid, refund or manual-entitlement button.
- Service-only intent and receipt RPCs are prepared for a future trusted server adapter. They are not wired to an HTTP callback. Receipts validate amount, currency, reference, transition and duplicate/conflicting event IDs. Provider references and provider event IDs cannot settle two intents.
- Verified Paid recording creates one linked, non-renewing user_subscriptions row in the same database transaction as ledger and audit writes. A refund cancels only that receipt's linked subscription. Independent trials and other subscriptions are untouched. Failed/cancelled states are terminal. Duplicate receipts do not regrant access.
- Member history reads only the authenticated owner's records; dashboard reads require current admin authorization and database session/activity guards. RLS and explicit grants prevent member/admin direct payment writes and service-table mutations outside privileged functions.
- The admin dashboard includes plan previews, trial and legacy-trial expiry dates, subscription records, paginated payment/audit rows, pending/failed/cancelled counts and verified gross revenue/refunds. Revenue excludes pending/unverified/refunded records; it is not a bank reconciliation or net-of-fee accounting report.
- Paid membership UI previews plan/period prices but its checkout button is disabled. There are no card inputs, stored card numbers, frontend secrets, recurring consent or automatic billing.

## Production schema findings and migrations

Production is READY at main b20cbeb / deployment dpl_61KrYkPHTbMSNLGGTeXzT3rRn4d9. Inspection was read-only. Recorded migrations end at 20261023073857. No new trial or ledger migration is applied.

1. Trial PR: `20261104125818_two_month_premium_offer.sql`.
2. Payment PR: `20261104125828_disabled_payment_ledger.sql`, only after the trial migration.

The ledger migration adds optional three/six-month price columns, payment_intents/payment_events, private disabled configuration, service-only RPCs and a unique payment_intent_id on existing user_subscriptions. It preserves existing monthly/custom prices. Default term amounts are populated only when the matching current monthly price is already present.

**Catalogue mismatch discovered:** production has Free, Plus (£9.99) and Premium (£19.99); current application previews Premium (£7.99) and Premium+ (£14.99). Do not silently rename/reprice existing records. The prepared intent function rejects any price that differs from the application preview. The legacy alias behavior in the existing entitlement resolver is preserved. Before paid checkout is enabled, approve a plan/price mapping and a data-preserving catalogue migration, then validate it against both the UI and provider products. This is a real release blocker beyond obtaining a credential.

Do not merge #40, #76, #80 or the entire historical SQL directory to make tables appear. Reconcile live definitions against each targeted migration. Production application/migration approval is still required. No paid staging environment has been created.

## Manual Payment Link fallback

If Tide only supports operator-created Payment Links, retain this boundary:

1. Operator creates an amount-specific invoice/link inside Tide and binds the internal pending intent reference to it.
2. Customer pays only on Tide's hosted page. A browser return, screenshot or member statement remains unverified and cannot activate access.
3. An authorised operator independently inspects the actual merchant transaction/settlement details, amount, GBP currency, unique reference, status and member mapping in Tide.
4. A separately reviewed, owner-approved reconciliation adapter records the independently verified receipt. Until that review/approval exists, do not expose a confirmation/grant endpoint or send real payment links from CupidMatch.
5. Refunds are executed through Tide's supported operator procedure; only a verified completed refund is recorded. The dashboard does not initiate refunds.

No manual workflow has been activated and no customer link has been sent. If reliable reference/verification cannot be established, keep this provider unavailable or replace the adapter with a documented supported provider.

## Exact information needed later

Request these documents/details from Tide; do not paste secrets into chat or GitHub:

- Whether this business/account is approved for website membership payments, supported customer countries/currencies, amount limits, fees and refund/chargeback handling.
- Official merchant checkout/Payment Link API documentation, if available; authorised merchant/account identifiers; exact authentication/credential provisioning instructions, scopes and sandbox details.
- Official transaction status lookup or callback/webhook documentation, including signed payload verification, replay protection, event/reference identifiers, retries and amount/currency binding.
- Supported refunds and cancellation semantics. Recurring billing remains unimplemented and disabled unless separately documented and explicitly consented to; a normal Tide bank account is not sufficient evidence.
- If manual links are the only supported option: actual link format from the approved merchant account, merchant transaction export/reconciliation fields, access-controlled operator procedure and independently verifiable transaction references.

Only after Tide defines those requirements can exact provider secret names be specified. Store any future secrets in server-side environment configuration, never NEXT_PUBLIC variables. Existing Supabase URL/publishable key serve normal auth; any future server service-role secret must remain server-only and must never be used to accept member-supplied paid claims.

## Verification and release gates

Local: TypeScript, ESLint (12 existing warnings), unit/API/SQL integration and production build; 26 payment browser checks plus 38 registration/onboarding checks at desktop/mobile widths using real components and fixture HTTP/auth. Standard Playwright download was truncated; a temporary pinned Chromium 143 runtime was used locally, with extraction adjusted for this filesystem. CI uses standard Playwright Chromium. These are not mobile-device, live OAuth, actual Tide sandbox or full signed-in Supabase acceptance.

Tests cover disabled/missing-provider behavior; authorization, owner scoping, origin checks, spoofed success; trial expiry/preservation; duplicates/conflicting receipts; price/currency mismatches; refunds/independent access; revenue; audit-failure rollback; upgrade from six-month and production-style price schemas. GitHub CI/preview results must be checked at the final commit.

Before production: signed-in isolated Supabase staging acceptance, catalogue decisions for paid flows, reviewed rollback/backups, passing exact-commit CI, then explicit approval for production migrations. Keep payment HTTP paths/adapter disabled. Payment activation, any real charge and any real refund require separate approval and actual provider verification. A preview build against the current production DB will show unavailable ledger panels until the migration; that is not a completed signed-in acceptance test.

Rollback: stop checkout/receipt ingress first and disable configuration. Preserve immutable trial history, payment receipts, audit logs and linked subscriptions. Never erase financial events or reopen a terminal payment to roll back. Roll back the application only with compatible guards, or repair forward. No historical production grant is shortened by these changes.

## Final local check results and files

- Trial/API/PostgreSQL/payment preparation: 35 tests plus three Tide utility tests passed; zero failed/skipped.
- Subscription domain: 23 test entries passed, including the three Tide utility cases (do not add these counts as distinct assertions).
- Admin authorization/deletion: 111 passed. Auth session: seven passed. Focused admin audit/review plus onboarding/signup regression batches passed; horoscope suites 33 + 18 passed and theme 12 passed.
- Actual-component browser checks: payment 26 and registration/onboarding 38 passed at 1280/390px. No real member/provider transaction was used.
- TypeScript and production build passed. ESLint: zero errors, 12 pre-existing warnings. Early fixture failures were corrected: generic admin mocks needed the new dependencies/request, and the legacy trial SQL fixture needed its real duration column. Wider tests also exposed two omitted entitlement keys; those are restored, and readiness no longer reports unused Stripe credentials as active provider capability. The final reruns pass.

Trial files are listed in #91: claim API, PremiumLaunchOffer, Membership/signup/pricing, auth destinations, subscription resolver, targeted migration and regressions. Payment files: `src/lib/subscriptions/payment-gateway.ts`, `provider.ts`, `tide-preparation.ts`, `entitlement-keys.ts`; `src/app/api/admin/payments`, `api/payments/history`, billing checkout/readiness; `src/app/admin/payments` and navigation; `PaymentCheckout`/`PaymentHistory` plus Membership composition; disabled ledger migration; payment API/SQL/browser tests, package scripts and CI workflows. No files under the #85 feature branches were changed.
