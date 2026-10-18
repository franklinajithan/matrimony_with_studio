# CupidMatch provider setup and release gates — 18 October 2026

All integrations are application-side implementations until the sandbox checklist below passes. Stripe/Identity sandbox routes require a dedicated test-member allowlist and reject ordinary member IDs. No real member records were changed, no real charge/refund was made, and no email/SMS was sent during development.

## Secure environment setup

Configure through Vercel/provider settings; never commit or paste secret values into issues or chat.

| Capability | Required setup | Current boundary |
|---|---|---|
| Provider database writes | `SUPABASE_SERVICE_ROLE_KEY` (server only) | Missing on inspected Vercel project |
| Stripe billing | `BILLING_ENABLED=true`, `STRIPE_SECRET_KEY` (`sk_test_` or restricted test key), `STRIPE_WEBHOOK_SECRET`; mandatory `PROVIDER_TEST_MEMBER_IDS` allowlist of dedicated test account UUIDs; six `STRIPE_PRICE_*` values in `docs/STRIPE_SETUP.env.example` | Test keys only; live keys rejected |
| Prices | Recurring GBP prices: Premium £7.99 / £19.99 / £34.99; Premium+ £14.99 / £34.99 / £59.99, recurring every 1 / 3 / 6 months | Provider price amount/currency/interval is validated; other market displays remain estimates |
| Billing webhook | `/api/billing/webhook`, subscription lifecycle, checkout completion and invoice events | Raw-body Stripe signature verification, receipt idempotency and stale-event protection |
| Identity (optional) | Keep `IDENTITY_ENABLED=false` for now. Later: authorised Stripe Identity account/test key, separate `STRIPE_IDENTITY_WEBHOOK_SECRET`; `/api/identity/webhook` | Optional and disabled as requested; hosted documents/selfie, no live badge for test evidence |
| SMS | Configure Supabase Auth SMS provider (e.g. an authorised Twilio account), sending countries, CAPTCHA/abuse controls and OTP expiration (recommended 10 minutes); then `SMS_ENABLED=true` | 60-second app resend cooldown, five send attempts/hour and ten verification attempts/hour, plus Supabase Auth's own limits/expiry. External delivery not tested |
| Calls | `CALLING_ENABLED=true`, `TURN_URL`, `TURN_AUTH_SECRET` (at least 32 characters, matching an authorised TURN REST server); enable private database `calling` feature flag only for authorised acceptance tests | Disabled by default at API and database. Test voice/video between two consenting test accounts on separate networks; the app issues user-bound ten-minute TURN credentials |
| Email | Verified sender/domain, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `EMAIL_FROM`, `EMAIL_NOTIFICATIONS_ENABLED=true`, `CRON_SECRET`; default `EMAIL_DELIVERY_MODE=test` with explicit `EMAIL_TEST_RECIPIENTS` | Worker `/api/jobs/email`; signed receipts `/api/email/webhook` for delivered, bounced, complained, failed and suppressed. No scheduler or actual sends tested. Live mode additionally needs `EMAIL_DELIVERY_MODE=live` and `EMAIL_LIVE_DELIVERY_APPROVED=true` after acceptance; only current opted-in/confirmed/active members and authorised interactions qualify |
| Account erasure | Keep `ACCOUNT_DELETION_ENABLED=false`. After retention review and dedicated-account acceptance: server key, `CRON_SECRET`, `RETENTION_POLICY_APPROVED=true`, `ACCOUNT_DELETION_ENABLED=true` | Worker `/api/jobs/account-deletion`, one approved job per invocation. No scheduler enabled. Staff/open safety holds block erasure. Stripe cleanup requires test-member allowlist; live provider cleanup is not automated |
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
10. Deletion: export first; request hides access; stale/unauthorised approval denied; cancellation before processing; staff/safety holds; storage failure and provider-redaction wait; retry after application records removed but Auth delete failed; verify files, records, sessions and account removal before completion. A shared conversation and its attachments are removed on both sides; unrelated members remain. No real member may be used as an erasure fixture.
11. Email: only confirmed opted-in test addresses; no send after opt-out/block/disconnection/pause; retries/idempotency and retry exhaustion; signed delivery/bounce/complaint, duplicate/out-of-order receipts; bounce/complaint disables optional email. Admin queue exposes metadata, not addresses or message bodies. Sent means accepted, not delivered or read.

Stripe test portal configuration must permit payment-method updates, invoices and renewal cancellation; configure supported subscription price changes deliberately. Checkout permits Stripe promotion codes. These are distinct from app invitation/trial codes. Repeated checkout reuses a pending matching session; changing a choice expires the old session. Existing unpaid/incomplete/paused subscriptions block a duplicate subscription. Never test with live cards, charges or ordinary member IDs. Payout administration is excluded.

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
- Erasure application code is implemented and isolated tests cover approval, leases, cancellation, safety holds, shared-conversation/storage cleanup, partial recovery and completion checks. It remains disabled and unverified against actual Auth/Storage/providers. Approving a job does not mean erased. Test Stripe customer deletion cancels subscriptions without a new charge; Identity cleanup waits for provider redaction. Live provider records require a reviewed manual procedure. Audit/job/provider-operation history is retained; provider financial records follow provider retention. The operator must approve exact retention periods and handling of backups/closed safety records before enabling this workflow. No retention period is invented. Jobs stop after ten attempts; expired leases can resume. Operators must investigate exhausted/held jobs without bypassing the safety checks.
- Account export now includes a streamed, paginated .tar.gz download with available owned binaries and an explicit completeness manifest. It requires the server storage key; three requests/hour, 250MB total, 10MB/file and a two-minute processing budget are enforced. Larger exports need assistance; there is no asynchronous export worker.
- TURN credentials are short-lived and user-scoped in code. Provider monitoring and real two-device tests remain outstanding.
- Live payment activation, international price IDs, applicable tax/refund policy, live notification activation and identity production onboarding are not approved or tested by this development pass.

## Observed live baseline

The 18 October deployment inspection shows production READY at `dpl_G9VRoCpF3Y8uhZVpAoGHdU76idL2`, main `5805c47baca3447ed7bfe6dd385308492226beaa`. This includes the newer matching-gender fix. PR #40 preserves it. Pending privacy/admin schema fixes have not been applied live; do not describe isolated PostgreSQL verification as a production fix. Inspected environment metadata still contains only the public Supabase/site variables: service key, Stripe, Resend and worker configuration are absent.

Live security advisors still flag the definer `discovery_profiles` view (ERROR), public extension placement, executable definer functions and disabled leaked-password protection. Pending migrations contain the scoped wrappers and discovery privacy changes; run advisors again after staging migration. Review each remaining finding before production. Do not claim the live database is fixed because the isolated tests passed.

## Confirmed authentication settings

Google login reached the production dashboard and survived reload on 17 October after the owner corrected the registered Supabase callback and site/redirect configuration. The earlier provider mismatch is resolved. No secret was committed. The 18 October public preview offers Google and correctly guards membership behind sign-in; plan-preservation was corrected after that browser check. Facebook, dedicated-account recovery/confirmation and delegated staff journeys remain unverified.

SMS is intentionally deferred, preserving today's main-branch decision: members may use the dashboard without a mobile number. The guarded OTP flow is retained for later enablement; no phone status or trial entitlement is granted without actual evidence. Email confirmation remains required.

The attempted isolated Supabase staging branch setup returned an expired-request error and no branch exists. Signed-in acceptance requires a working isolated environment and existing authorised test accounts.
