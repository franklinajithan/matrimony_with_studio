# Admin audit explorer and pagination — 2 November 2026

## Confirmed bugs and changes
1. The audit endpoint sorted by timestamp and ID but paged using timestamp alone. A disposable PostgreSQL reproduction seeded 125 events with the same timestamp; the old handler returned only 50 across all available pages. The endpoint now uses the exact timestamp plus event UUID as its cursor. The regression reaches all 125 without duplicates and preserves database microseconds rather than truncating them through JavaScript Date.
2. The existing filterable audit explorer was never imported by the admin security page, which only displayed 100 recent records. The guarded page now renders the explorer with action, target/member, actor and UTC date filters, older-page navigation, refresh and CSV export.
3. The inclusive end-day filter stopped at 23:59:59.999, omitting later microseconds supported by PostgreSQL. It now uses an exclusive next-day UTC boundary. A real event at 23:59:59.999999 is included by the updated handler and excluded by the old predicate.

Explorer requests now abort and ignore obsolete responses on filter/clear/page changes. Failures offer retry for the same page, clear stale records and never display a misleading no-activity state. Repeated older-page clicks do not increment the page counter twice. Export uses applied filters and retains the 1,000-record bound and formula/quote escaping.

API date inputs reject invalid calendar dates and reversed ranges. Composite cursors validate both timestamp and UUID before reaching PostgREST filters. Database/client failures produce private/no-store structured errors. Actor authorization and the protected audit log's read policies remain the access boundary; audit metadata/private member details are not returned.

## Validation
15 new tests execute the actual API/page/component modules. A disposable PostgreSQL/PGlite fixture reproduces timestamp ties and end-day precision; an actual Supabase JavaScript client boundary test confirms target and cursor OR groups are both retained in the generated request. Additional tests cover filters/cursor validation, denied reads, bounded projections, CSV escaping, retries, obsolete responses and page navigation.

The existing admin/deletion (121), admin-completion (25), pricing (22) and verification (23) suites pass, for 206 passing tests including the new audit suite. TypeScript passes. Edited files pass lint. Full lint and production-build results are recorded in the pull request. CI now runs the audit suite.

## Compatibility and release
Continues #77 at commit 7f2b89efa3b463c97026d34bbe316c02a76b5062, stacked on the existing #72–#76 feature chain. No schema migration, dependency, production data mutation, merge or release is introduced. Old timestamp-only cursors return an actionable 400; refreshing the explorer obtains a new composite cursor. Filtering and CSV query parameters retain their existing names.

Earlier work could not install Chromium because the downloaded archive was truncated. Actual signed-in browser/mobile acceptance remains outstanding. Before release, stage the dependency chain, check admin/non-admin access, page through repeated timestamps, change filters while requests are pending, test keyboard/mobile use and export an approved disposable audit sample.
