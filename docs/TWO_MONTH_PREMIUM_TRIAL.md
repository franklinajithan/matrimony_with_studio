# Two-calendar-month Premium trial — 4 November 2026

This is a standalone release against current main, separate from the payment ledger and the unrelated #85 release chain. It reuses the claim API/component and separate grant model from #80 rather than merging its dependent feature chain.

## Membership behavior

Free remains available. Email-confirmed, active, signed-in members may explicitly activate Premium once; phone verification and a payment card are not required. The window starts at the database transaction timestamp and ends two UTC calendar months later, with month-end clamping. For example, 31 December 2026 at 09:00 UTC ends 28 February 2027 at 09:00 UTC. No automatic charge or renewal occurs.

Registration offers Free/Premium. Selecting Premium preserves the internal Membership destination through email signup and Google OAuth; it does not grant access from metadata or the URL. Membership performs the explicit authenticated claim and displays its persisted expiration date/time in UTC. It also offers a route back to complete the matrimonial profile; optional-question requirements are unchanged.

Once claimed, repeated selections, reloads, concurrent requests and attempts through the older phone trial RPC cannot restart the window. The account-level guarantee does not claim to detect the same person creating a different account. Admin grants remain privileged, audited support actions.

At the exact expiry instant the server resolves access to Free, unless an independent valid paid subscription or older trial still provides access. No cron, new infrastructure, profile removal or message deletion is involved. Current higher plans are retained even when newer expired/past-due records exist.

## Migration and historical promises

Apply only `20261104125818_two_month_premium_offer.sql`, after staging acceptance and explicit production approval. Production already has the required account/session guards, member_trials and admin audit table. Do not blindly replay the historical migration directory.

The new migration supports either a missing premium_launch_offers table (current production) or the six-month table staged in #80. It preserves all existing rows, accepts historical six-month windows, defaults new grants to two months and prevents updates to immutable grants. It does not rewrite #80's historical migration.

Existing member_trials, including expired trials and invitation/admin extensions, are returned as the original window instead of issuing another offer. The previous phone-based activate_member_trial wrapper delegates to the same claim policy. New invitation-code activations are unavailable; existing granted invitation entitlements remain valid. This closes the alternative three-month claim path rather than leaving a second way to start a trial.

The six-month durations in paid price tables/options are purchase terms, not free-trial lengths. Existing promo/admin historical copy is not a promise that a new account can obtain six free months. #80/#85 documents describe their staged historical state and must not be read as the new policy.

## Release and rollback

Production schema inspection on 4 November: premium_launch_offers does not exist. Migration history ends at 20261023073857 (horoscope_revision_conflict); production main is b20cbeb. No production write was made.

Stage the targeted migration and trial application together; validate real confirmed/unconfirmed members, an inactive/revoked session, an existing six-month member, exact expiry and an admin. Local PostgreSQL tests use PGlite with minimal identity fixtures, not a full Supabase deployment. Do not substitute real-member mutation for staging acceptance.

Rollback the application if necessary, but retain the immutable rows and tightened old claim wrapper. Do not restore an older wrapper that would create a second trial. Current-main rollback loses the new offer UI/entitlement reader, so temporarily disable new activations and repair forward rather than silently withdrawing promised access. Never delete trial history to roll back.

## Validation

`npm run test:premium-launch` exercises the real API, server resolver, PostgreSQL constraints/RLS/claim functions, audit rollback, historical six-month upgrade, legacy trials, month ends and exact expiry. `scripts/auth-session.test.cjs` verifies safe Premium confirmation destinations without granting access. Registration browser tests run the actual React form and onboarding with synthetic HTTP/auth boundaries at 1280px and 390px.

No production migration or deployment is performed by this PR. Payment-related changes remain in the separately stacked PR #90.

## Release follow-up

The resolver now treats an Auth error as unauthenticated even if an identity object is returned, and disables new activation UI when the grant table is missing. This lets the application fail visibly and safely before the approved migration rather than offering a button that can only fail.

The additional session acceptance suite runs the production session/activity guard definitions against isolated PostgreSQL auth.sessions/profiles fixtures: revoked and mismatched sessions, missing session IDs, unconfirmed email, suspended/deactivated/deletion-pending accounts, owner/admin reads and immutable grants. It is not a live GoTrue/OAuth staging run. No remote development branch exists; none is created because the budget is £0.

The read-only preflight is in scripts/trial-production-preflight.sql. Production migration requires explicit owner approval. No activation/payment deployment or production DDL is implied by passing these local checks.
