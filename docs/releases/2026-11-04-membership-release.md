# Membership release — 4 November 2026

User authorised the prepared production migrations and release in the follow-up instruction to make the site work normally. Real Tide processing is not configured and no charge/refund is attempted.

## Database change record

- Repository 20261104125818_two_month_premium_offer.sql is recorded by Supabase as **20261104142610 / two_month_premium_offer**.
- Repository 20261104125828_disabled_payment_ledger.sql is recorded as **20261104142623 / disabled_payment_ledger**.
- The connector chooses migration timestamps. Match the recorded names/definitions above; do not blindly push the historical directory or replay these two files.
- Before snapshot: 0 legacy trials, 0 paid subscriptions, no launch/ledger table. The old trial function/ACL and catalogue are saved in 2026-11-04-membership-before.json (no member rows/secrets).
- After: trial default 2; authenticated claim permission; no anonymous claim, direct member grant-edit or payment-confirmation privilege. Trial/subscription/payment counts remain 0 and the catalogue remains Free 0, Plus 999, Premium 1999 pence.

## Acceptance

Local unit/API/PostgreSQL, production session-guard, desktop/mobile browser, TypeScript, lint and build checks pass. The catalogue preview reads the real database successfully. A temporary production SQL account/session test was requested but its separate database confirmation expired; it did not run and is not reported as successful. Its always-rollback script is supabase/tests/trial_release_rollback.sql. It must not be used without operator authorisation.

## Member experience

Registration and Premium selection remain available. No card is needed for the two-calendar-month trial. Existing grants keep their original dates. Price cards lead to Free signup or Premium selection; the member page leads to the working free-trial action instead of a disabled checkout button. Purchase periods without configured prices are not offered. Payment history loads normally once the ledger is available.

## Rollback

Preserve grant/ledger/audit data and the entitlement reader. Do not remove a promised trial or restore an alternate repeat-trial route. If activation must be stopped, revoke claim execution while retaining reads and repair forward. The before snapshot is an operational reference, not permission to restore an old trial route after members have claimed the new offer.

Production application commit/deployment and final public acceptance are recorded in the delivery response after release. Tide merchant verification/credentials remain a separate prerequisite to accepting money.
