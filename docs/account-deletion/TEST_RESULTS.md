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

Live database migration: applied as a complete transaction through the authenticated Supabase SQL Editor. Read-back confirms `public.account_deletions` and migration history version `20261022154857`. Edge Function `account-lifecycle` v1 is ACTIVE and rejects unauthenticated deletion with HTTP 401. The owner saved the matching recovery secrets; the Supabase recovery endpoint returned HTTP 200 with zero attempted/failed jobs. Vercel Production secret metadata confirms its update. Magic Link/OTP email template is saved with code and link, and Email/Google providers remain enabled. The live disposable acceptance attempt stopped at account creation: Postgres/Auth logs identify the existing registration-pause trigger as the cause. No fixture account was created. Registrations remain paused. The temporary secret-authenticated QA runner was replaced with a JWT-protected HTTP 410 handler. OTP delivery, complete production disposable deletion acceptance, real Google OAuth, linked-provider sign-in and installed Android/iPhone PWA behaviour remain unverified. No real member accounts were used or removed.

Production: held pending the deployment order and acceptance gates in RELEASE.md. The owner redeployed existing main commit `eb8be59e9391f985b55c6c449adf549568834393`; Vercel deployment `dpl_26SyXdL6vAKe5Qu7PB3d2qcxwzeX` is READY. This does not contain the account-deletion UI.
