# CupidMatch admin work and remaining release tasks — 2 November 2026

## Baseline
Continued from PR #74 (`f9b1038d9fbbb783a85b0e05d9dced99e61cfb82`), which is stacked on the consolidated core changes in #72 and member safety in #73. Older overlapping branches remain open and must not be merged independently. No merge or production release was performed.

## Implemented in this branch
- Dashboard operations: exact server counts for published profiles, seven-day new members, submitted verification requests, open reports, pending success stories and active subscription records. Queries run concurrently and return counts without member rows. Missing queues remain unavailable, while healthy queues can still render. No revenue is estimated from plan prices.
- Success-story moderation: bounded status-filtered pages, complete submitted text, approve/reject/return-to-pending confirmation, required reason, synchronous duplicate-submit guard, retry and optimistic conflict handling. Replaced the unbounded browser/realtime admin read with guarded server endpoints.
- Atomic database audit: the staged trigger checks a current admin/session, prevents editing submitted evidence, stamps publication time and records actual actor, previous/new status and reason. Audit failure rolls back the review. Reasons are stored only in the protected audit log, not copied into publicly readable story notes.
- The API calls a migration-owned invoker RPC so a backend without the migration cannot silently moderate through a legacy unaudited policy. Members cannot self-publish on insert or forge review notes/publication timestamps. No new public SECURITY DEFINER API was introduced; the internal audit trigger cannot be directly executed by public/member roles.
- Plans now displays database catalogue values instead of static launch constants, handles deployed `is_active` and future `active` fields, and shows absent multi-month prices as not configured. Unknown catalogue fields are omitted from the API response. Pricing mutations remain a coordinated billing-release task.
- Subscription and billing-event records now appear alongside the existing trial operations, with search, member links, status, renewal flags, event history, refresh/error/retry and bounded reads. Provider IDs and event payloads are not returned. This view never grants/revokes paid access or alters a charge.
- Dashboard links now include Reports and Horoscope; mobile More includes Invitation codes and Horoscope.
- CI runs the new API/PostgreSQL/component regression suite.

## Read-only deployment findings
Live schema metadata from the matched `matrimony-with-studio` project confirms success_stories and verification_requests exist. The deployed plan catalogue has monthly_price_pence and is_active but lacks three/six-month prices. member_subscriptions and subscription_events are not installed. No member records were retrieved for this audit.

The staged migration tolerates missing payment tables and does not invent a payment schema or change plan prices. If the coordinated billing foundation is installed later, reapply the read policies or incorporate them into that release. Until then, billing records correctly display unavailable. No payment activation is implied by an admin page.

Security advisors were read without changes. Existing discovery-view/privileged-function findings still require deliberate review; avoid blanket grant or view changes. References: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view and https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable . This branch does not claim to fix the entire historical security backlog.

## Pending work across CupidMatch
| Area | Remaining work |
| --- | --- |
| Core release | Review the consolidated #72 → #73 → #74 chain, reconcile older duplicate PRs, stage migrations in dependency order, then perform signed-in acceptance and an approved release. |
| Admin release | Stage this branch's story/read-policy migration, verify current admin and non-admin sessions, run actual story review/audit and billing-unavailable journeys, and test mobile navigation. |
| Paid membership | Reconcile #40; install the coordinated billing foundation, connect Stripe Checkout/verified webhooks/customer portal, test refunds/cancellation/idempotency and server entitlements before activating paid access. |
| Price management | Coordinate editable catalogue prices/terms, public pricing pages and provider price mappings. Current admin catalogue is a live review screen, not a price editor. |
| Worldwide location | #53: country choices are integrated in the proposed core branch; region/city identifiers, indexed gazetteer, manual-settlement fallback, preservation/backfill and end-to-end validation remain. |
| Authentication/devices | Real email confirmation, Google OAuth, sign-in/onboarding, installed PWA/Android and mobile acceptance remain. Isolated tests do not establish provider/device acceptance. |
| Phone verification | Review/reconcile #36 and test provider delivery, limits and recovery before rollout. |
| Family assistance | #58 is a permission design; consent, delegated permissions and audited operations are not implemented as a released feature. |
| Security | Review existing discovery/privileged-function advisors and staged lifecycle/privacy/interest/blocking changes against a production-schema staging copy. |

## Validation and limits
25 new tests pass and execute actual route handlers/components and the actual SQL migration in disposable PostgreSQL/PGlite. Coverage includes unauthorized and cross-origin access, forged fields, required reasons, stale writes, atomic audit rollback, unchanged evidence, self-publication denial, session revocation, read ownership, absent payment tables, retry and duplicate submission. Existing admin/deletion suite: 121 pass; safety suite: 34 pass. TypeScript passes and lint passes with 13 pre-existing warnings. Production build generates 109 static pages, with the existing OpenTelemetry warning. Component quality review checked hook cleanup, request cancellation, bounded data fetching, accessible labels/statuses, independent billing/trial state and no client-based permission decisions.

No live member review, story publication, suspension/deletion, payment, production schema change, merge or promotion was executed. Complete signed-in staging/browser/device verification remains a release task. The admin operational gaps above have implementation coverage; calling the whole platform production-complete would be inaccurate.
