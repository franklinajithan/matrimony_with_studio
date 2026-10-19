# Horoscope verification evidence

## Executed locally

- `npm run test:admin`: 96/96 passed (includes new page/API unauthorized access checks).
- `npm run test:horoscope`: 33 tests passed: 15 PostgreSQL test nodes (14 policy scenarios plus suite), 14 field/schema/file tests and four prior gender regressions.
- `tsc --noEmit`: passed separately; Next build is configured by the existing project to skip TypeScript/lint, so build alone is not treated as a type check.
- `npm run build`: passed; existing Genkit/OpenTelemetry dynamic-dependency warning remains in the unrelated biodata-assist dependency path.
- `git diff --check`: passed.

## Database test method

The actual migration is executed in a disposable PGlite PostgreSQL instance. A minimal auth/storage/profile/connection fixture models `auth.uid()`, authenticated/anon/service roles, storage tables and role switching. Each expected SQL failure is isolated in a savepoint; all fixtures are rolled back and discarded. Tests cover unknown birth time, owner-only raw reads/writes, sanitized peer views, reciprocal visibility/consent, approved connections, blocking in both data/report access, private storage, extraction isolation, expiry, stale revisions, consent withdrawal, suspension, anonymous denial and cascading derived-data deletion.

This proves the committed SQL executes and exercises PostgreSQL RLS. It does **not** prove the production migration is installed, real Supabase JWT/Storage HTTP behaviour, malware scanning or browser behaviour.

## Not executed / not claimed

- Production migration: blocked twice by `Invalid or expired requestState`; post-failure table check returned null.
- Real authenticated member create/save/share/view comparison through the deployed app: blocked by absent migration.
- Live Gemini extraction/AI narrative: dedicated credentials/model and vendor privacy approval not configured/verified. No member file was sent to an AI vendor.
- OCR benchmark: no human-labelled Tamil/English chart corpus supplied; field accuracy is unmeasured.
- Traditional matching reference cases: no deterministic scoring engine enabled or validated.
- Actual mobile Safari, Android and screen-reader tests: not completed. UI uses one-column layouts at narrow widths, 16px controls and responsive grids, but these are implementation choices, not device-test evidence.
- Physical scheduled cleanup: endpoint implemented; production secrets/schedule and storage deletion propagation require staging verification.
