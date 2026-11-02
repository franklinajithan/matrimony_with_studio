# Admin profile verification follow-up — 2 November 2026

## Result
The verification screen previously shared one reviewer-note field across all members, submitted decisions immediately and stopped both queues after 100 rows. The updated screen opens a focused confirmation dialog for the selected member/decision, resets notes between reviews and requires a 10–1000 character reason. A synchronous lock prevents duplicate submissions; cancellation is disabled during persistence. Success is displayed only after the existing review RPC confirms the exact request and decision.

Both queues now have independent pages of 20 with an extra-row next-page check, stable created_at/id ordering and parallel bounded reads. Refresh restarts from the oldest pending records, and saved/conflicting decisions restart submitted requests at page one so removed rows do not shift unseen records past the next page. Offset paging is not a snapshot: other admins can still move the queue while it is being browsed. Refresh reconciles those changes; the existing atomic RPC refuses a second decision on a reviewed request.

Queue reads cancel and ignore obsolete responses. Load failures have an explicit retry. Review failures preserve the selected member and reason; 404/409 closes the stale confirmation, reloads pending requests and explains the conflict. API responses are private/no-store, decisions require same-origin requests, strict input rejects forged fields, unexpected RPC responses fail closed, and database errors are redacted. Approval remains profile review, not government identity verification.

## Baseline and scope
Continues #76 (`d59f05b4e1bab8e58f9ab7ee403b011f5760a6a9`) on the #72–#76 dependency chain. Those draft features are still separate from current main. No schema migration or new dependency is introduced here. The existing `review_profile_verification_request` RPC retains its row lock and atomic audit behavior; this change adds stricter application-side reason validation without claiming to change direct database-call policies.

## Validation
- 23 new tests execute actual route handlers, component event/effect logic and the existing review RPC in disposable PostgreSQL/PGlite. They cover authorization, origin/input validation, exact persistence, stale decisions, audit rollback, queue ranges/tie breakers/last pages, member-specific notes, duplicate clicks, recovery and obsolete responses.
- Existing admin/deletion 121, admin-completion 25 and admin-pricing 22 tests pass: 191 tests across these suites.
- TypeScript passes. Lint passes with the same 13 existing warnings; the edited verification files have no lint warnings.
- Production build verification is recorded in the pull request.

Playwright Chromium installation failed because the downloaded archive was truncated. No actual browser, focus-trap, mobile-device, live OAuth or signed-in staging acceptance is claimed. Radix AlertDialog supplies the existing accessible dialog primitive, but keyboard/focus and narrow-screen review still need browser acceptance.

## Release
Stage and review the dependency chain before releasing this follow-up. Use disposable admin/member sessions to verify both queue pagers, dialog keyboard behavior, repeated decisions by two admins and audit history. Existing staged lifecycle/privacy/interest/safety/admin/pricing changes require their own coordinated schema acceptance. No production member review, database change, merge or release was performed during this follow-up.
