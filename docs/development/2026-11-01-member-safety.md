# Member safety completion — 1 November 2026

## Baseline and scope
This branch is stacked on PR #72, commit 9f7fa5620346e80f0eda1986e64b1415e1f059f7. Both GitHub Actions workflows for #72 passed and its exact Vercel preview is READY. Authenticated connector retrieval of its homepage returned HTTP 200. Interactive browser access reached Vercel's sign-in wall, so this is not a claim of signed-in or physical-device acceptance.

Read-only live schema checks found that the existing blocks table is present, the reports table has not been installed, and there are no bidirectional block guards on interest/connection/chat/message writes. The current discovery view also lacks a block predicate. No production member records were queried. PR #37 implements a parallel member_blocks/member_reports design; this branch retains the current blocks/reports contract instead and leaves #37 untouched.

## Completed implementation
- Profile pages expose Report member and Block member with confirmation dialogs, verified-user lookup, synchronous duplicate-submit locks, persistence-first feedback and retryable errors.
- Settings exposes the caller's block list and unblock actions. Public CM references are displayed instead of database UUIDs or private profile names. Unblock verifies affected rows and never reports a zero-row write as success.
- Admin Reports has filters, bounded pagination, evidence, member-review links, status updates and loading/error/retry states. Desktop/mobile navigation both link to it.
- The page and both API methods use server-side admin checks before protected data access. PATCH checks origin, strict payload, valid status/ID and expected prior status; stale writes return 409. Private responses are not cached and database error detail is not exposed.
- Block existence uses a caller-scoped boolean RPC, avoiding mutual-block cardinality errors and hidden reciprocal rows. Repeated block insertion ignores duplicates without requiring UPDATE permission.

## Staged migration
20261101223726_member_safety_enforcement.sql has NOT been applied remotely.

- Installs the reports contract when absent, validates pending submissions and restricts reading/updating evidence to admins with live sessions. Reporters and reported members cannot retrieve reporter identity through reports queries.
- Protects immutable report evidence, stamps the actual reviewer, audits status transitions and rate-limits member submissions to five per fifteen minutes with a transaction advisory lock and server timestamps.
- Hides reciprocal block ownership; block identities cannot be retargeted. Only the caller's own block list/public references can be read through the new scoped RPC.
- Enforces bidirectional blocks on interest, connection, chat and message writes while allowing participant unread acknowledgements and safe decline/withdraw cleanup. Trusted maintenance/auth cleanup remains available. Existing activity, consent and session guards are retained.
- Removes a connection when a block is inserted; preserves historical chats/messages. Unblocking does not restore the connection.
- Wraps the existing discovery SELECT without widening its projection or replacing its photo/lifecycle/session predicates. Both block directions are excluded. Repeat migration application does not stack duplicate discovery wrappers.
- New internal trigger functions revoke direct public/member execution. Public RPCs check verified caller/session scope; no client-supplied role or user_metadata claim grants privileges.

**Data-changing release gate:** the migration also removes canonical connections for pre-existing blocked pairs. No accounts, messages or report evidence are deleted. This requires explicit review and approval before any production application. It must follow the lifecycle, privacy and interest-consent dependencies in #72. Do not enable the new UI against an unmigrated backend.

## Validation
- 29 new safety checks pass: 16 disposable PostgreSQL/PGlite tests executing the actual migrations, five API authorization/validation/error tests, four installed PostgREST transport tests, and four actual-component behavior tests.
- Admin/security/deletion: 119 passed, including automatic discovery of the new protected page and API.
- Existing account lifecycle: 24 passed; interest SQL: 13 passed; core behavior: 14 passed; signup/hydration: 13 passed; interest service: 15 passed.
- TypeScript passed; lint passed with 13 pre-existing warnings. Custom Next build outputs are excluded from lint and git.
- Production build passed, generating 109 static pages. Existing OpenTelemetry warnings remain.
- SQL acceptance covers reporter privacy, forged identities/status/reviewer/timestamps, admin evidence immutability/audit, revoked sessions, reciprocal blocks, connection removal/history preservation, all four interaction tables, caller-scoped block lists, discovery projection, rate limiting, anonymous/trigger grants and repeated migration application.
- This is isolated service/component/PostgreSQL acceptance, not a full production-schema staging deployment or multi-session load test. No real report was submitted, no real member was blocked/unblocked, and no production schema/data mutation occurred.

## Remaining acceptance
Review the stacked changes and apply the staged migrations only to an approved staging database first. Use disposable identities to verify the complete profile report/block flow, admin review/audit, discovery exclusion, history visibility and unblock/new-consent cycle. Complete actual Google/email, signed-in browser and installed-device acceptance before release. Production deployment, migrations, merges and live billing remain unapproved and were not performed.

Baseline security advisors were rechecked without changes. Existing discovery SECURITY DEFINER and privileged-function warnings need intentional per-function review, not blanket permission changes: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view and https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable . Other baseline password/extension advisories remain separate work.
