# CupidMatch completion checklist — 17 October 2026

Code completion, isolated tests, preview deployment and live acceptance are separate. PR #40 remains the delivery branch; repository main was `f95b7cd6dfe69550d4a5de4e979a320ef663c8ca` when inspected (its latest production deployment failed; an older READY deployment is serving). No production migrations were applied during this pass.

| Requested feature | Code status | Verification / outstanding work |
|---|---|---|
| Registration, confirmation, login/logout, recovery | Existing implementation preserved | Supabase Auth email confirmation enabled; Google/Facebook/phone currently disabled. Dedicated-account/browser and email-delivery acceptance outstanding |
| Resumable onboarding, validation, completion and publication | Existing implementation preserved | Existing schema/readiness checks; signed-in persistence journey outstanding |
| Password/account settings and notification preferences | Added current-password confirmation, password update and email preferences | Type checked; real password/recovery testing requires dedicated account |
| Account pause/reactivation | Added authoritative account controls; discovery, messaging and planning honor pauses | Database tested; browser acceptance outstanding |
| Account data export | Added profile, sent messages, biodata/share records, plans, circles, notices and support JSON | Ownership tested; binary archive/asynchronous large-account export absent |
| Account deletion | **Incomplete**: confirmation, immediate pause, cancel request and staff queue implemented | Permanent erasure/provider cleanup and approved retention procedure unfinished |
| Profile/background/preferences editing, photos and review | Existing implementation preserved; media gateway added | Existing validation; storage and browser CRUD acceptance outstanding |
| Profile/photo privacy, publication and sharing | Hardened direct media access; token-only biodata resolver, server redaction and active/block checks | PostgreSQL privacy tests passed; needs server key and browser share/photo acceptance |
| Biodata editing/exports | Existing studio preserved; secure token randomness and share privacy fixed | PDF/image export and device acceptance outstanding |
| Search/filters/sorting/pagination/saved preferences | Existing implementation preserved | Uses real profile data; browser coverage outstanding |
| Explainable recommendations | Existing deterministic preference scoring/reasons preserved | Broader signed-in recommendation acceptance outstanding; no fabricated AI matching claims |
| Shortlists/interests/acceptance/connections | Existing implementation preserved | Existing atomic acceptance and permissions; browser journeys outstanding |
| Visitors/private browsing | Existing PR #40 work preserved; corrected legacy Plus privacy entitlement | Database tests passed; migrations not live |
| Persistent text messages/history | Atomic sending/unread/read operations; idempotent request IDs; earlier history pagination; polling fallback | SQL/API checks passed; multi-browser unread/history acceptance outstanding |
| Message attachments | Private JPEG/PNG/WebP/PDF upload/download, 5MB/type-signature/quota checks; connected unblocked access; moderation removal | SQL + signature tests passed; Storage/browser upload/download and failure acceptance outstanding |
| Voice/video calls | WebRTC media/signaling, incoming/accept/reject/end/missed/unavailable, media cleanup, private call records; Premium/trial caller, free connected receiver | **Disabled**: TURN setup and two-device/browser permission/network tests outstanding; user-bound ten-minute TURN credentials implemented |
| Family Circle | Confirmed-email invitations, accept/decline/leave/revoke, helper permissions, suggestions/comments/activity; member membership enforcement | Database ownership/permission/revocation tests passed; no invitation email is sent; signed-in acceptance outstanding |
| Future Map | Private saved location/relocation/career/family/timeline, editable milestones, progress and explicit connection/family sharing | Database ownership, stale-version, pause/revoke tests passed; browser acceptance outstanding |
| Plans/trials/promos/entitlements | Existing work preserved; launch plan catalog aligned without rewriting real subscriptions | Existing admin/database checks passed; browser acceptance outstanding |
| Stripe checkout/portal/cancellation/refund administration | Added official pinned SDK, server price validation, test checkout/portal/cancel and audited test refund adapter | **Disabled**: test credentials/price IDs/webhook/service key missing; signed fixture tests passed, actual Stripe sandbox tests absent; live payments unsupported |
| Billing webhooks | Raw-body signature verification, event receipt idempotency, authoritative subscription retrieval, stale-event prevention and expiry/failure mapping | SQL + signed fixture tests passed; real Stripe retry/portal/refund tests outstanding |
| Government-ID verification | Stripe Identity hosted document/selfie session, status/retry/canceled UI, signed provider event handling; profile review remains separate | **Disabled**: provider account/keys/webhook and actual test submissions absent; sandbox evidence cannot grant live identity badge; document review stays in authorised provider console |
| External SMS/OTP | Supabase Auth provider adapter, confirmed-phone check, retry cooldown and server attempt limits | **Disabled**: provider/OTP expiry/countries/abuse configuration and actual SMS tests absent |
| Reporting/blocking/suspension/content moderation | Existing PR #40 work preserved | Database/API authorization tests passed; actual member/staff acceptance outstanding |
| Support tickets/threads/assignment/resolution/reopen | Existing PR #40 work preserved | Existing SQL/API tests passed; browser journey outstanding |
| In-app notices | Existing private notices and read status preserved | SQL ownership tests passed; live acceptance outstanding |
| Email notifications | Preference-aware outbox and authenticated worker, Resend idempotency, retries, confirmed-email and authorised-test-recipient allowlist | **Disabled**: sender/provider/cron/test recipients missing; no scheduler enabled, no actual sends tested; unrestricted delivery not implemented |
| Full admin workspace | Existing role-aware directory/reports/moderation/support/notices/trials/promos/audit; new scoped feature queues, access revocation and test payment operations | 110 authorization tests and SQL role/scope checks passed; signed-in roles/mobile acceptance outstanding |
| Public website | Existing pages preserved; removed another unsupported membership claim; linked planning/circle tools; privacy information updated | Build/typecheck passed; full keyboard/mobile/desktop/link acceptance outstanding |
| Legal/contact information | Factual product information pages exist | **Incomplete**: owner must provide legal operator, public contact, lawful-processing details, final retention/terms/refund policy; no details invented |
| Database/release | Nine missing migrations identified in order; CI expanded | All tested in isolated PostgreSQL; live schema compatibility/backup, signed-in acceptance, migration application, merge and production promotion outstanding |

## Validation recorded in this pass

- 110 admin page/API authorization tests.
- 224 isolated PostgreSQL assertions: 105 existing admin, 57 existing website, 31 planning/account and 31 communication/provider/privacy. Actual API handlers are exercised where the fixtures support them.
- 14 provider/file/API tests, including genuine Stripe SDK test signatures with **mocked provider responses**. These are not external sandbox tests.
- TypeScript and production build. No lint pass is claimed (existing build skips lint).
- Preview/public browser inspection does not count as signed-in acceptance.

## Requirements and assumptions

- Preserve Next.js/Supabase; old Firebase references in the historic product specification are obsolete.
- Family helpers never impersonate the member, send member messages, accept interests or bypass profile privacy. Invitations are in-app only; the owner contacts the helper themselves.
- Future Map is an editable planning tool, not a prediction or promise. Sharing exposes the entire saved plan to explicitly chosen, still-authorised people.
- Direct storage reads for private other-member photos are denied; the media gateway checks current permission. Already-issued historical Storage signed URLs can remain valid until expiry and require a separate provider response if immediate revocation is needed.
- No real member mutation, payment/refund or unsolicited notification was used for testing.
- The feature checklist is intentionally not marked complete: provider tests, signed-in/browser acceptance, final erasure/retention and release remain unfinished.

See `PROVIDER_SETUP_AND_RELEASE.md` for exact environment/setup needs, the ordered migration list, acceptance scenarios and coordinated app/database rollback requirements.
