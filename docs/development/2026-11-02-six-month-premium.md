# Six-month free Premium selection — 2 November 2026

## Member experience
Pricing and launch-pricing offer a selectable Premium option labelled “Free for 6 months”. Selecting it opens Membership; signed-out members are sent to login with Membership as the return destination. An authenticated member explicitly starts the offer. Confirmed email and an active account/session are required; phone verification, card details and Stripe are not required for this separate launch campaign.

Activation returns the persisted six-month window and displays its expiry date. Membership and server entitlement resolution use that persisted window. After expiry the Free plan applies unless another valid existing trial/subscription independently grants access. Existing higher plans and old invitation/trial records are preserved. Other catalogue identities and future reference prices are not rewritten.

This is one launch offer per authenticated account, starting at activation. Repeated/concurrent selections return the original window. Expired claims cannot restart it. No automatic charge, paid renewal, provider call or payment details are created. This does not add Premium+ to the offer or claim that unfinished Premium feature implementations are complete.

## Persistence and security
Staged migration `20261102124728_six_month_premium_launch_offer.sql` adds a separate own-readable RLS table. Members cannot insert, update or delete grants directly. A public invoker wrapper calls a private definer routine with an empty search path, current identity/live-session/member-activity and verified-email checks. Calendar calculation is fixed to UTC. Client-supplied recipient, tier, duration and dates are not accepted.

A per-member transaction lock, primary key and atomic audit prevent duplicate grants or silent grant-without-audit failures. No paid-membership, phone verification, existing trial or promo-code function is changed. Deleting the auth identity cascades its launch row; deactivated/revoked users cannot read/claim while inactive. Reactivation does not restart or extend the original window.

The server returns Free when the grant table is not installed/has no readable row; activation fails with a retryable structured error and never claims success without the expected stored result. API responses are private/no-store. Same-origin validation precedes the write. The success link reloads Membership so its server summary reads the newly persisted entitlement.

## Validation and release
10 new actual-handler/server-access/disposable PostgreSQL tests cover email without phone, exact six calendar months, unchanged repeated/expired claims, cross-member denial, direct-write denial, revoked/inactive denial, audit rollback, forged inputs and preserved higher-tier access. Existing pricing (22) and core (14) suites pass. The actual React/Radix browser harness now passes 26 checks at desktop/mobile widths, including activation/expiry feedback using isolated HTTP fixtures. TypeScript, lint and production build results are recorded in the PR; fixture browser checks are not signed-in Supabase acceptance.

This is stacked on #79, continuing the existing proposed #72–#78 changes. No production migration, live member grant, merge, charge or release is performed. Before release, reconcile and stage the dependency chain, apply this new migration, validate disposable email-confirmed accounts with no phone, verify actual server entitlements and repeat/expired claims, then publish the reviewed app. The public copy and migration must be released together. Paid checkout stays disabled.
