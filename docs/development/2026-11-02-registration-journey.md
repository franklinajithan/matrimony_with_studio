# Registration and onboarding acceptance — 2 November 2026

## Verified bugs fixed
- Reopening a saved draft without an explicit `step` query parameter previously ran `Number(null)` and always selected step zero. A real-component browser fixture returning saved step three reproduced the wrong screen. Saved checkpoints now resume correctly; explicit valid step links still override them.
- Save and exit previously navigated to the dashboard even after persistence failed. It now stays on the form, displays the error and permits retry.
- Continue/back previously changed screens before confirming persistence. Navigation now awaits a successful save and guards repeated clicks synchronously.
- Concurrent autosaves could reach storage out of order, and an older successful response could replace newer typing. Save requests are serialized; pending debounce timers are cancelled on explicit actions, and a response updates the visible draft only if it still represents the current edit snapshot.
- Publish now uses a stable saved snapshot and synchronous lock and requires explicit backend success/publication confirmation before reporting success or leaving the form. Inputs/navigation are disabled during explicit save/publish operations, and navigation waits for photo uploads.

No database schema, live profile publication or account modification is introduced by this fix.

## Browser and service acceptance
A committed Chromium harness renders the actual signup, React Hook Form, Zod, Radix and eight-step onboarding components/CSS. Identity/navigation/storage boundaries and HTTP are fixtures; it does not connect to a real mailbox or OAuth provider. Date is fixed for repeatable exact-age checks.

28 checks pass across 1280px and 390px: saved checkpoint/explicit-step handling; failed exit/continue remaining in place; underage boundary denial; delayed autosave preserving the newest typing/storage; traversal through all eight screens; review confirmation before publishing; connection-only photo privacy; one persisted publish; mobile overflow/uncaught exceptions; password mismatch; required consent; optional phone; confirmation-required signup; duplicate-email errors and the Google OAuth entry point.

Three actual publication-service tests confirm full validation before writes, server-derived member identity, no privileged-field injection, photo-privacy preservation and database-error propagation. Existing signup/auth (13) and core (14) suites pass. Lint/typecheck/build results are recorded in the PR. CI runs both new suites.

## Live test boundary
The user created the supplied test account through the browser handoff and confirmed its email. A read-only exact-account metadata check confirmed email confirmation, no deletion and no current ban. A secure browser login attempt still displayed “Invalid email or password”; no repeated guessing, credential logging, password reset or forced authentication bypass was performed. No test profile was published to live discovery.

Real signed-in draft persistence, publication/discovery and the six-month launch claim remain acceptance items once valid sign-in is established and the proposed release/schema chain is staged. Fixture browser/service results are not proof of live OAuth/mailbox/device acceptance. The separate login-eye change is PR #81 against main and is not included here.

This follow-up is based on #80. No production merge, deployment or migration performed.
