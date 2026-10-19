# Horoscope verification evidence

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
- Real authenticated member create/save/share/view comparison: not completed; feature flags remain off and the live fixture test write request expired.
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
