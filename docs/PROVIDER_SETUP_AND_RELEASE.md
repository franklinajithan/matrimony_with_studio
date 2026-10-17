# CupidMatch provider setup and release gates — 17 October 2026

All integrations are application-side implementations until the sandbox checklist below passes. Stripe/Identity sandbox routes require a dedicated test-member allowlist and reject ordinary member IDs. No real member records were changed, no real charge/refund was made, and no email/SMS was sent during development.

## Secure environment setup

Configure through Vercel/provider settings; never commit or paste secret values into issues or chat.

| Capability | Required setup | Current boundary |
|---|---|---|
| Provider database writes | `SUPABASE_SERVICE_ROLE_KEY` (server only) | Missing on inspected Vercel project |
| Stripe billing | `BILLING_ENABLED=true`, `STRIPE_SECRET_KEY` (`sk_test_` or restricted test key), `STRIPE_WEBHOOK_SECRET`; mandatory `PROVIDER_TEST_MEMBER_IDS` allowlist of dedicated test account UUIDs; six `STRIPE_PRICE_*` values in `docs/STRIPE_SETUP.env.example` | Test keys only; live keys rejected |
| Prices | Recurring GBP prices: Premium £7.99 / £19.99 / £34.99; Premium+ £14.99 / £34.99 / £59.99, recurring every 1 / 3 / 6 months | Provider price amount/currency/interval is validated; other market displays remain estimates |
| Billing webhook | `/api/billing/webhook`, subscription lifecycle, checkout completion and invoice events | Raw-body Stripe signature verification, receipt idempotency and stale-event protection |
| Identity | `IDENTITY_ENABLED=true`, Stripe Identity enabled in authorised account, same test key, separate `STRIPE_IDENTITY_WEBHOOK_SECRET`; endpoint `/api/identity/webhook` | Hosted document + matching selfie; test result never grants a live badge; no ID images stored by app |
| SMS | Configure Supabase Auth SMS provider (e.g. an authorised Twilio account), sending countries, CAPTCHA/abuse controls and OTP expiration (recommended 10 minutes); then `SMS_ENABLED=true` | 60-second app resend cooldown, five send attempts/hour and ten verification attempts/hour, plus Supabase Auth's own limits/expiry. External delivery not tested |
| Calls | `CALLING_ENABLED=true`, `TURN_URL`, `TURN_AUTH_SECRET` (at least 32 characters, matching an authorised TURN REST server); enable private database `calling` feature flag only for authorised acceptance tests | Disabled by default at API and database. Test voice/video between two consenting test accounts on separate networks; the app issues user-bound ten-minute TURN credentials |
| Email | Verified sender/domain, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_NOTIFICATIONS_ENABLED=true`, `CRON_SECRET`, explicit authorised `EMAIL_TEST_RECIPIENTS` allowlist | Queue worker `/api/jobs/email`; no scheduler enabled and no actual sends tested. Test allowlist is required; no unrestricted member mailing |
| Member/shared photo gateway | Server-only Supabase service key for viewer-authorised member photos and token-authorised public share photos | The gateway checks access on every request. Other-member and token photo access fails closed without key; direct Storage reads are restricted to owners/approved public story photos |

Do not claim live verification/payment/email/calling availability merely because flags or credentials are present. Enable only after the listed sandbox checks succeed. Auth email confirmation/recovery additionally requires Supabase redirect allowlists, site URL and a working configured email service.

## Required sandbox journeys

1. Dedicated member accounts: registration/confirmation, login/logout/recovery, profile publish/edit/photo/privacy, saved preferences, interest/acceptance, block and denied interactions.
2. Family: targeted confirmed email only, decline/accept, per-helper permissions, private contribution, immediate revocation, blocked/suspended/paused and expired-plan cases.
3. Future Map: save/reload/stale-version conflict, milestones, explicit connection share/revoke, private contents absent from discovery and admin metadata.
4. Messaging: two participants, atomic unread/read state, send retry, older history, attachments (type/size/quota), stranger/blocked/disconnected denial. Membership controls read receipt visibility and call initiation.
5. Calling: two-device/network voice/video, caller/callee busy, missing permissions, incoming/accept/reject/end, no answer, disconnect, revoke/block mid-call; verify media tracks stop.
6. Stripe: test checkout, signed webhook, duplicate/out-of-order event, payment failure, expired/cancelled membership, portal cancellation and authorised test refund with auditable reason. A checkout redirect cannot grant access.
7. Identity: hosted test submission, processing/requires-input/retry/canceled/verified, unsigned/duplicate/out-of-order webhook, no live badge for test evidence. Authorised document review occurs in Stripe Identity, not local ID storage.
8. Staff: Super Admin/Support/Moderator/ordinary user, direct denied API/RPC requests, role revocation, moderation actions and sensitive-action audit.
9. Keyboard/mobile/desktop: every visible form/link, validation/loading/error/retry, no overflow, photos/shares/export, session expiry.

## Migration and release order

Live migration history was read and is recorded in `PROJECT_COMPLETION_CHECKLIST.md`. Historical IDs differ from repository filenames. Apply **only** these missing files, in order, through a transaction-capable migration tool:

1. `20260929000000_member_reports_system.sql`
2. `20260929000100_member_blocks_system.sql`
3. `20260929000200_exclude_blocked_discovery.sql`
4. `20260929000300_admin_dashboard_report_counts.sql`
5. `20261016203931_admin_operations_completion.sql`
6. `20261016210055_website_support_and_profile_activity.sql`
7. `20261017104244_member_planning_and_account_controls.sql`
8. `20261017104625_secure_communication_and_media.sql`
9. `20261017105242_provider_integrations_and_operations.sql`

The last two migrations revoke direct chat/message mutation privileges and make the media bucket private. Coordinate them with deployment of the matching application; the old main build uses the replaced paths. Do not leave the old app running against the new policies. Preserve actual data and restore prior function/policy definitions deliberately if reverting.

Before promotion: verify clean install, all security/database/provider tests, type checking, production build, advisors and dedicated signed-in acceptance. Keep provider features disabled until provider-specific tests pass. Capture the known production deployment ID and previous function/policy definitions before applying migrations. Merge PR #40 only after these gates; confirm main deployment's commit SHA and READY status, then perform smoke checks of all protected/public routes and persistence.

Rollback: restore the previous Vercel deployment **together with** the prior compatible media/chat policies or roll forward to a corrected app. Do not drop new support, audit, provider receipt or moderation tables. No destructive down migration is provided because it would lose real records. Before claiming rollback ready, save and validate a schema backup and confirm recovery access.

## Still requires owner decisions / implementation

- Legal operator/public contact, final privacy lawful-processing information, retention schedule and applicable terms are not invented.
- Account deletion currently creates a visible paused-account request and staff queue. Automated permanent erasure, provider data-redaction/cancellation and a tested retained-record policy are **unfinished**.
- Full data export is a synchronous account download; large-account asynchronous export and binary archive are not implemented.
- TURN credentials are short-lived and user-scoped in code. Provider monitoring and real two-device tests remain outstanding.
- Live payment activation, international price IDs, applicable tax/refund policy, unrestricted notification delivery and identity production onboarding are not approved or tested by this development pass.

## Observed live baseline

The latest production attempts for main commit `f95b7cd6dfe69550d4a5de4e979a320ef663c8ca` are ERROR. A previous production build at `1e984e71945c829e8bf200c6153473081574d636` is READY and a rollback candidate. These failures predate this PR; the `cupidmatch.co.uk` alias was confirmed to point to deployment `dpl_7iLpBDWAPwAyBUjSLXrSCVgLXTk4` at that commit. Security advisors still report the existing security-definer discovery view and other legacy warnings because the pending migrations have not been applied. The new discovery invoker view and token-only share resolver are tested in isolated PostgreSQL; do not describe those fixes as live.

## Confirmed authentication settings

The public Supabase Auth settings endpoint was inspected read-only on 17 October: email signup enabled, email confirmation required, Google/Facebook disabled, phone authentication disabled (SMS provider label Twilio). No provider secret or sending capability was verified. Social buttons now follow actual enabled-provider settings. The phone/launch-offer journey remains blocked until an authorised SMS provider and phone authentication are configured and tested; no confirmation bypass was added.
