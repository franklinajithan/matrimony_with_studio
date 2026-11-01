# Consolidated Phase 1 and interest authorization — 1 November 2026

## Purpose and baseline
This branch is one integration candidate against main e0e78389ffc4b01937d0dfcdaa9226c064988946. It preserves the complementary existing work rather than proposing another competing implementation. No existing PR was closed, retargeted or merged.

| Source PR | Reused implementation |
| --- | --- |
| #64 (0756f07) | Canonical discovery gender, neutral defaults, confirmation-only signup, Shortlist/Interested feedback and synchronous duplicate guards; incorporates #60's feedback design |
| #65 (2fae3c9) | Actual-auth-module regression suite and settings session hydration |
| #68 (8a03f44) | Current-main recoverable deletion/deactivation integration, admin confirmation and lifecycle regression suites |
| #71 (70944dd) | Shared 249-country catalogue, legacy country compatibility, preference selection and editor/onboarding/discovery consistency |
| #67 (79fd621) | Staged public-share photo/activity protection and disposable SQL tests |
| #70 (9995809) | Resend persistence readback and stale-status predicate |

The gender URL preservation missing from #64 was added to retain #62's complementary behavior. #63/#66 are alternative implementations already covered by the chosen handlers. #69 overlaps the country work selected from #71. The older divergent #40 erasure/billing implementation is not combined with the lifecycle architecture.

## Additional fixes
- Discovery copies/saves gender filters, including explicit No preference.
- Match-details editor waits for auth hydration, clears on logout, rejects stale account loads and reports failures. Settings rejects stale profile responses and clears its form on logout.
- Profile pages use the same directional interest sender, canonical decline/withdraw states and atomic acceptance RPC as the interests flow. They read both directional and legacy sorted request IDs, handle reverse requests, prefer incoming consent, and stop treating removed accepted connections as current matches. Existing rows/IDs remain intact.
- Withdrawal and decline, like resends, request affected IDs and reject zero-row/stale writes instead of reporting success. The shared request type includes current and legacy statuses.
- Pair subscriptions discard outdated loads and unsubscribe cleanly. Messages already repairs/creates canonical chats from connections, so profile acceptance no longer reports failure merely because a separate chat-creation write failed after acceptance.

## Interest security proposal
Read-only live schema inspection confirmed broad legacy participant policies alongside narrow rules, with the account-live-session policy correctly marked RESTRICTIVE. Live acceptance uses SECURITY INVOKER and an ON CONFLICT DO UPDATE connection write; no member rows were inspected.

New migration 20261101124051_interest_authorization_boundaries.sql:
- Restrictive sender/pending insert and participant update/delete gates remain effective alongside permissive legacy rules.
- An invoker trigger enforces immutable participant IDs, request identity and creation time; only the receiver accepts/declines pending requests, only the sender withdraws/resends, and active accepted connections cannot be reset.
- Connection creation requires an accepted request for the exact canonical pair and the actual receiver's consent. Client connection updates are denied.
- Repeat acceptance uses ON CONFLICT DO NOTHING, preserving connection provenance and avoiding new client UPDATE privileges.
- Existing restrictive live-session rules and activity/block/quota triggers are retained. Trusted database/service maintenance paths remain available. No JWT user-metadata or client-settable bypass is used.
- No member rows are rewritten or deleted by the migration. It has not been applied remotely.

The disposable SQL fixture first reproduces the pre-fix permissive-policy defect, then applies the actual migration. It tests authorization, immutability, consent, idempotency, session denial, rollback after connection failure, resends after removal, stale status predicates, grants, repeat application and service cleanup. This is actual PostgreSQL via PGlite, not a production write experiment. The stale-status case is sequential; multi-session contention and full production-schema staging acceptance are still required.

## Validation
| Check | Result |
| --- | --- |
| Interest SQL security | 13 passed |
| Actual interest service / PostgREST HTTP boundary | 15 passed |
| Core discovery/country/signup/action behavior | 14 passed |
| Signup/auth and match-details hydration | 13 passed |
| Account lifecycle, including disposable SQL | 24 passed |
| Admin security and deletion | 116 passed (some deletion coverage also appears in lifecycle suite) |
| Horoscope/security/gender | 33 + 18 passed |
| Theme contrast | 12 passed |
| Public-share privacy and WhatsApp previews | 11 + 4 passed |
| TypeScript | Passed |
| Lint | Passed, 13 existing warnings |
| Production build | First build passed; final standard-output build hit ENOTEMPTY in .next/export after generating 109 pages. Clean isolated-output rerun passed with all 109 pages generated; existing OpenTelemetry/webpack warnings remain. |
| Browser | Chromium installation failed: downloaded archive was truncated/invalid. No browser or physical-device acceptance is claimed. |

React review covered effect cleanup, stale async results, hook dependencies, loading/error states and preservation of the existing purple/gold UI. No redesign or new client-side premium authorization was introduced.

## Release order and remaining gates
1. Review this combined tree rather than merging every overlapping PR. All source branches remain untouched. Source PR closure/supersession decisions belong to the owner.
2. On a staging database with the current lifecycle dependencies, apply and verify the public-share proposal 20261101122640, then the interest authorization proposal 20261101124051. Check restrictive session policies and existing triggers before and after. Do not blindly rerun the older lifecycle migration: prior metadata/release records show it is already deployed in production.
3. With disposable staging identities, verify registration pause, confirmation email, Google callback, cold session hydration, gender URLs, both interest directions, consent/connection/chat creation, failure feedback, deactivation/reactivation and recoverable deletion including admin controls.
4. Verify real Android APK and installed iPhone PWA OAuth/resume/offline behavior. The failed Chromium download does not establish mobile compatibility.
5. Full city/region IDs, indexed GeoNames lookup and additive legacy backfill remain under #53. Country consistency does not complete that issue.
6. Billing/entitlement work in #40/#45, report/block integration in #37 and SMS acceptance in #36 remain separate. Real Stripe test-mode checkout/webhooks/cancellation and server authorization must pass before any live billing decision.

Production merges, migrations, deployment and live billing require the owner's explicit approval. None were performed in this work. Earlier audit documents retained in this branch are historical snapshots; this document describes the integrated tree.
