# CupidMatch Complete Two-Member QA Scenario Catalogue

This is the release QA contract for the journey between two dedicated test members, **User A** and **User B**. Automated tests must use test accounts only. User C is used for privacy/security isolation tests.

## Stage 0 — clean starting state
- QA-001: A and B can create/confirm accounts and sign in independently.
- QA-002: unauthenticated visitors are redirected from member-only pages.
- QA-003: A cannot see B's private DOB/contact/private photos unless policy permits it.
- QA-004: A and B complete onboarding, save drafts, publish profiles and remain published after refresh/sign-in.
- QA-005: incomplete/unpublished profiles obey discovery visibility rules.
- QA-006: A cannot interact with their own profile.
- QA-007: duplicate signup/login failures show safe errors without exposing account data.

## Stage 1 — discovery
- QA-010: B appears in A's discovery results when B satisfies A's filters/preferences.
- QA-011: changing filters updates results correctly.
- QA-012: A can open B's profile and only allowed fields are visible.
- QA-013: B does not appear where gender/preferences/privacy rules exclude B.
- QA-014: blocked/hidden members do not appear where product rules say they must be hidden.
- QA-015: discovery works after refresh and on mobile viewport.

## Stage 2 — interest request
- QA-020: A sends an interest to B.
- QA-021: A immediately sees the request as Sent/Pending.
- QA-022: B receives exactly one pending interest from A.
- QA-023: refresh does not duplicate or lose the request.
- QA-024: A cannot create duplicate pending interests.
- QA-025: A can withdraw a pending interest and B no longer sees it as pending.
- QA-026: A can resend after a withdrawn/declined request when product rules allow it.
- QA-027: B can decline; both sides see the correct final state.
- QA-028: User C cannot read or modify the A→B interest.

## Stage 3 — acceptance and connection
- QA-030: B accepts A's pending interest.
- QA-031: the interest changes from pending to accepted exactly once.
- QA-032: a connection appears for A.
- QA-033: the same connection appears for B.
- QA-034: no duplicate connection is created after refresh/retry.
- QA-035: accepting automatically creates one A/B chat.
- QA-036: both members can open that same chat.
- QA-037: User C cannot open/read the A/B chat by guessing its URL/id.

## Stage 4 — messaging
- QA-040: A sends a unique text message; it appears in A's thread.
- QA-041: B receives the exact message without manual refresh (Realtime).
- QA-042: B replies and A receives the exact reply.
- QA-043: messages remain after both users refresh/re-login.
- QA-044: ordering is chronological and no duplicates appear.
- QA-045: empty/whitespace-only messages cannot be sent.
- QA-046: rapid double-click/retry does not accidentally duplicate a message.
- QA-047: long text, emoji and supported Unicode (Tamil/Sinhala/German etc.) render correctly.
- QA-048: conversation preview shows the latest message and correct sender.
- QA-049: message UI works at mobile viewport.

## Stage 5 — unread, delivered/read state
- QA-050: before A sends, B's unread count is zero for the clean chat.
- QA-051: A sends while B is outside the chat; B's unread count increases.
- QA-052: opening the conversation clears B's unread count.
- QA-053: A's sent message changes to read only after B reads it.
- QA-054: B reading A's message does not incorrectly mark B's own messages.
- QA-055: unread state remains correct after refresh and on conversation list/dashboard badges.
- QA-056: multiple unread messages produce the correct count.

## Stage 6 — safety, block and isolation
- QA-060: B can block A.
- QA-061: blocked state is visible to the blocker in privacy/safety controls.
- QA-062: after block, A cannot send B a new interest.
- QA-063: after block, A cannot send B a message.
- QA-064: direct URL/API attempts cannot bypass the block.
- QA-065: blocked users' discovery/profile visibility follows the defined privacy rule.
- QA-066: User C remains unable to access A/B messages, interests or private data.
- QA-067: B can unblock A; permitted interactions only return according to product rules.
- QA-068: report/block actions do not expose the reporter's private details.

## Stage 7 — remove connection
- QA-070: A can remove the A/B connection.
- QA-071: connection disappears for both members after reload/realtime update.
- QA-072: removed connection cannot continue messaging unless the product explicitly allows historical chat.
- QA-073: old chat history visibility follows the defined retention rule.
- QA-074: removing twice/retrying is handled safely without duplicate/error state corruption.
- QA-075: a future reconnection creates/restores the correct single relationship/chat according to product rules.

## Stage 8 — session, device and resilience
- QA-080: A and B can use separate simultaneous sessions without session crossover.
- QA-081: logout prevents access via Back/refresh.
- QA-082: expired sessions redirect safely and preserve no private cached UI.
- QA-083: temporary network loss shows a recoverable state; retry does not duplicate interests/messages.
- QA-084: desktop and mobile show the same relationship/message state.
- QA-085: switching CupidMatch language does not alter stored relationship data.
- QA-086: page refresh during send/accept does not corrupt state.

## Release gate
Critical release failures are: unauthorized private-data/chat access, blocked-member interaction bypass, missing/duplicate interests, one-sided connections, missing/duplicate messages, incorrect recipient, or messages lost after refresh. A production release should not be considered QA-clean while any critical scenario fails.
