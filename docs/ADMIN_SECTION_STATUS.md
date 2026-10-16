# CupidMatch admin section — implementation status

## Implemented

- Protected workspace with database-checked access on every request. Existing `profiles.is_admin` accounts remain Super Admins. Delegated staff never receive that flag.
- Support: member directory, profile assistance, connection management, private notes and individual in-app service notices.
- Moderator: report investigation, suspension/restoration, submitted profile reviews, story decisions, photo/biography removal and unpublishing.
- Super Admin: all of the above plus staff role assignment/removal, trial/promo controls, subscription records, plan information and the audit explorer.
- Responsive navigation and cards; tools and member controls follow the current role. Server and database permissions remain authoritative.
- Member directory: server-side name/email/ID search, verified/unverified/published/unpublished/admin/suspended filters, sorting, exact counts and stable pagination. CSV exports are explicitly the current page and escape formula prefixes.
- Report queue: server-side status/reason/search/date filters, exact totals and stable pagination. Investigations include bounded report history, reviewer information, notes and existing suspension controls.
- Member reporting/blocking from the safety branch is included. Reporter privacy and block interaction checks are enforced in PostgreSQL. Arbitrary third-party block lookups and non-staff report counts are denied.
- Story moderation: approval/rejection/return to pending with a reason, audit history and stale-record protection. Members cannot self-approve submissions. Approved stories appear on the public stories page; fabricated placeholder stories were removed. Private review notes are not publicly selectable.
- Content moderation: remove a selected primary/additional photo, clear a reviewed biography or unpublish a profile. Changes retain moderation evidence and a reason in restricted records, and create an audit entry in the same transaction. Photo/bio decisions reject content that changed since review.
- Individual service notices: compose, review and send; history shows member read status. Members have a protected inbox, unread badge and ownership-checked mark-as-read operation. No email, SMS or broadcast is sent by this feature.
- Existing member trials, promo codes, subscription records, pricing information and audit explorer are retained. The Support connection endpoint does not query billing data.
- Privileged implementations live in the non-exposed `cupidmatch_admin` schema. Public RPCs are invoker wrappers. No service-role key is sent to the browser.

## Validation

- `npm ci --ignore-scripts --no-audit --no-fund`: successful clean dependency installation; lockfile refreshed.
- `npm run test:admin`: page/API authorization and role revocation checks.
- `npm run test:admin:database`: 103 assertions against isolated PostgreSQL (PGlite), including actual API handlers calling the database, RLS, privilege escalation attempts, role suspension/revocation, exact pagination, search parameter safety, notification ownership, story publication/privacy/concurrency, content changes and audit records.
- `npm run typecheck`: successful.
- `npm run build`: production compilation and TypeScript validation; TypeScript build error suppression is disabled.
- CI now runs the database suite with the existing authorization checks.
- Authenticated browser journeys and visual/device checks remain unverified: browser installation failed in this environment and the available remote browser cannot reach the local preview. Test fixtures run only in an ephemeral local database; no real member records were changed.

## Release sequence

Changes are on a review branch, not deployed. The live database was inspected read-only; the following migrations still need to be applied in order after review:

1. `20260929000000_member_reports_system.sql`
2. `20260929000100_member_blocks_system.sql`
3. `20260929000200_exclude_blocked_discovery.sql`
4. `20260929000300_admin_dashboard_report_counts.sql`
5. `20261016203931_admin_operations_completion.sql`

The new migration requires the existing September admin/member/trial foundation already present on the CupidMatch database. It preserves existing audited RPC validation while assigning explicit scopes, then moves privileged bodies behind invoker wrappers. Do not blindly replay the repository's entire historical migration directory against production: live historical version identifiers differ from some checked-in filenames.

Apply the database changes before promoting the corresponding app version. Check Supabase security advisors after migration. Then verify with actual signed-in test accounts: Super Admin, Support, Moderator and ordinary member. Exercise denied direct API/RPC calls, role removal, a report/block, a story decision and its public visibility, content removal, a service notice/read receipt and an existing trial adjustment. Keep production promotion gated on these checks.

Rollback the app through the normal deployment history if necessary. Preserve audit and moderation records. Reverting to the previous read-only stories UI does not require deleting new tables. Restore prior RPC definitions deliberately if rolling back database authorization; avoid dropping tables containing real records.

## Explicit boundaries

- Stripe remains deferred. The app does not claim to have collected money, issue refunds, create billing portal sessions or grant paid entitlements from labels alone.
- Profile-review approval does not verify government identity documents and does not set an identity-verified badge. An identity-provider/document workflow remains separate.
- SMS/OTP provider setup is outside these admin changes.
- Existing Super Admin accounts are protected from delegated-role controls. Adding/removing a full Super Admin requires a separate privileged operator process.
- Content moderation removes profile references, preserving restricted evidence; it does not physically purge storage objects or automatically classify every future upload.
