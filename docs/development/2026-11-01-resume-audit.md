# CupidMatch audit and interest-persistence fix — 1 November 2026

## Verified baseline
Main and the latest READY production deployment both use e0e78389ffc4b01937d0dfcdaa9226c064988946. Deployment: dpl_2gGRMK8iNfkGZFGY2jt9WYH3wvSD. No newer main commit was present at checkout. There are now **15 open PRs**, rather than the nine in the original brief, and two standalone issues: [#31](https://github.com/franklinajithan/matrimony_with_studio/issues/31) (subscriptions/admin) and [#53](https://github.com/franklinajithan/matrimony_with_studio/issues/53) (worldwide locations).

All PR metadata/diffs and current commit workflow runs were fetched. Statuses below are a snapshot and can change. A green Vercel build does not establish functional acceptance: next.config.ts skips type and lint checks.

| PR | Scope | Audited head | Actions snapshot |
| --- | --- | --- | --- |
| [#67](https://github.com/franklinajithan/matrimony_with_studio/pull/67) | Protect connection-only photos and inactive members in public profile shares | 79fd6217 | Verify: in_progress |
| [#66](https://github.com/franklinajithan/matrimony_with_studio/pull/66) | Handle expired sessions and duplicate Shortlist/Interested requests | 56d98e02 | Verify: success |
| [#65](https://github.com/franklinajithan/matrimony_with_studio/pull/65) | Fix confirmation-only signup state and settings session hydration | 2fae3c94 | Verify: success |
| [#64](https://github.com/franklinajithan/matrimony_with_studio/pull/64) | Fix discovery gender selection, signup session state, and member action feedback | 0756f07d | Verify: success |
| [#63](https://github.com/franklinajithan/matrimony_with_studio/pull/63) | Fix discovery gender consistency and member action feedback | 36046551 | Verify: success |
| [#62](https://github.com/franklinajithan/matrimony_with_studio/pull/62) | Fix canonical gender matching and discovery gender selection | 89e0b58f | Verify: in_progress |
| [#61](https://github.com/franklinajithan/matrimony_with_studio/pull/61) | Phase 2: expand discovery country filter worldwide | a70aff37 | Verify: success |
| [#60](https://github.com/franklinajithan/matrimony_with_studio/pull/60) | Fix shortlist action feedback in member discovery | 01a06c8c | Verify: success |
| [#58](https://github.com/franklinajithan/matrimony_with_studio/pull/58) | Define secure family-assistance permission boundaries | abeeb31b | Verify: failure |
| [#54](https://github.com/franklinajithan/matrimony_with_studio/pull/54) | Enable worldwide country selection in CupidMatch onboarding | ca838d37 | Verify: failure |
| [#51](https://github.com/franklinajithan/matrimony_with_studio/pull/51) | Add recoverable account deletion and deactivation (release gated) | 080af7fc | Verify: success; Admin security checks: success |
| [#45](https://github.com/franklinajithan/matrimony_with_studio/pull/45) | Security: guard legacy AI actions and atomically meter sent interests | ba2d7451 | Admin security checks: success; Verify: success |
| [#40](https://github.com/franklinajithan/matrimony_with_studio/pull/40) | Complete CupidMatch admin, billing UI, account erasure and member roadmap | 588819e5 | Admin security checks: success; Verify: success |
| [#37](https://github.com/franklinajithan/matrimony_with_studio/pull/37) | Add Member Reports & Safety Moderation System | 6f5cc606 | Admin security checks: failure; Verify: failure |
| [#36](https://github.com/franklinajithan/matrimony_with_studio/pull/36) | feat: Mobile Number + OTP Verification for Member Registration | 9b193b53 | Verify: failure |

## Confirmed CI defects
Downloaded failing Verify job logs: #36 and #37 fail TypeScript with TS1005 in src/app/admin/security/audit-explorer.tsx (missing closing brace). #54 and #58 fail TS2307 resolving the landing-page WebP import. Tests preceding typecheck pass; build is skipped in these runs.

## Phase 1 disposition
- #62/#63/#64 overlap gender/discovery work; #60/#63/#64/#66 overlap action feedback. Review as alternatives and consolidate before merging. Do not merge every overlapping patch.
- #64 has the broadest existing discovery/auth/action coverage; #65 adds settings hydration and additional actual-auth-module regressions. #62 additionally preserves the gender selector through saved/shared URLs. These differences require a combined acceptance branch before release.
- #51 replaces mock deactivation and adds recoverable erasure. It conflicts with main and overlaps #40's separate erasure architecture. Review lifecycle state, recovery and session revocation as one coherent system before enabling UI.
- #67 proposes share-photo privacy and inactive-account protection, stacked on #64. Its SQL migration remains a review/staging item. Do not infer deployment from a successful preview.
- No production member records, credentials or share tokens were read for this audit.

## Completed fix in this branch
Interest resends previously treated an UPDATE without an error as success even if zero rows were changed. The actual service now requests only the updated ID and rejects a missing row. The update also matches the status read earlier, preventing a stale resend from resetting a request whose status has since changed. Existing RLS, first-time sends, pending-request protection and accepted-connection checks remain enforced. This is a separate, small fix against main, with no schema change and no overlap with the UI handlers.

Eight HTTP-boundary regressions execute the actual service and installed Supabase/PostgREST query builder. Coverage: declined/withdrawn/removed-connection resends, zero-row updates, permission errors, pending duplicates, existing connections and first sends. They verify return=representation and the status predicate. They do not claim a live database or signed-in end-to-end test.

## Validation
- Clean npm ci --ignore-scripts: passed.
- New test:interests: 8 passed.
- Existing signup, admin/deletion, horoscope/gender, theme and WhatsApp suites: passed.
- TypeScript: passed.
- Lint: passed, 13 existing warnings.
- Production build: passed (107 static pages). Existing Genkit/OpenTelemetry and webpack cache warnings remain. TypeScript and lint were run separately.

## Next priorities and blockers
1. Combine the complementary #62/#64/#65 fixes without duplicating handlers; signed-in browser, real Google OAuth and email-confirmation delivery are still unverified.
2. Reconcile #51 and #40 deletion architectures and validate with disposable staging accounts; no real-member deletion for QA.
3. Stage and exercise #67's privacy migration after confirming lifecycle dependencies. The earlier audit in #64 reports live privacy/advisor findings; those live Supabase metadata checks were not rerun in this branch.
4. #54 and #61 use different country sources. #54's optional Open-Meteo lookup does not implement #53's indexed GeoNames dataset or separate stable city/region IDs. Unify sources and aliases without rewriting legacy free-text locations, then design an additive, reversible backfill.
5. #40 changes 254 files and conflicts with main; #45 is stacked on it. Validate server entitlements, atomic quotas, webhook signatures/idempotency, cancellation and renewals with Stripe test-mode credentials before any live billing decision.
6. #37's report/block components require integration and bidirectional database acceptance; #36 requires an SMS provider and secure OTP acceptance. Green previews do not settle these blockers.
7. Android APK and installed iPhone PWA OAuth/resume/offline flows require device acceptance. Preserve the existing purple/gold design; WhatsApp 1200×630 regression checks pass.

## Change boundaries
No merges, production deployments, schema migrations, live billing activation, production auth-setting changes or production user mutations were performed. Existing PR branches were left intact.

## Follow-up snapshot after new work appeared
The final inventory is **19 open PRs**, with main unchanged. The original 15 plus these additions were inspected:
- [#68](https://github.com/franklinajithan/matrimony_with_studio/pull/68): current-main lifecycle integration of #51. Actions Verify and admin security checks pass. Still overlaps #40; real OAuth/mail/device acceptance remains pending.
- [#69](https://github.com/franklinajithan/matrimony_with_studio/pull/69): shared country options/aliases from #61 across onboarding/preferences/discovery, preserving manual labels. Verify passes.
- [#70](https://github.com/franklinajithan/matrimony_with_studio/pull/70): this focused resend-persistence fix. Local checks pass; remote Verify/Vercel were still running at the follow-up snapshot.
- [#71](https://github.com/franklinajithan/matrimony_with_studio/pull/71): complementary shared-country work including match-detail editor and bounded/searchable preference selection, stacked on #64. Verify was running. Overlaps #69/#54/#61; reconcile rather than merging duplicates.

No additional competing country implementation was created after #69/#71 appeared. Both remain partial progress toward #53: indexed worldwide city/region identifiers, additive backfill and full location/device acceptance are outstanding.

## Read-only live security follow-up
The matrimony Supabase project is ACTIVE_HEALTHY. Only schema/policy/trigger metadata and security advisors were queried; no member data was queried or mutated.

**High-priority authorization finding:** broad legacy participant UPDATE/INSERT policies coexist with narrower interest policies. The policies are permissive and therefore combine by OR; the restrictive account-live-session policy is present and remains restrictive. The broad policies mean the narrower state-transition rules cannot be treated as the effective security boundary. The inspected match-request triggers check activity and update timestamps, but do not independently establish participant immutability and a complete role-based transition model. This is a schema-review finding, not a claim that an unauthorized production write was attempted. Prepare an isolated SQL acceptance suite for sender/receiver/admin transitions, immutability, self-targeting, session revocation, concurrency and removed-connection resends before proposing a coordinated policy/trigger migration. This PR does not fix that authorization concern.

Advisors still flag the discovery SECURITY DEFINER view, public execution of privileged functions, pg_trgm in public and service-only tables without client policies. Assess each function and view intentionally; do not grant client access to service-only tables or blindly change discovery visibility. References: [view security](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view), [public function execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [RLS without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). The privacy proposal in #67 and authorization review remain release gates.
