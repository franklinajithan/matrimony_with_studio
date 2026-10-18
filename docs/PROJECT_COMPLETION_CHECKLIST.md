# CupidMatch completion checklist — 18 October 2026

Latest broad QA findings and coverage: [SITE_QA_REPORT.md](SITE_QA_REPORT.md). Nine defect groups fixed in code; atomic interest quotas and complete public-page localization remain open. Paid billing must stay disabled pending quota enforcement and actual provider acceptance. Critical dependency advisories were patched; remaining high/moderate audit findings also need review before release.

Code completion, isolated tests, preview deployment and live acceptance are separate. PR #40 preserves current main `5805c47baca3447ed7bfe6dd385308492226beaa`, including the latest gender eligibility fix. Production deployment `dpl_G9VRoCpF3Y8uhZVpAoGHdU76idL2` is READY on that main commit. The 17 October completion target was missed; this project is not yet fully released. No production migrations were applied during this pass.

| Requested feature | Code status | Verification / outstanding work |
|---|---|---|
| Registration, confirmation, login/logout, recovery | Refreshed cookies preserved through redirects, dashboard callback default, explicit recovery/error states; optional SMS retained | Google login and session persistence verified live on 17 October after owner corrected provider redirects. Eight OAuth/session tests pass. Dedicated signup/confirmation/recovery and Facebook acceptance outstanding |
| Resumable onboarding, validation, completion and publication | Existing implementation preserved | Existing schema/readiness checks; signed-in persistence journey outstanding |
| Password/account settings and notification preferences | Added current-password confirmation, password update and email preferences | Type checked; real password/recovery testing requires dedicated account |
| Account pause/reactivation | Added authoritative account controls; discovery, messaging and planning honor pauses | Database tested; browser acceptance outstanding |
| Account data export | JSON plus streamed .tar.gz archive of paginated owner records and owned photos/available attachments; read receipts excluded | Database/API/system-tar checks pass. Private/no-store, three/hour, 250MB total, 10MB/file and two-minute processing bound; incomplete manifest on failures. Server key and real Storage/browser acceptance pending; larger exports require assistance |
| Account deletion | Request/pause/cancel, Super Admin approval with stale-request checks, leased retry worker, storage cleanup, application/Auth removal and completion audit implemented | **Disabled** pending retention approval, service key/cron and dedicated-account acceptance. Holds prevent staff/open-investigation erasure. Test provider cancellation/redaction only; live provider cleanup remains a manual reviewed procedure. Partial cleanup is never marked complete |
| Profile/background/preferences editing, photos and review | Existing implementation preserved; media gateway added | Existing validation; storage and browser CRUD acceptance outstanding |
| Profile/photo privacy, publication and sharing | Hardened direct media access; token-only biodata resolver, server redaction and active/block checks | PostgreSQL privacy tests passed; needs server key and browser share/photo acceptance |
| Biodata editing/exports | Existing studio preserved; secure token randomness and share privacy fixed | PDF/image export and device acceptance outstanding |
| Search/filters/sorting/pagination/saved preferences | Removed silent 500-profile cutoff; all privacy-safe directory pages read before scoring/filtering; match/newest/name/age sorting and 20-result pages; fixed filter-reset loop | Tests include records beyond 500, cancellation/failure, URL-sized shortlist status batches. Explicit 10,000-profile safety ceiling; indexed server discovery required above that scale. Signed-in browser coverage outstanding |
| Explainable recommendations | Existing deterministic preference scoring/reasons preserved | Broader signed-in recommendation acceptance outstanding; no fabricated AI matching claims |
| Shortlists/interests/acceptance/connections | Added protected paginated shortlist screen, owner-only removal and privacy-safe profile projection; existing atomic interests/connections preserved | API ownership/visibility checks pass; actual two-member journeys outstanding |
| Visitors/private browsing | Existing PR #40 work preserved; corrected legacy Plus privacy entitlement | Database tests passed; migrations not live |
| Persistent text messages/history | Atomic sending/unread/read operations; idempotent request IDs; earlier history pagination; polling fallback | SQL/API checks passed; multi-browser unread/history acceptance outstanding |
| Message attachments | Private JPEG/PNG/WebP/PDF upload/download, 5MB/type-signature/quota checks; connected unblocked access; moderation removal | SQL + signature tests passed; Storage/browser upload/download and failure acceptance outstanding |
| Voice/video calls | WebRTC media/signaling, incoming/accept/reject/end/missed/unavailable, media cleanup, private call records; Premium/trial caller, free connected receiver | **Disabled**: TURN setup and two-device/browser permission/network tests outstanding; user-bound ten-minute TURN credentials implemented |
| Family Circle | Confirmed-email invitations, accept/decline/leave/revoke, helper permissions, suggestions/comments/activity; member membership enforcement | Database ownership/permission/revocation tests passed; no invitation email is sent; signed-in acceptance outstanding |
| Future Map | Private saved location/relocation/career/family/timeline, editable milestones, progress and explicit connection/family sharing | Database ownership, stale-version, pause/revoke tests passed; browser acceptance outstanding |
| Plans/trials/promos/entitlements | Existing work preserved; launch plan catalog aligned without rewriting real subscriptions | Existing admin/database checks passed; browser acceptance outstanding |
| Stripe checkout/portal/cancellation/refund administration | Price validation; stable customer binding/checkout lock; pending-session reuse; Stripe promo entry; checkout-return polling; invoices/PDFs; portal; cancel/resume renewal; audited admin history and test refunds | **Disabled**: test credentials/price IDs/webhook/service key missing. Mocked API and PostgreSQL tests pass; actual Stripe sandbox/portal/refund acceptance absent. Live payments unsupported, payouts excluded |
| Billing webhooks | Raw-body signature verification, event receipt idempotency, authoritative subscription retrieval, stale-event prevention and expiry/failure mapping | SQL + signed fixture tests passed; real Stripe retry/portal/refund tests outstanding |
| Government-ID verification | Explicitly optional UI, accurate provider availability, hosted session/status/retry and signed event handling; profile review separate | **Disabled** as requested. No ID submission required to use the account. Provider keys and actual sandbox acceptance absent; test evidence cannot grant a live badge |
| External SMS/OTP | Guarded provider adapter retained | **Pending/deferred by request**, disabled; no phone evidence or trial entitlement invented |
| Reporting/blocking/suspension/content moderation | Existing PR #40 work preserved | Database/API authorization tests passed; actual member/staff acceptance outstanding |
| Support tickets/threads/assignment/resolution/reopen | Existing PR #40 work preserved | Existing SQL/API tests passed; browser journey outstanding |
| In-app notices | Existing private notices and read status preserved | SQL ownership tests passed; live acceptance outstanding |
| Email notifications | Opt-in outbox, send-time account/block/connection checks, bounded retries, Resend idempotency, signed delivered/bounced/complained receipts, bounce/complaint opt-out and staff status queue | **Disabled**: provider/sender/webhook/cron missing. Default mode restricted to authorised test recipients; live mode additionally requires explicit operator configuration. No scheduler enabled or actual email sent/tested |
| Full admin workspace | Existing role-aware operations preserved; Super Admin plan page now shows integration flags, missing input names and acceptance requirements without exposing secrets | 110 authorization tests and SQL role/scope checks passed; signed-in roles/mobile acceptance outstanding |
| Public website | Existing pages preserved; removed unsupported claims; fixed shortlist/preferences/help destinations and obsolete disabled attachment control | Literal internal link audit passes. Build/typecheck pass; full keyboard/mobile/desktop acceptance outstanding |
| Legal/contact information | Factual product information pages exist | **Incomplete**: owner must provide legal operator, public contact, lawful-processing details, final retention/terms/refund policy; no details invented |
| Database/release | Nine missing migrations identified in order; CI expanded | All tested in isolated PostgreSQL; live schema compatibility/backup, signed-in acceptance, migration application, merge and production promotion outstanding |

## Validation recorded in this pass

- 112 admin page/API authorization tests.
- 300 isolated PostgreSQL assertions: 105 admin, 57 website, 31 planning/account, 63 communication/provider/privacy/export and 44 billing/delivery/erasure assertions. Checks include partial-job visibility, shared conversation cleanup, opt-out, blocked-interest email suppression and retry exhaustion. Actual API handlers are exercised where fixtures support them.
- 59 provider/file/API/directory tests, including system-tar interoperability, Stripe SDK signatures, invoice ownership, duplicate checkout prevention, plan-preserving sign-in, scoped/idempotent refunds, Svix's published signature vector and erasure failure ordering. Provider responses are **mocked**; these are not external sandbox tests.
- Eight OAuth/session routing tests.
- Clean dependency installation, TypeScript and production build. No lint pass is claimed (existing build skips lint).
- Preview/public browser inspection does not count as signed-in acceptance.

## Requirements and assumptions

- Preserve Next.js/Supabase; old Firebase references in the historic product specification are obsolete.
- Family helpers never impersonate the member, send member messages, accept interests or bypass profile privacy. Invitations are in-app only; the owner contacts the helper themselves.
- Future Map is an editable planning tool, not a prediction or promise. Sharing exposes the entire saved plan to explicitly chosen, still-authorised people.
- Direct storage reads for private other-member photos are denied; the media gateway checks current permission. Already-issued historical Storage signed URLs can remain valid until expiry and require a separate provider response if immediate revocation is needed.
- No real member mutation, payment/refund or unsolicited notification was used for testing.
- The feature checklist is intentionally not marked complete: provider tests, signed-in/browser acceptance, final retention and coordinated release remain unfinished.

See `PROVIDER_SETUP_AND_RELEASE.md` for exact environment/setup needs, the ordered migration list, acceptance scenarios and coordinated app/database rollback requirements.
