# CupidMatch resumption audit — 1 November 2026

## Verified baseline and boundaries

Main remained `e0e78389ffc4b01937d0dfcdaa9226c064988946` at initial clone and subsequent remote check. Production deployment `dpl_2gGRMK8iNfkGZFGY2jt9WYH3wvSD` is READY on that SHA. This pass made no production deployment, merge, live billing change, schema mutation or real-member mutation. Database inspection used schema metadata and advisors only.

All nine initially open PRs were fetched with changes/discussions and their current head status and Actions runs. Issues #31 (subscriptions/admin) and #53 (worldwide locations) remain open. This is an integration and risk audit, not certification that every path in the large historical PRs is correct.

| Existing PR | Latest head Actions | Findings / next action |
| --- | --- | --- |
| #36 Phone OTP | Verify failed | `audit-explorer.tsx` TS1005; conflicts with main. Provider delivery/configuration and privacy/rate-limit acceptance required. |
| #37 Reports/moderation | Verify and Admin failed | Same audit-explorer syntax failure; conflicts with main. Retain reporting/blocking intent, reconcile against #40 before release. |
| #40 Admin/billing/account roadmap | Verify and Admin passed | 254 changed files. Substantial server authorization/provider infrastructure exists; release documentation requires staging, coordinated migrations, real provider tests and legal/operator decisions. Its account-erasure model overlaps #51 and must be reconciled. Do not merge wholesale or enable live billing. |
| #45 AI guards/interest metering | Verify and Admin passed | Targets #40's branch, not main. Atomic metering migration still needs isolated concurrency/RLS/paid-boundary tests and migration-order review. |
| #51 Recoverable lifecycle | Verify and Admin passed | Conflicts with main. New branch ports only its five feature/follow-up commits onto current main, preserving newer unrelated assets, signup safeguards, horoscope QA and admin confirmation. |
| #54 Worldwide onboarding | Verify failed | Missing declaration for static hero image import; conflicts with main. Includes additional location-search work beyond the original description. Its separate country-label list can disagree with #61. |
| #58 Family-helper boundaries | Verify failed | Missing static hero image declaration; design-only, no delegated access enabled. |
| #60 Shortlist feedback | Verify passed | Feedback improvement exists; Phase 1 work also protects synchronous duplicate requests and authentication errors. Overlapping alternatives must not be merged blindly. |
| #61 Global discovery countries | Verify passed | 249-country list exists, but discovery-only; initial onboarding still has eight entries. Shared-selector work reuses this list with legacy aliases and tests. |

All nine heads had successful Vercel statuses. This does not override failed Actions: Next config skips type checking and lint during builds. Four failed head runs were traced to the specific TypeScript failures above.

## New work and discovered concurrent changes

- #63: canonical gender filtering/scoring and shortlist/interest request feedback/locking; follow-up also respects explicit neutral gender choice and selectable/shared filter state.
- #65: unconfirmed signup identity stays out of authenticated cache; settings subscribes to hydrated auth instead of reading the cache only once.
- Lifecycle integration branch: ports #51 onto current main; preserves current two-step admin deletion confirmation and adds recent-auth requirements. No backend deployment or migration rerun.
- Worldwide country consistency branch: one shared 249-country list for onboarding/preferences/discovery; compares ISO IDs and legacy names without rewriting stored profiles. Unknown saved selections and free-text settlement values remain accepted.
- #62 and #64 appeared during this session. They independently overlap the discovery and signup work. Their diffs were inspected. Choose/reconcile one implementation for overlapping areas; do not merge #60/#62/#63/#64 together blindly. #65 also overlaps #64's signup cache fix, while its settings hydration change is separate. None of these existing or concurrent branches was overwritten or closed.

## Confirmed defects addressed

1. Matching read stale `extra.matchDetails.gender` before canonical `extra.gender`, disagreeing with the profile editor.
2. Discovery's default gender overrode its visible selector; explicit neutral preferences could be replaced by a binary default.
3. Shortlist rejected requests escaped without feedback; rapid clicks could start duplicate writes while auth resolved.
4. Interested auth failures occurred outside its error handler; duplicate requests were possible before React disabled the button.
5. Email-confirmation signup cached an unauthenticated identity as the current signed-in user.
6. Settings read the auth cache once before hydration and could stay loading indefinitely.
7. Onboarding and discovery offered incompatible restricted country sets, and country-name/ISO aliases did not match consistently.
8. Account lifecycle code existed on #51 but could not integrate cleanly with current main; conflict resolution retains newer safeguards.

## Security and lifecycle metadata

Live read-only checks confirmed migration `20261022154857` exists and `account-lifecycle` Edge Function is ACTIVE at version 2. Do not replay the migration merely because #51's older PR body says it is missing. The current branch's release notes contain later backend acceptance evidence; that earlier evidence was not rerun against real users in this session.

The security advisor still reports the `discovery_profiles` SECURITY DEFINER view. Inspected view SQL explicitly filters published/non-suspended/active profiles, checks active sessions, masks private photos and projects a limited `extra` object. The advisor flag alone is not proof of a bypass; review grants, predicate coverage and intended projection in isolated role tests before changing its security mode. Simply switching to invoker could break intended cross-member discovery under owner-only profile RLS.

Other findings: public extension placement, callable definer functions and disabled leaked-password protection. Callable RPCs require function-by-function authorization review; some are intentionally public share resolvers or authenticated operations. Service-only account-deletion and QA allowlist tables intentionally have RLS without client policies. Do not add permissive policies just to clear INFO notices.

Remediation references:
- https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Verification and remaining gates

- Discovery: 10 targeted behavioral/gender tests; existing signup, admin/deletion, horoscope, theme and sharing suites pass. TypeScript, lint and production build pass; 13 existing lint warnings.
- Auth: 10 signup/auth regressions, including six executing the real auth module with isolated service boundaries; TypeScript/lint/build pass.
- Lifecycle integration: 24 account tests (disposable PostgreSQL plus saga/Edge boundaries), 116 admin tests; additional baseline suites, TypeScript, lint and build checked. No real account erased.
- Country consistency: five tests cover all 249 codes/name roundtrips, legacy aliases, accented names, saved/manual location preservation and compatible discovery/scoring. Full checks recorded in PR.
- Builds emit existing OpenTelemetry dependency/cache warnings. Separate TypeScript/lint checks are mandatory because build skips them.
- Chromium and WebKit executables are absent in this environment. No real installed Android/iPhone, browser OAuth, actual mailbox delivery, Stripe sandbox, or real-member acceptance is claimed.

Phase 1 is not fully released or accepted. Required next steps: reconcile overlapping PRs; test integrated changes together; create/use an isolated staging environment with dedicated accounts; run real Google and confirmation-email flows; exercise lifecycle UI/password/OTP and role revocation; review live schema grants and privileged RPCs without accessing member records.

Phase 2 remains incomplete: region/city identifiers, worldwide settlement search/gazetteer, migration/backfill plan and staging preservation tests are still required. Country selectors alone do not close #53.

Phase 3 remains held: reconcile #40/#45 with lifecycle semantics, validate missing migration order against current live metadata, provision test-only Stripe configuration securely, and perform webhook/checkout/portal/cancel/entitlement acceptance. No live billing enabled.

Phase 4 remains incomplete: physical installed APK/PWA acceptance, responsive profile-detail and moderation/reporting journeys. Existing purple/gold styling and approved WhatsApp artwork remain preserved.
