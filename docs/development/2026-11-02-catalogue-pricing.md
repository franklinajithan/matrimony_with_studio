# Audited admin catalogue pricing — 2 November 2026

Continues PR #75, whose GitHub build/admin tests passed. This is stacked work on the consolidated #72–#75 chain. No production change or member-data mutation performed.

## What changed
Admin Plans now supports changing monthly/three/six-month catalogue prices with decimal-safe parsing into integer minor units, a mandatory reason, review then explicit confirmation, synchronous duplicate-submit prevention, optimistic updated_at matching, conflict/error recovery and persistence-first success. The migration-owned RPC fails closed when the backend has not been migrated.

The staged migration adds missing optional term columns without backfilling or changing any existing price, plan code/name or membership. An internal trigger checks live admin/session authorization, permits only price fields, preserves Free at zero, rejects zero configured paid prices, stamps server time and atomically records the real actor and old/new values/reason. Audit failure rolls back the price change. Authenticated users receive only the price-column UPDATE grants; no entitlement, role, currency or membership mutation is exposed. The public RPC is SECURITY INVOKER; the internal audit trigger cannot be invoked directly by clients.

Pricing, launch pricing, both public catalogue endpoints and savings now read the same database catalogue. Active rows retain their actual identity/currency; inactive rows are excluded, missing terms stay unavailable and read failures do not fall back to conflicting static prices. Responses disable caching. Existing localized pricing heading remains; the hard-coded market-price selector is replaced by the catalogue's configured currencies. No country/location eligibility restriction was added. Static plan definitions elsewhere remain the existing entitlement foundation and are not used as a public price source here.

## Read-only configuration findings
The deployed catalogue currently has Free, legacy Plus and Premium rather than the proposed Premium/Premium+ launch structure. It has monthly GBP pricing only. Existing names, codes and values were preserved; this implementation does not silently map or reprice legacy memberships. Harmonizing plan identities, provider price mappings and server entitlements is still part of the paid-membership release.

## Payment and staging blockers
Stripe routes in this branch remain intentionally disabled. Changing catalogue prices does not change Stripe prices, existing charges or member entitlements. Before enabling checkout, validate provider amount/currency/term mappings against the current catalogue and complete signature-verified webhook and portal integration.

The Vercel integration discovery/provisioning CLI reached a device-login requirement. No integration, provider account, secret or charge was created. Per the Marketplace skill, provider provisioning must be completed before provider-specific implementation: https://vercel.com/docs/integrations . The connected Vercel tools remain usable for read-only deployment checks; they do not authenticate the separate local CLI.

No Supabase development branch currently exists. A production-schema staging branch requires Supabase's cost-confirmation flow. Isolated SQL tests do not replace signed-in staging/device acceptance. Do not apply the entire historical migration directory blindly: preserve existing migration history, reconcile the live foundation, and review the staged chain in dependency order.

## Validation
22 pricing API, actual component, public catalogue and PostgreSQL migration tests pass and cover exact amounts, invalid inputs, duplicate confirmation, stale updates, rollback, audit identity, inactive filtering, missing terms, legacy identities, retry and fail-closed reads. Existing admin-completion (25) and admin/deletion (121) tests pass. TypeScript passes; lint has only 13 pre-existing warnings. Production build passes with 106 static pages and the existing OpenTelemetry warning. React review checked controlled input state, confirmation invalidation, synchronous mutation locks, effect cancellation, stale-response protection and accessible labels/status messages.

## Release order
1. Reconcile the consolidated #72–#75 stack and current production schema.
2. Install the reviewed lifecycle/privacy/interest/safety/admin dependencies on an isolated staging target, then this migration.
3. Use disposable admin/member sessions to validate catalogue edits, audit visibility, public price consistency, stale-write conflicts and unchanged memberships.
4. Verify desktop/mobile rendering and actual auth journeys, then review a production rollout.
5. Provision Stripe and reconcile canonical plan/provider mappings before implementing/enabling payment flows.
