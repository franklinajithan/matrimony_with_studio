# Account deletion release gate

Status on 22 October 2026: implemented and locally tested; website NOT released to production.

Configuration follow-up: Supabase Edge Function `account-lifecycle` version 1 is ACTIVE. Vercel Production `CRON_SECRET` is configured. The database migration still fails with `Invalid or expired requestState`; Supabase Edge recovery secret and Auth email template remain pending. The Supabase CLI has no authenticated access token. No secret value is stored in tracked files. The prepared OTP template is `supabase/templates/magic-link.html`; applying it must preserve email sign-in and the confirmation-link fallback.

Two Supabase `apply_migration` attempts failed with `McpServerError: Invalid or expired requestState`. A subsequent read confirmed `to_regclass('public.account_deletions')` is NULL. No real member was deleted. Do not merge/release before the database, function and acceptance checks below are complete.

## Architecture

Account Settings exposes separate deactivation/reactivation and permanent deletion. Both member and admin deletion require reauthentication and explicit confirmation. Freshness is based on the verified token's AMR timestamp (five minutes), not token refresh time or user-editable metadata. A database session check rejects revoked sessions.

The Next.js routes use the member's session to invoke the authenticated Supabase `account-lifecycle` Edge Function. The function independently validates that exact token, the live database session, recent authentication and, for admin deletion, the current database role. It derives self-deletion targets from the verified identity. Supabase supplies its service-role key inside the Edge runtime; that credential is never sent to Vercel or the browser.

The deletion saga locks/unpublishes the account, revokes sessions, bans login, removes physical objects via Storage API, erases residual/embedded data, then hard-deletes Auth. FK cascades remove owned records and OAuth identities. A service-only ledger records requester, subject, timestamps, state and failure stage. A processing lease prevents duplicate concurrent cleanup and expires after a worker crash. Failed accounts remain hidden and cannot use old access tokens; the recovery endpoint retries pending work. An interrupted completion can recover after Auth is already absent.

Shared chats retain the surviving member's messages. The removed member's messages, cached name/avatar, previews and unread map entries are erased, and their participant becomes NULL. The UI labels that thread Deleted member and disables composing. Empty threads are removed when both participants are gone. Other members' posts retain their content; removed-member comments and likes are removed and counts recalculated.

Deactivation retains the account, hides discovery and stops social interactions without banning login. Reactivation requires fresh authentication and leaves the profile unpublished for an explicit later publication.

## Deployment order

1. Apply `supabase/migrations/20261022154857_account_lifecycle.sql` to the identified CupidMatch project `ztuquqsmmfkoqhobfgyt`. This adds server-managed lifecycle columns, the service-only ledger and RPCs, session restrictions, shared-chat FK changes and cleanup triggers. Verify migration history and inspect advisors. The migration was executed in disposable PGlite, including a service role without Auth session DELETE privileges.
2. Run `node scripts/sync-account-edge.mjs`. Deploy the files in `supabase/functions/account-lifecycle` with its `deno.json` import map. Gateway JWT verification must be disabled for the scheduler, because the handler implements its own authentication: every member action validates the bearer through `auth.getUser`, live session and AMR checks; recovery requires a separate secret. CLI equivalent: `supabase functions deploy account-lifecycle --no-verify-jwt` after linking the correct project. Do not disable authentication in the handler.
3. Configure a random secret as `ACCOUNT_DELETION_RECOVERY_SECRET` in Supabase Edge secrets and the same value as `CRON_SECRET` in Vercel Production. Never commit the secret. Vercel's `/api/internal/account-deletion-recovery` schedule runs daily at 03:00 UTC. Monitor 503 responses and unresolved ledger rows. Larger backlogs should use a more frequent scheduler; each run attempts five jobs and processes storage in batches.
4. In Supabase Auth's Magic Link email template, include `{{ .Token }}` so Google-only/linked members can enter the email OTP. Keep email sign-in enabled. Test delivery and expiry using a disposable mailbox. Password reauthentication does not require a template change.
5. Run the live acceptance command below, merge the tested PR, and verify the Vercel deployment SHA and public settings flow. A staging database/function should be used before the production acceptance run.

No Vercel `SUPABASE_SERVICE_ROLE_KEY` is required for this feature. Existing unrelated features may still require their own configuration.

## Automated acceptance

In a trusted server environment with `NEXT_PUBLIC_SUPABASE_URL`, the publishable/anon key and `SUPABASE_SERVICE_ROLE_KEY` configured, run:

```sh
node scripts/account-deletion-acceptance.mjs
```

Set `QA_BASE_URL` to the deployed HTTPS website to exercise the Next.js route with the disposable member's cookie, rather than invoke Edge directly. The script creates only random `cupidmatch-delete-qa-…@example.com` accounts, writes profile/onboarding/preferences, a photo, biodata, horoscope and interactions with a second disposable member. It checks deactivation, deletion, sign-in denial, discovery exclusion, file cleanup, owned-data cleanup, preservation of the peer's message, stale-session denial and same-email signup. It cleans up only IDs created in that process. It never accepts a real member ID. Admin creation bypasses email confirmation for fixtures; real email verification and real Google OAuth need separate tests.

The UI harness is `node scripts/account-lifecycle-browser.mjs`. It creates a temporary public test route, mocks Auth/account responses, exercises desktop Chrome, Android emulation and iPhone WebKit, then removes the harness. It checks visibility, confirmation gating, deactivation and local-state clearing/home navigation. It is UI-only, not proof of backend deletion or installation behaviour. Install Chromium and WebKit plus their Linux dependencies first. Do not run concurrently with a release build.

Manual installed-device checks remain required: Android Chrome/PWA and iPhone Safari/Add to Home Screen; password and email OTP; keyboard/scrolling/final confirmation; app foreground/resume; back navigation; offline deletion failure; local/session storage and cached private content; re-registration. Use a disposable Google test identity for real OAuth and linked-identity acceptance. No physical device or real Google credentials were available in this run.

## Retention

The public policy is `/account-data-policy`. Completed deletion ledger entries are purged after 90 days by recovery; incomplete entries remain until resolved. Old audit payloads/subject identifiers are erased. No new local legal/accounting archive is created. Active external paid subscriptions block deletion until cancelled; provider invoices/backups/cache copies are governed by their own policies. Local deletion does not certify provider backup erasure. A restored database must have outstanding and completed deletion requests reapplied before serving members.

The 90-day operational period is a product policy, not a legal retention claim. Product owners must keep the public policy consistent with any later finance/fraud archive or third-party retention changes.
