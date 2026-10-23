# Horoscope release and operations

## Current release decision

The initial migration failures were resolved on 19 October 2026: `horoscope_private_studio` applied successfully. Read-only live checks confirmed all eight horoscope tables have RLS, zero horoscope functions are executable by anonymous users, anonymous raw-profile SELECT and authenticated raw-profile UPDATE are denied, and `horoscope-private` is private. All three feature flags remain OFF.

The application may be staged through the established PR → main → Vercel workflow with those flags OFF. This is not an enabled feature launch. Editing/upload/AI activation remains gated on real-profile QA and the operational items below. A rollback-only live fixture test request still returned `Invalid or expired requestState`; a subsequent query confirmed zero QA fixture users. Authenticated preview Google sign-in redirected to the canonical production dashboard, so preview auth could not verify the new screens.

The committed migration is `supabase/migrations/20261018214004_horoscope_private_studio.sql`, created through `supabase migration new`. It is additive and defaults all feature flags OFF. It does not import legacy public horoscope content.

## Configuration (server-only secrets)

- Existing `NEXT_PUBLIC_SUPABASE_URL` / public anon key for user-scoped operations. Public keys are not service-role keys.
- `HOROSCOPE_GEMINI_API_KEY`: dedicated paid/provider-approved credential. Never use `NEXT_PUBLIC_`.
- `HOROSCOPE_GEMINI_MODEL`: reviewed model ID supporting image/PDF inputs and response JSON schema. No hardcoded default or silent reuse of the legacy key.
- `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`: required only for the physical cleanup endpoint. Configure through the established secret manager, never paste into chat or commit them.
- Schedule authenticated GET `/api/internal/horoscope-cleanup` daily (or more frequently as required). It deletes up to 100 expired/orphan objects through Storage API, then expired metadata/reports and audit records older than 90 days. Account deletion cascades raw database records; the worker removes orphan physical objects. Configure alerting/retries and monitor backlog before allowing uploads.
- No new vendor subscription, paid API call with member data, external key, or scheduled production job has been created by this change.

## Release order

1. Completed: migration applied; tables, privileges, private bucket and flags OFF verified. Never bypass the authorised migration workflow.
2. Re-run migration/security tests against the actual staging Supabase stack and two disposable authenticated profiles. Local PGlite tests validate PostgreSQL permissions but do not exercise Supabase Storage HTTP/JWT behaviour.
3. Review inherited schema exposure: live advisor reports a SECURITY DEFINER discovery view, public pg_trgm extension and leaked-password protection disabled. The profile-share resolver is intentionally callable by anonymous share-token users and needs its existing threat model reviewed. These predate this branch. See https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
4. Deploy the tested branch via existing GitHub PR → approved main merge → Vercel workflow. Test preview before merging. Keep flags OFF. The migration is now present. Activation remains a separate gated step.
5. Verify manual entry/edit/export/delete on QA profiles, private peer denial, connection approval, blocks, restrictions, suspension, stale report rejection, signed source URLs and physical cleanup.
6. Complete device/accessibility checks at 320/375/390/768/1440 widths on actual Safari/Chrome/Android, including keyboard/screen reader, sticky navigation, upload/camera and PDF/source review. Responsive classes alone are not proof of device compatibility.
7. Configure and approve provider privacy/retention terms and UK GDPR notice, add malware-scanner integration where available, run the Tamil/English/mixed/handwritten/tilted/multipage human-labelled benchmark. Record field-level precision/recall and correction rates. No accuracy claim exists yet.
8. Enable manual horoscope flag first for a restricted QA cohort; upload and AI flags stay OFF until their gates pass. Per-member restrictions are available; an allow-list cohort rollout flag still needs adding for a large launch.
9. Traditional scores stay unavailable until an independently reviewed deterministic engine, rule/version references and regression cases are installed. Do not substitute LLM-generated values.

## Cost and privacy controls

Upload limit: 3 MB / five PDF pages / single-image 24MP decode limit; HEIC requires conversion. Images are auto-oriented, resized and stripped of metadata only for the provider copy; original preserved privately. SHA-256 deduplication is scoped to the owner. All AI operations share the daily per-member budget (default five); upload/compare limits default thirty per day. These are request limits, not a currency cap. Add provider account budget alerts and usage/cost reporting before rollout.

No API rates/currency estimates are asserted because no model/vendor plan is selected. Source blobs and prompts are not logged by the new provider adapter. Read the chosen vendor's logging/retention terms independently.

## Rollback

Pause all horoscope flags in admin (or authorised settings RPC), then revert the application commit through the normal PR workflow. Keep private tables/bucket and RLS intact; do not drop member records as a rollback. Legacy AI actions were retired for safety and should not be reenabled. A source link already issued can remain valid for up to 60 seconds. Downloaded copies cannot be recalled.

## Explicit unfinished acceptance items

The reusable HTTP/JWT acceptance runner is `scripts/horoscope-acceptance.mjs`. Run in a trusted environment with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. It only creates random disposable accounts and removes its own IDs in `finally`; it never accepts existing member IDs or changes feature settings. It requires manual horoscope editing and registration to be enabled in an explicitly authorized QA window. It checks save/edit revision conflicts, raw/private peer denial, ordinary-member admin denial, approved-connection sharing, selected-field redaction, reciprocal comparison, cached-report revocation on block, consent withdrawal, member restrictions and owner deletion while restricted. It does not invoke AI, upload member documents or generate astrology scores.

On 22 October a production attempt required a broader feature-setting change than the user's general horoscope instruction clearly authorized. Automatic review blocked continuation. Registration and all horoscope flags were restored to false, the temporary runner replaced with a JWT-protected HTTP 410 handler, and read-back confirmed zero disposable horoscope users. No completed live test result is claimed. A separately authorized test window or staging environment is required.

- Migration installation and read-only privilege verification completed. Real authenticated create/edit/view/share checks remain pending; the rollback-only live fixture write request expired.
- Provider credentials/model/privacy review and live extraction/AI outage/cancellation benchmarks.
- A durable queued OCR worker with realtime/polling/cancellation; current implementation is a bounded authenticated synchronous request with explicit UI progress and retry. It does not pretend to keep processing after a failed request.
- Verified Tamil porutham / Ashta Koota engines and reference cases, North Indian layout and full ephemeris calculations.
- Malware scanning integration, HEIC conversion, calendar/local-numeral normalisation benchmark.
- Field-level extraction accuracy/correction metrics, vendor cost integration, cohort allow-list, full Tamil UI translation, actual device and assistive-technology testing.
- Legacy public horoscope file remediation requires a separate owner-reviewed migration. Existing public media has not been made private by this work.

## Manual backend verification — 23 October 2026

The owner-authorized live disposable run passed all twelve manual-entry/privacy checks in TEST_RESULTS.md. Set `HOROSCOPE_QA_COHORT=allowlist` when testing the installed restricted cohort deployment. The runner only enrolls IDs it creates. Migration `20261023073857_horoscope_revision_conflict.sql` is already applied: stale revision conflicts now return `PT409` without PostgREST serialization retries. The API recognizes old/new error codes for rolling deployment. Keep the SQL patch on restored environments as well.

Registration and editing were restored to paused after QA. Upload/AI flags stayed off throughout. Actual browser/device checks and provider/scoring gates remain outstanding; backend success does not authorize a general launch.
