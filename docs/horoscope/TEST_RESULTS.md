# Horoscope verification evidence

## UI automation continuation — 23 October 2026

Added a temporary local component harness (`scripts/horoscope-browser.mjs`) and `.github/workflows/horoscope-ui.yml`. It mocks every horoscope API request, creates no Auth users and changes no production settings. Browser configurations: desktop Chromium, Pixel 7 emulation, iPhone WebKit emulation and a 320px viewport. Assertions cover horizontal overflow, required review confirmation, unknown birth time, conflict message/draft preservation, private save, preview, paused editing, continued export/delete, and screenshots. The harness removes its generated route and build directory and restores TypeScript configuration after running.

Local run: blocked before UI interaction in all four configurations. Chromium downloads were truncated; WebKit downloaded from Microsoft's fallback CDN but could not launch due missing host libraries. Official dependency installation failed due host setgroups/cache permissions. No browser/device pass or visual screenshot is claimed. Script syntax and targeted lint passed. The dedicated CI workflow installs Chromium/WebKit plus dependencies on Ubuntu and uploads the JSON report and any screenshots. A passing mocked harness is still not physical iPhone Safari/installed PWA acceptance.

The initial CI runs passed desktop, Android emulation and 320px Chromium; iPhone WebKit failed because the installed service worker bypassed the mocked PUT route, which reached the unauthenticated local API. The harness now blocks service workers so all requests stay inside the mock boundary. This is a harness correction, not physical PWA validation. Follow-up CI run [39922161197](https://github.com/franklinajithan/matrimony_with_studio/actions/runs/39922161197) passed all four configurations at implementation commit `bc7d7e28bd8a1bf8685e5ec99e8b4bed539ce889`; screenshots and results JSON are in its `horoscope-ui` artifact (retained seven days). The Verify workflow also passed; Vercel reported a successful preview deployment. Full lint passed with zero errors and fourteen existing warnings; production build passed with the existing Genkit/OpenTelemetry warning. These are preview/mocked-UI results, not a general launch or physical-device acceptance. Integration with main passed 51 horoscope test nodes after updating the revision-conflict fixture to authorize the QA allow-list RPC. TypeScript passed after wrapping the dashboard admin RPC thenable in Promise.resolve before catch.

## Live continuation — 23 October 2026

Final validation: 48 local test nodes passed (30 API/database and 18 schema/file/gender). TypeScript, targeted lint and production build passed. Existing unrelated Genkit/OpenTelemetry build warning remains.

Owner authorized a temporary manual-editing/registration test window. The installed database includes a cohort allow-list, so only newly created disposable IDs were enrolled. Twelve real Supabase Auth/JWT/RPC checks passed: manual save, raw peer isolation, private-view denial, non-admin settings denial, stale-edit rejection, unconnected-view denial, selected-field redaction, mutual comparison, report revocation after blocking, consent withdrawal, member restriction, and owner deletion while restricted. All disposable identities were removed; registration and all horoscope flags are false again, and the temporary runner is disabled (JWT-protected HTTP 410 handler). No real member data was edited or removed.

The stale-edit test exposed a real production defect: custom SQLSTATE `40001` caused PostgREST's documented infinite transaction-retry bug. Migration `20261023073857_horoscope_revision_conflict.sql` was applied successfully and changes only that business-conflict SQLSTATE to `PT409`, preserving the installed function and cohort checks. The Next.js save route recognizes both codes during rollout. PGlite regression checks assert `PT409`; the live test asserts it returns within ten seconds. The initial timed-out attempts are not claimed as passes. Inspected corresponding backend PIDs after the fix; no active horoscope-save loop remained.

Reference: https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b

The runner accepts `HOROSCOPE_QA_COHORT=allowlist` to enroll only its own disposable IDs. This is backend verification, not desktop/mobile UI, OCR, traditional-scoring or provider-delivery acceptance.


## Follow-up — 22 October 2026

- Fixed JSON body validation: `null`, arrays and scalar JSON now return the existing invalid-request error before route code accesses object properties, rather than producing a misleading service-unavailable error.
- `npm run test:horoscope`: 46 test nodes passed (28 database/API nodes and 18 schema/file/gender nodes), including the new object-body regression.
- TypeScript and full lint passed (14 existing warnings, zero errors). Production build passed; existing unrelated Genkit/OpenTelemetry warning remains.
- Added `scripts/horoscope-acceptance.mjs` for disposable Supabase Auth/JWT acceptance; no existing member IDs are accepted and cleanup is limited to identities created by that process.
- Live horoscope QA continuation was blocked by automatic safety review because temporary global editing/registration changes were not clearly authorized by the general request. No successful live result is claimed. All flags and registration were restored to false; zero disposable horoscope users remain and the temporary runner is disabled.

## Executed locally

- `npm run test:admin`: 96/96 passed (includes new page/API unauthorized access checks).
- `npm run test:horoscope`: 45 tests passed: 12 comparison API cases, 15 PostgreSQL test nodes (14 policy scenarios plus suite), 14 field/schema/file tests and four prior gender regressions.
- `tsc --noEmit`: passed separately; Next build is configured by the existing project to skip TypeScript/lint, so build alone is not treated as a type check.
- `npm run build`: passed; existing Genkit/OpenTelemetry dynamic-dependency warning remains in the unrelated biodata-assist dependency path.
- `git diff --check`: passed.

## Database test method

The actual migration is executed in a disposable PGlite PostgreSQL instance. A minimal auth/storage/profile/connection fixture models `auth.uid()`, authenticated/anon/service roles, storage tables and role switching. Each expected SQL failure is isolated in a savepoint; all fixtures are rolled back and discarded. Tests cover unknown birth time, owner-only raw reads/writes, sanitized peer views, reciprocal visibility/consent, approved connections, blocking in both data/report access, private storage, extraction isolation, expiry, stale revisions, consent withdrawal, suspension, anonymous denial and cascading derived-data deletion.

This proves the committed SQL executes and exercises PostgreSQL RLS. It does **not** prove the production migration is installed, real Supabase JWT/Storage HTTP behaviour, malware scanning or browser behaviour.

## Not executed / not claimed

- Historical migration failures were resolved on 19 October; see the installed-schema verification below.
- Earlier expired authenticated fixture attempts were superseded by the twelve successful disposable Auth/JWT/RPC checks on 23 October (above). Feature flags were restored to OFF.
- Live Gemini extraction/AI narrative: dedicated credentials/model and vendor privacy approval not configured/verified. No member file was sent to an AI vendor.
- OCR benchmark: no human-labelled Tamil/English chart corpus supplied; field accuracy is unmeasured.
- Traditional matching reference cases: no deterministic scoring engine enabled or validated.
- Actual mobile Safari, Android and screen-reader tests: not completed. UI uses one-column layouts at narrow widths, 16px controls and responsive grids, but these are implementation choices, not device-test evidence.
- Physical scheduled cleanup: endpoint implemented; production secrets/schedule and storage deletion propagation require staging verification.

## Continuation — 19 October 2026

Retried the committed migration after the expired approval message. Read access worked, both horoscope tables were absent, and the migration operation again returned `Invalid or expired requestState`. No database change or production release is claimed.

Added real comparison-route tests using isolated database/provider boundaries. Malformed/null requests reject before data access. AI eligibility is checked before charging the daily budget. Tests verify private field exclusion from AI input, permission withdrawal after generation, and rate-limit enforcement before provider calls/report storage. These are local API tests, not real-profile production tests.

## Installed-schema verification — 19 October 2026

- `apply_migration(horoscope_private_studio)` returned success.
- All eight horoscope tables report RLS enabled.
- Anonymous horoscope RPC EXECUTE count is zero.
- Anonymous raw-profile SELECT and authenticated raw-profile UPDATE privileges are false.
- `horoscope-private` bucket has `public=false`; source maximum 5 MB at storage, 3 MB at validated API.
- All feature flags remain false; no traditional rule sets enabled.
- Rollback-only live fixture request expired before a confirmed result. Zero `horoscope-qa-*` users were found afterwards. The script is committed as `scripts/horoscope-live-security.sql` for an authorised test connection; it has not been claimed as passed.
- Advisor informational notices on audit/restriction tables having no policies are intentional deny-all: raw table grants are revoked. Authenticated SECURITY DEFINER notices correspond to explicitly authorised RPCs with ownership/admin checks. Existing discovery-view and auth advisories remain documented in RELEASE.md.
- Secure Google login from preview visibly reached the production dashboard. The preview hostname did not retain authentication; no preview screen/save test was claimed.
