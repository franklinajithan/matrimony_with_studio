# Verification — 22 October 2026

- `npm run test:account`: 24 passed. Real migration runs in disposable PostgreSQL/PGlite; unit tests execute the actual deletion saga and Edge authentication handler with isolated external boundaries.
- `npm run test:admin`: 116 passed (includes the deletion unit tests, so counts overlap).
- `npm run test:horoscope`: passed, including database/security and TypeScript calculation suites.
- `npm run test:theme`: 12 passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 14 pre-existing warnings and no errors.
- `npm run build`: passed. TypeScript and ESLint were also run independently because the existing Next.js build configuration skips them.
- `git diff --check`: passed.

Database checks cover session existence/revocation, server-managed lifecycle fields, service-only cleanup access, deactivation/reactivation, shared-content preservation, embedded comment/like cleanup, Auth identity FK cascades, same-email unique-key reuse, and empty shared-chat removal. Saga checks cover email/Google/linked identity shapes, 205-file batching across buckets, failures at each destructive stage, leases, repeated deletion and lost completion recovery. Edge checks reject unauthenticated/stale/revoked callers, non-admin deletion and missing confirmation, and ensure a self-delete cannot choose another target.

Browser harness: attempted; not passed. Chromium downloads were invalid/truncated. WebKit downloaded through the alternate CDN but could not launch because host libraries are missing; dependency installation failed due host package-cache permissions. These are test-environment failures, not a claim that UI/device acceptance passed.

Live database migration: applied as a complete transaction through the authenticated Supabase SQL Editor. Read-back confirms `public.account_deletions` and migration history version `20261022154857`. Edge Function `account-lifecycle` v1 is ACTIVE and rejects unauthenticated deletion with HTTP 401. The owner saved the matching recovery secrets; the Supabase recovery endpoint returned HTTP 200 with zero attempted/failed jobs. Vercel Production secret metadata confirms its update. Magic Link/OTP email template is saved with code and link, and Email/Google providers remain enabled. Live backend acceptance completed through a temporary secret-authenticated runner using Supabase's injected server credentials. Passed: deactivation, authentication revoked, profile removed, storage removed, related data removed, peer content preserved, discovery removed, stale session rejected, same-email Auth identity recreated, and recreated identity sign-in. Public signup confirmation remains unverified: SMTP 550 rejects the synthetic `example.com` recipient; the report correctly records `sameEmailRegistration: false` and an email-delivery error. Administrative identity recreation is not claimed as a completed public signup flow.

The trusted fixture seeds horoscope data directly because horoscope editing is intentionally disabled, creates the required accepted connection, and sorts chat participants. Registration was temporarily enabled with owner authorization, then paused again. Read-back confirms zero remaining disposable Auth users and two completed deletion jobs. The temporary QA function is now a JWT-protected HTTP 410 handler. Real-mailbox OTP/signup delivery, real Google/linked-provider sign-in and installed Android/iPhone PWA behaviour remain unverified. No real member accounts were removed.

Production: held pending the deployment order and acceptance gates in RELEASE.md. The owner redeployed existing main commit `eb8be59e9391f985b55c6c449adf549568834393`; Vercel deployment `dpl_26SyXdL6vAKe5Qu7PB3d2qcxwzeX` is READY. This does not contain the account-deletion UI.
