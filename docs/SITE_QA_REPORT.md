# CupidMatch site QA — 18 October 2026

## Result and scope

Broad regression pass on PR #40, extending published baseline `2eaced07669e2482f839803067f9ad4b5a703532`. Nine defect groups fixed in code; two confirmed gaps remain open below. This is **not full signed-in or live-provider acceptance**, and the project is not release-ready. No live member records were changed, no charge/refund/email was sent, and no production migration or promotion was performed.

## Findings

| ID | Severity | Defect / evidence | Resolution and verification |
|---|---|---|---|
| QA-01 | P2 | Footer FAQ led to `/#faq`, but the homepage had no FAQ. Browser and initial HTTP anchor audit reproduced it. | Added homepage FAQ, dedicated `/faq`, working footer link and sitemap entry. HTTP checks pass. |
| QA-02 | P2 | `/share/biodata/invalid` returned 500 because malformed tokens reached a missing database resolver. | Reject malformed tokens before RPC. Five invalid-token cases and one plausible-token resolver test pass; production HTTP invalid-link check passes. Valid/revoked/expired real shares still need deployed RPC and staging acceptance. |
| QA-03 | P1 | Active/trial subscriptions without a period end retained paid access indefinitely in the application entitlement helper. | Missing, invalid or expired period ends fail closed. Domain tests cover free fallback and valid future expiry. No real subscriptions were edited. |
| QA-04 | P2 | Usage GET API always returned `used: 0`, independent of stored member usage. | Read owner/current UTC-month usage; database errors return retryable 503. Two isolated route tests verify scoping and failure. Actual usage consumption remains QA-10. |
| QA-05 | P2 | Boolean entitlement registry omitted `profileBrowsing` and `basicMatching`; the previously unrun key-consistency test failed. | Registry now covers all defined keys. Subscription domain suite passes. |
| QA-06 | P2 | Unconfigured server-generated account links and metadata fell back to an obsolete Vercel domain. | Current CupidMatch domain is the fallback; explicit configured URLs still win. Two regression tests pass. Actual provider delivery is untested. |
| QA-07 | P2 | Landing page displayed hard-coded invented quotes under “Real People / Real Stories”. | Removed fabricated carousel and linked to moderated, member-submitted success stories. Preview/public content acceptance required on the updated deployment. |
| QA-08 | P2 | Landing illustrations presented invented 92% matching, a scroll-driven match percentage and unsupported 15+ country count as factual. | Labelled example profiles, removed invented percentages and count. Existing preference-based recommendations remain. |
| QA-09 | P2 | Pricing advertised unimplemented boosts/priority/badges and paid-only filters; display market changed currency while checkout always used GBP. | Removed unsupported paid-benefit claims and hard interest-limit promises; explained indicative currencies and GBP test checkout. This does not implement multi-currency billing. |
| QA-10 | P1 OPEN | `sendInterest` writes interests without atomic quota consumption. Live `pg_proc` inspection found no `consume_subscription_usage` RPC, although the consume API references it. Historical SQL accepts a caller-supplied limit. | **Do not enable metered billing.** Add an authoritative database-enforced operation using server-derived entitlements, idempotency and concurrent-limit tests; deploy only the missing compatible migration. No exploit or live mutation attempted. |
| QA-11 | P2 OPEN | Choosing Tamil translated navigation, but About/Contact body content stayed English. Reproduced through the browser. | Full public-page localization and language-specific content/validation acceptance remain. Locale restored to English after the check. |

Additional hardening: protected story-submission middleware, private/no-store identity responses and consistent shared-profile branding. Tests now run source auth/onboarding and subscription suites that the previous CI omitted. Fixtures include the current gender requirement; publishing without gender remains rejected.

## Validation

| Check | Result / boundary |
|---|---|
| Admin page/API tests | 112 passed; isolated authorization harness |
| PostgreSQL | 300 assertions passed in isolated PostgreSQL/PGlite: 105 admin + 57 website + 31 planning/account + 63 communication/provider/privacy + 44 release |
| Provider/file/API/directory | 59 tests passed; provider responses mocked, signed fixtures only |
| OAuth/session | 8 tests passed; isolated requests, not a new Google/Facebook acceptance run |
| Auth/onboarding/foundation | 22 tests passed across 6 files using Vitest |
| Subscription domain | 19 test files passed; these use top-level assertions, so this is not a claim of 19 individual assertions |
| New site regressions | 10 passed |
| Production HTTP smoke | 139/139 checks passed: 18 public pages, 21 protected destinations, 15 anonymous API checks, rendered internal links/anchors, invalid shared links, 404, sitemap and robots. Disposable production server with fixture Supabase settings; no real member data |
| TypeScript | `npm run typecheck` passed |
| Production build | `npm run build` passed. Existing build skips lint; no lint pass claimed. Existing OpenTelemetry dynamic-dependency/edge-runtime warnings remain |
| CI coverage | Added foundation/domain/site checks and post-build production HTTP smoke to Verify. Remote results must be checked for the published QA commit |

Initial HTTP audit had 14 failures: 12 repeated missing-FAQ anchors, malformed biodata share 500, and one **test harness error** using GET on a POST-only workspace API. The harness now checks anonymous POST and correctly receives 401. This was not a workspace application bug.

Browser inspection on the baseline preview covered homepage/footer, pricing display-market selection, About/Contact language persistence, support-to-login navigation, empty login/forgot-password validation, and expired password-reset recovery. No application console error was observed during these checks; extension metadata warnings were excluded. Desktop homepage had one H1, no horizontal overflow and no broken loaded images at the inspected viewport. These checks do not establish all-page accessibility or device coverage.

## Unverified and release blockers

- Dedicated member, second member and Super Admin/Support/Moderator browser journeys: profile/photo CRUD, publication, block/interest/connection rules, conversations/attachments, Family Circle, Future Map, staff moderation/support and persistence/failure paths.
- Real Stripe test checkout, portal, cancellation/resume, failed payment, webhook retries and refunds; real Resend delivery/bounce; dedicated-account export/deletion recovery. Service key, provider keys/prices/webhooks, approved sender/cron and isolated accounts/environment are missing. Adapters and mocked tests are not proof of provider success.
- Voice/video remain disabled pending TURN and two-device/permission/network acceptance. Government-ID remains optional/disabled. SMS is deferred. Payouts excluded as requested.
- Mobile layouts, cross-browser coverage, full keyboard/screen-reader/reduced-motion review and biodata PDF/image exports remain unverified.
- Nine missing migrations remain unapplied; exact order and coordinated release/rollback requirements are in `PROVIDER_SETUP_AND_RELEASE.md`. No new migration was added in this QA pass. Live advisor findings and legal/operator/retention/refund decisions remain release gates.
- Fixes in this report are PR changes, not production fixes, until the compatible release is deployed and rechecked. See PR #40 for the exact QA commit, current CI and preview evidence.
