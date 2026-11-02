# Non-billing release readiness — 2 November 2026

Requested scope: continue the remaining CupidMatch work excluding phone verification and paid memberships. This change advances browser validation and records concrete staging/security findings. It does not claim completion of worldwide locations, delegated family assistance or a production release.

## Completed browser work
The official Playwright Chromium and headless-shell downloads returned truncated archives. A temporary pinned @sparticuz/chromium 153.0.0 npm runtime supplied a working Linux browser after manual archive extraction. This runtime is outside the repository and is not an application dependency. The committed harness accepts an optional PLAYWRIGHT_LAUNCH_OPTIONS_FILE for an installed browser; normal CI uses Playwright's standard Chromium.

`npm run test:browser-admin` bundles the actual verification and audit React/Radix components and CSS, serves them on an ephemeral loopback port, and isolates HTTP responses using Playwright routing. Desktop 1280px and mobile-width 390px checks cover confirmation identity, required reason, real keyboard focus containment, cancellation/reset, persisted-response feedback, queue last-page controls, audit paging/reset, console exceptions and horizontal overflow: 18 assertions pass. Browser security remains enabled. This is actual DOM/browser acceptance with fixture APIs; it is not a signed-in Supabase integration test, Android WebView, Google OAuth or installed iPhone test.

Add a read-only CI job running the same harness. No credentials, live records, production requests or account mutations are needed. esbuild 0.25.3 is pinned directly for the bundling harness, retaining existing package versions and optional lock entries.

## Staging blocker
The matched production project is `matrimony-with-studio`. `list_branches` returned no development branches. The create-branch tool opened its required cost-confirmation flow, which expired without provisioning a branch. No production data/schema change was made. A confirmed staging branch is still needed to validate the full existing migration stack and disposable signed-in admin/member journeys. Do not apply the historical migration directory blindly; preserve already-deployed lifecycle history.

## Security review findings
Read-only security advisors and function/view definitions were inspected, without reading member rows.

- `discovery_profiles` is a definer view with deliberate column/photo projection, member activity and live-session predicates. Simply changing it to invoker can break cross-member discovery because underlying profile RLS differs. Validate exposure/grants and staged privacy/blocking changes against an isolated production-schema target before changing it. Advisor: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view .
- `resolve_profile_share` intentionally serves token-based public shares. Its deployed function is older than the staged inactive-member/connection-photo privacy fix already in the consolidated branch. Stage and verify that existing fix before release; blanket revocation would break sharing. Advisor: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable .
- `assign_member_public_reference` is a trigger-returning function; direct trigger invocation is denied by PostgreSQL. Its public EXECUTE grant merits cleanup after staging, but an advisor warning alone does not prove direct RPC data exposure.
- RLS-with-no-policy on account deletion state and the horoscope QA allowlist is intentionally deny-by-default for client roles; adding broad policies would weaken that boundary.
- Existing authenticated definer routines require individual authorization/session review rather than blanket revocation. Leaked-password protection is disabled; enabling it is an Auth configuration/release item, not changed here.

## Remaining requested work, not completed by these checks
1. Cost-confirmed staging, ordered migration reconciliation, disposable identities and live auth/session/RLS acceptance.
2. Worldwide region/city identifiers, indexed GeoNames ingestion/search, manual settlement fallback, additive legacy preservation and integrated editing/discovery acceptance (#53). Existing country choices do not complete this.
3. Family consent/invites/scoped helper access/revocation/auditing, following #58's deny-by-default design. The existing guidance page is not delegated access.
4. Real Android and iPhone installed-app OAuth/resume/offline testing; desktop Chromium viewport emulation does not establish installed-app compatibility.
5. Release the reviewed dependency chain only after staging acceptance. No merges, production migrations or promotions were performed.
