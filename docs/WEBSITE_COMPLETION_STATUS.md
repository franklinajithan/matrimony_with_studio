# Website and admin completion pass — 16 October 2026

## Added and corrected

- Private member support tickets and threaded replies; Support/Super Admin inbox with search, pagination, assignment, status/reason changes, stale-state protection and audit logging. Staff replies create in-app notices. Ticket creation and replies have database rate limits and retry idempotency.
- Contact page now links to real support and account recovery, with fabricated contact details removed.
- Profile visitors use real records and enforce current paid/trial entitlements inside PostgreSQL. Premium+ private browsing skips future visit records. Self/staff visits, inactive targets and blocked interactions are excluded; visit lists cover 90 days.
- Discovery uses an invoker-security view over a narrow private implementation. Photo and gallery visibility for connections-only profiles requires an actual accepted connection. Raw profile RLS stays unchanged.
- Privacy page includes blocked-member pagination/unblocking and private-browsing controls. Unblocking does not restore connections or remove someone else's block.
- Member support, discovery, interests, connections, verification and notifications are covered by authenticated routing.
- Settings now waits for initial authentication rather than leaving an unresolved loading screen.
- About/Features use the correct brand and describe actual functionality. Blog now contains authored product guides, without invented authors, historic publication dates, fake images, placeholder comments or inert load-more controls.
- Signup/footer destinations for privacy, service rules, community guidelines and accessibility now exist. Added friendly error/404 pages, sitemap and robots rules that exclude private application areas.
- Removed the unsupported 10,000+ membership claim and outdated live-billing/identity-verification claims.

## Validation

106 page/API authorization tests passed. The website PostgreSQL suite runs the prior 105 admin assertions plus 57 new assertions covering real API handlers, support ownership, retries, limits, role separation, visitor entitlement expiry, private browsing, blocking and connection-only photos. Type checking and production build passed.

## Release requirements and boundaries

Apply the admin/report migrations listed in ADMIN_SECTION_STATUS.md, followed by `20261016210055_website_support_and_profile_activity.sql`. The website suite uses isolated PostgreSQL and does not create live test accounts or send messages to real members.

Signed-in browser acceptance checks are still required before promoting the completed build. Public preview checks and anonymous access-control checks can run without account credentials. The existing CI and Vercel preview were green at the start of this pass.

The new privacy and service-rule pages describe current implementation. The owner still needs to confirm the legal operator identity/public contact, lawful-processing information, final retention policy and applicable contractual terms before treating these pages as a final legal notice. These details must not be invented. Reference: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/

Stripe checkout/portal/refunds, government-ID verification and external SMS setup remain separate provider integrations. Family Circle, Future Map, voice/video calls and message attachments remain roadmap features; this pass does not claim they are shipped.
