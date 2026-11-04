# Tide payment integration — credential-free preparation

Status: **NOT LIVE / NO CHARGES**. This branch adds a fail-closed configuration and two-calendar-month trial date utility only. It does not replace the existing Stripe-oriented billing routes, enable checkout, change database entitlements, or deploy.

## Important compatibility warning
PR #80 introduces an immutable **six-month** launch Premium grant with database migration and marketing copy. Changing only UI text to two months would be unsafe and misleading. Before release, audit the PR #80 dependency chain, production migration state, existing grants, and all trial-related tests. Decide a documented policy for existing six-month grants; do not silently shorten already promised entitlements. Coordinate DB duration, claim routine, UI copy, tests, and deployment in one staged release.

## Provider verification required
Tide app offers Payment Links, but that does not prove an API for creating hosted checkout sessions, signed webhooks, automated reconciliation, refunds, or recurring subscriptions. Obtain official Tide merchant integration documentation and account eligibility before building the adapter. Never infer successful payment from a browser redirect or manually submitted reference.

## Future implementation checklist
- Audit existing billing schema, RLS, plans, subscription logic, and PR #40 before reusing models.
- Keep payment enablement off by default; no credentials in repository.
- Use authenticated server-side checkout requests, idempotent payment records, and verified provider confirmations before granting entitlements.
- Add audit logs, cancellation/refund handling, admin read-only payment views, and integration tests.
- No automatic charges at trial end; require explicit opt-in and a supported billing provider.
- Test with provider sandbox or verified test environment; get explicit approval before production enablement.

## Tests
Run `node --import tsx --test src/lib/subscriptions/tide-preparation.test.ts` in the existing project environment.
