# Horoscope audit — 18 October 2026

Inspected repository profile edit/member view, biodata, matching/connection helpers, server authentication, admin guards/registration controls, legacy Genkit flows and production Supabase metadata before implementation.

## Findings

- Legacy horoscope AI accepted arbitrary birth facts without authenticated profile authorization, consent or persistent rate limits. It generated chart positions and a 0–100 compatibility score without a documented deterministic engine. Replaced entry points; retired old server actions.
- Profile editor uploaded horoscope files into the public `media` bucket. New uploads use a separate private bucket. Existing public URLs/files have **not** been silently imported, deleted or claimed private. A separately reviewed legacy migration/remediation is required.
- No horoscope tables, field-level sharing, consent, extraction provenance, independent scoring references, secure job/report model or dedicated admin flags existed.
- Live schema had profiles with suspension fields and approved `connections`; the application's `blocks.ts` referenced a missing `blocks` table. Migration adds that table with participant/owner policies, and horoscope access checks both directions.
- Existing admin authorization uses server auth + `is_admin()` RPC; new controls use this guard and database checks, never user metadata.
- Existing profile/biodata schemas include legacy astrological text. New private records do not overwrite them. Gender controls and canonical gender helper are unchanged.

## Implementation boundaries / release gates

All horoscope flags default OFF. Manual records and field comparison are implemented. A shared-field comparison is **not** a traditional astrology score.

No Tamil porutham or Ashta Koota rules are approved: no score or compatibility band is generated. Independent documented cases and qualified review are required before adding an engine. North Indian chart rendering, calendar conversion and automatic ephemeris calculations are not installed.

OCR provider adapter is implemented with strict server validation, provenance and member confirmation. Dedicated model/key, vendor privacy/retention approval, a multilingual ground-truth corpus, field-level accuracy measurement, malware scanning validation, and device testing are release gates. Confidence labels are uncalibrated model assessments, never claimed accuracy.

Source access expiry is enforced at the storage layer. Physical source deletion after retention/account deletion requires the cleanup worker and secret configuration documented in RELEASE.md. Never delete storage metadata through SQL.

No provider request using a real member's source data is part of developer testing. No production user's horoscope/gender/profile is edited for tests.
