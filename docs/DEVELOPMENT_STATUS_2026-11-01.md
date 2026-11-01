# CupidMatch development audit — 1 November 2026

## Scope and verified baseline

Initial inventory: nine open PRs and two standalone issues. Main was e0e78389ffc4b01937d0dfcdaa9226c064988946 (23 October WhatsApp preview merge). Vercel production dpl_2gGRMK8iNfkGZFGY2jt9WYH3wvSD was READY on that SHA. No merge, production deployment, database mutation, live billing or real-member test was performed in this pass.

Reviewed PR metadata, changed-file patches and head checks for all nine initial PRs; detailed implementation work focused on discovery/actions and account lifecycle release state. This is a development checkpoint, not completion of all four phases or certification of security.

## Existing work and checks at initial audit

| PR | Area | Head checks | Remaining work |
| --- | --- | --- | --- |
| #36 | Phone OTP | build failed | Provider, authorization/rate-limit and integration review; do not require it for signup yet |
| #37 | Reporting/blocking | build and admin-tests failed | Reconcile current schema, RPC authorization/privacy and blocked-interaction coverage |
| #40 | Admin/billing/erasure | build and admin-tests passed | Provider sandbox acceptance, migration reconciliation, release/retention decisions; live billing remains disabled |
| #45 | Legacy AI guards and interest metering | build and admin-tests passed | Disposable DB/concurrency/schema/RLS validation before metering migration |
| #51 | Account lifecycle | build and admin-tests passed | Website release, real Google/mailbox and installed-device acceptance |
| #54 | Worldwide onboarding/locations | build failed | Latest branch includes more than original summary: location API/typeahead and tests; consolidate with #61, normalize values and verify migration/backfill |
| #58 | Family-helper security design | build failed | Design only, no delegated access implementation |
| #60 | Shortlist feedback | build passed | Signed-in acceptance; extended by #66 |
| #61 | Worldwide discovery countries | build passed | Selector only; no country-code data migration or complete issue #53 implementation |

#54 and #58 failing job logs reported TS2307 for a static WebP import. The asset exists; clean pre-build TypeScript lacks the generated image declarations when ignored next-env.d.ts is absent. The latest #54 source has also moved on from the failing logged commit, so rerun its exact current head after consolidation.

Issues #53 (global locations) and #31 (subscriptions/admin) remain open. Neither is complete merely because a related selector or billing screen exists.

## Completed fixes in this pass

- #62: canonical gender wins over stale matching fields; filtering and preference scoring agree; explicit neutral saved preferences remain neutral; the visible discovery gender choice takes effect and persists in shared/saved URLs. Three behavioral regressions added to CI.
- #66, stacked on #60: Interested and Shortlist catch auth failures and explain expired sessions, preserve plain PostgREST error messages, use synchronous duplicate-request locking, and change UI success state only after persistence. Five behavioral regressions cover ordering, retries and concurrency.
- Added explicit static-image type reference so clean pre-build checking does not depend on a generated next-env.d.ts.

## Validation

#62: npm ci --ignore-scripts succeeded. New discovery tests (3), existing signup, admin/deletion, horoscope/profile-gender and theme suites passed. TypeScript and production build passed; lint completed with zero errors and 13 warnings. Build emits an OpenTelemetry dynamic-dependency warning and skips its own lint/type validation, so those checks were run separately.

#66: five new action tests, separate TypeScript check, lint (zero errors/13 warnings), and production build passed. Provider/auth/database boundaries are stubbed by the new behavioral tests; no signed-in browser acceptance of either new branch has been performed.

Historical remote E2E run 40135154287 actually ran 25 tests and passed on 24 October (job log inspected). This is evidence for its then-configured target, not a new run or proof of the new branches, real Google OAuth, email delivery or installed mobile behavior.

## Live backend audit (read-only)

Supabase project status: ACTIVE_HEALTHY. Migration history includes account_lifecycle 20261022154857. Edge function account-lifecycle is ACTIVE, version 2. The old #51 PR body saying these are absent is stale; its branch RELEASE.md contains later backend acceptance evidence. Do not reapply the lifecycle migration blindly.

Advisors still flag public.discovery_profiles as SECURITY DEFINER, pg_trgm in public, leaked-password protection disabled, and executable definer functions. These notices require function-by-function authorization review; they do not establish an exploit and must not be fixed through blanket permission revocation. Live view definition inspected: publication, suspension, active-member/session and connection-photo checks exist. No user rows were read.

RLS-without-policy notices on account_deletions and horoscope_qa_allowlist may be intentional service-only access. Verify grants and architecture rather than adding client policies to silence notices.

Remediation references:
- https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Concurrent work and integration order

During this session new PRs #63, #64 and #65 appeared from other work. #63/#64 overlap #62/#60/#66; #65 addresses confirmation-only signup state and settings auth hydration. Their branches were not modified. Consolidate implementations and tests explicitly; do not merge overlapping PRs blindly. Original inventory of nine PRs is no longer the current total.

Priorities: review #65 signup/session fix; choose a combined discovery/actions implementation; signed-in isolated acceptance; reconcile #51 website/backend and complete its remaining device/provider checks; then consolidate #54/#61 location handling without erasing legacy values. Continue billing only in test mode after server entitlement/webhook/provider tests. Android APK/iPhone installation, mobile resume/offline behavior, reporting/moderation and real WhatsApp preview refresh remain unverified in this pass.

Git push lacked workspace credentials; changes were published through the connected GitHub API. No secrets were requested or printed.
