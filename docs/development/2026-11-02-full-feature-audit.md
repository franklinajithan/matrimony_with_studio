# CupidMatch full feature audit — 2 November 2026

## Repository, PR and deployment evidence
Initial main: bacd82e996a0fd02d4afe6fc671a51e6877ee3a6 (#83 login eye/onboarding save). Rechecked after workspace reset: main 6a231c7b1eee5323f9c0f0cef0dd69fd38f61d40 (#84 optional marriage questions). Both integrated into staged #82 source, retaining current onboarding and all staged test commands. No AGENTS.md exists in repository.

All open PR metadata reviewed. Dependency chain #72 → #73 → #74 → #75 → #76 → #77 → #78 → #79 → #80 → #82 is draft and unmerged. #81 is closed/unmerged; its application fix shipped through #83. #82 onboarding application fixes partly shipped through #83, new CI/service coverage remains staged. #54/#61/#69/#71 overlap worldwide country work; #62–#68/#70 overlap consolidated Phase 1. #37 overlaps staged safety. #51/#68 overlap lifecycle. #58 is a family-security design, not actual helper delegation. Do not merge #40 wholesale: it includes deferred billing. #36 phone verification remains deferred.

Initial Vercel production dpl_BoxbzWxGiRCdpZw2XpVnCTXbrCDL was READY at bacd82e. Main Verify 41453949904 passed; E2E 41454159458 failed: 24 passed, random-preferences QA-R01 timeout waiting for discovery filters. These facts are point-in-time evidence, not a release acceptance for this branch. Latest production will be checked before any release.

## Fourteen-area audit
| Area | Existing source reused | Remaining work |
|---|---|---|
| Profile privacy/photo requests | dashboard/privacy, api/member-photo, supabase/storage; publication toggle, member/connection/hidden photo modes | Public media URLs bypass UI hiding. No private gallery request/approval/revocation. Three-level profile visibility missing |
| Advanced matrimonial search | components/discovery/PreferenceDiscovery, lib/matching/preferences, data/world-countries | First 500 fetched; client filtering/sorting/display pages. Structured worldwide region/city dataset absent. Extended filters previously lost in saved links |
| Family management | family-assisted-matrimony guidance; #58 design | Consent/invite/scope/revocation helper API and UI missing |
| Interests/communication | supabase/matches, connections, chats; staged receiver consent/safety triggers | Signed-in staging acceptance pending |
| Admin moderation/verification | admin/verifications, reports, security and staged browser harness | Reconcile migrations and validate actual member/admin staging sessions |
| Compatibility | lib/matching/preferences | Explainable one-way score exists; mutual scoring missing. Do not expose reverse private preferences |
| Saved searches/notifications | member_saved_searches and discovery save/open | One saved URL per user; advanced URL roundtrip fixed in this branch; notifications not implemented |
| Marriage biodata PDF | lib/biodata/templates, DocumentRenderer, export | Multiple templates exist. Raster export; Tamil font/image readiness and exported-output checks pending |
| Optional horoscope | lib/horoscope, private document bucket, comparison API | QA-only production gate; actual provider/member-consent acceptance before broad release |
| Marriage journey | No dedicated tracker/table/API found | Missing participant-controlled stages/privacy |
| Family introductions | Guidance only | Missing consent-controlled workflow and helper boundaries |
| Multilingual UI | i18n/messages, provider, site-translations tests | Six-language framework; untranslated member/feature copy remains |
| Success stories | Submit form, supabase/stories, staged audited moderation | This branch adds recorded consent, withdrawal, safe public feed and DB privacy. Photos are not displayed by new feed pending media approval/storage work |
| Mobile push | PWA manifest/service worker/install UI | Push subscription/delivery/preferences/unsubscribe missing; real Android/iPhone acceptance pending |

## Read-only Supabase security audit
Project ztuquqsmmfkoqhobfgyt matched repository/project. Inspected migration history, schema columns, RLS policies and advisors, not private member rows. There are no development branches. Do not create paid infrastructure or mutate production as a staging substitute.

Historical database migrations have version/name differences from repository scripts; reconcile definitions, not a blind db push. Profiles are owner/admin SELECT with restrictive live-session enforcement. Legacy interest participant policies require staged trigger enforcement. Media bucket public-read policy means signed URLs cannot privatize existing public objects. Saved search policies have no live-session/activity restriction. Success-story approved-row RLS exposed contact email, author ID, original content and old admin notes: row policies cannot redact individual columns.

Advisors reported definer discovery_profiles (ERROR), pg_trgm in public, publicly executable share/trigger functions, authenticated definer routines needing individual review, disabled leaked-password protection. No-policy account_deletions and horoscope QA allowlist are intentionally deny-by-default. Do not blindly change discovery to invoker or revoke intended public share access.

## Changes in this branch
- Integrate #84 optional marriage onboarding without losing existing staged fixes.
- Stop URL changes from restarting discovery loads; serialize all advanced filters and validate saved-link origin/path.
- Preserve filter focus by rendering the filter panel as an element, rather than remounting an inline component on each keystroke.
- Require live session, active viewer/subject, no block in either direction, valid photo mode and explicit owned private-bucket key before issuing a short-lived private photo URL.
- Add server-timed/versioned publication consent and owner withdrawal. Require consent before admin approval; audit withdrawal atomically. Historical approvals receive no inferred consent.
- Restrict direct story reads to active owners/admins. Public feed RPC deliberately projects exactly five approved fields; no anonymous USAGE on private schema is granted. Public React feed currently shows text only.
- Preserve #80 six-month free Premium offer; no charges, phone verification or new infrastructure.

## Release gate and rollback
New story migration depends on staged 20261102082805 moderation and account live-session/member-activity functions. It must ship with the consent-aware application after isolated signed-in staging acceptance. Migration was initially created using Supabase CLI migration new; its recorded filename was restored after workspace reset.

Take a schema/history snapshot on staging, reconcile prerequisites, apply ordered pending changes, then verify anonymous/member/owner/admin/expired sessions and audit-failure rollback. Local PGlite tests exercise PostgreSQL RLS/triggers/functions against minimal fixtures; they are not a full Supabase staging deployment. Docker/local full-stack Supabase and a remote staging branch were unavailable at audit.

If application rollback is needed, keep restrictive table grants and consent enforcement; older submissions should fail closed. Do not restore public table reads or infer historical consent. Preserve consent/evidence/audit columns. Stop public feed access if uncertain, repair forward, and verify before restoring access. Existing public photos need their own staged copy/reference/caching migration before gallery privacy can be claimed.

No main merge, production migration or production release is authorized to bypass the user's passing-CI/staging requirements. Family delegation, private galleries, journey tracker, family introductions, mutual matching, location catalogue and push remain implementation/acceptance priorities.

## Validation on the restored, integrated source
- `npm ci` completed. Full selected regression run: 395 passed, 0 failed, 0 skipped (core, signup, marriage onboarding, account lifecycle, interest consent, member safety, admin review/audit/pricing, six-month Premium, horoscope API/security, theme, search URLs, private-photo API and story SQL).
- Four additional actual story-client boundary tests pass: consent/auth before writes, verified author identity, safe backend failure, persisted withdrawal confirmation. Total distinct regression checks: 399.
- Actual React/Radix browser harnesses: discovery/story 24, registration/onboarding 36, admin/Premium/audit 26 = 86 checks. Each runs at 1280px and 390px. Discovery test simulates Next's URL subscription and verifies a filter change does not issue extra profile loads, typing retains focus, saved extended filters survive reload, neutral gender persists and private-story withdrawal handles failure/retry/double clicks. Story text is rendered as text, not HTML.
- Official Playwright browser archives were truncated. Local browser tests used temporary pinned Chromium 153 via an external npm runtime, with archive extraction adjusted for this filesystem. CI uses standard Playwright Chromium. This is desktop Chromium at mobile widths, not Android/iPhone hardware, WebKit, installed PWA, live OAuth, or signed-in Supabase acceptance.
- TypeScript passed. Full lint: 0 errors, 12 pre-existing warnings. Production build passed; no real backend secrets used. The final rebuild after the generic story-error message change also passed.
- An older #82 publication test still required location/introduction after #84 made them optional. Corrected it to enforce name/adult DOB/gender/explicit review and added a minimal-identity publication regression. No mandatory marriage-preference questions were reintroduced.
- PR #85 is draft and stacked on #82. Its initial preview deployment was READY at adc36db60561eb24338d463f9eb16c581e0174e3. Latest CI/preview acceptance must be tied to the final commit; no production release was performed.

Security reference links: [definer view review](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view), [anonymous definer routine review](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Final production inspection: main #84 (6a231c7b1eee5323f9c0f0cef0dd69fd38f61d40) remains READY at dpl_5XJxw9bQcqnbzJn6TQjMqZ4Gavj1. Supabase list_branches still returns none. No production schema/data writes or promotion occurred.
