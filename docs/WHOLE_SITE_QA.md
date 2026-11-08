# CupidMatch whole-site acceptance tests

Use a fresh browser session for each role. Record the target URL, build commit, browser, case ID, expected result, actual result and Pass, Fail or Blocked. Attach screenshots or traces to failures after removing test credentials, verification links and member data.

## Run the automated checks

Install Node.js 22 or newer and run these commands from the repository root.

```bash
npm ci
npx playwright install chromium
```

The public HTTP suite is read-only and requires no browser installation or account. Run it against production with:

```bash
PLAYWRIGHT_BASE_URL=https://cupidmatch.co.uk npx playwright test e2e/whole-site.spec.ts --project=chromium --grep 'Public HTTP smoke'
```

Use an isolated preview connected to a QA database for the full suite. Set the following environment variables locally or in your CI secret store before running. Keep credentials out of commits, terminal history and reports.

| Variable | Value |
|---|---|
| `PLAYWRIGHT_BASE_URL` | Isolated CupidMatch preview URL |
| `QA_USER_A_EMAIL`, `QA_USER_A_PASSWORD` | Dedicated published Free member A |
| `QA_USER_B_EMAIL`, `QA_USER_B_PASSWORD` | Dedicated published Free member B, discoverable by A |
| `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD` | Dedicated administrator in the QA database |

The discovery tests in `member-journey.spec.ts` also expect the repository's seeded discovery fixtures. See [the existing E2E setup](E2E_QA.md) and [the two-member scenario catalogue](QA_SCENARIO_CATALOGUE.md). Reset A and B's connection, interests and quotas before runs intended to exercise first-time behaviour. Use fresh accounts for registration and offer eligibility.

```bash
npm run test:e2e -- --workers=1
npx playwright show-report
npm run test:signup
npm run test:admin
npm run test:payments
node --test scripts/visitor-activity.test.mjs
```

Run the desktop and mobile Playwright projects separately if they share accounts. Reset the fixtures between projects. Playwright's mobile Chromium project is an emulation. Repeat critical flows on physical iPhone Safari and Android before sign-off. Admin navigation smoke opens each admin area and tests the overview refresh button. Admin write cases below require a QA database and disposable fixtures.

## Member and visitor scenarios

| ID | Buttons or actions | Expected result |
|---|---|---|
| PUB-01 | Home logo, header links, mobile menu open/close, footer links, language selector | Correct route opens, menu closes on navigation, language persists after refresh, focus stays usable by keyboard. |
| PUB-02 | Home calls to action, pricing plans, country and term controls | Visitors reach the correct signup or login destination. Pricing changes only for supported options. |
| PUB-03 | Guide cards, related links, contact and safety links | Each link opens its intended page. Public pages appear in the sitemap and private areas stay out. Verify indexing separately in Search Console. |
| AUTH-01 | Create account, password visibility buttons, age and terms checkboxes | Invalid email, weak or mismatched password, missing terms and underage signup show field errors. Valid signup opens email confirmation. |
| AUTH-02 | Resend confirmation, change email, confirmation link, login, logout | Resend throttles, confirmation works once, verified account signs in, logout clears protected access. |
| AUTH-03 | Google sign-in, cancel at Google, return to CupidMatch | Success establishes the expected member session. Cancellation returns a usable login page. Repeat for any other visible OAuth provider. |
| AUTH-04 | Forgot password, reset link, submit new password | QA inbox receives a reset message, the new password works, the old password fails, and an expired link is handled. |
| ONB-01 | Continue, Back, Save and exit, skip optional fields, publish | Required fields are enforced. Draft survives reload. Invalid steps stay open with errors. Publish requires review confirmation and opens the dashboard. |
| ONB-02 | Upload, replace and remove primary/gallery photos, change photo privacy | Valid images save. Oversized or unsupported images show an error. Guest, unconnected and connected roles see only the allowed photos. |
| MEM-01 | Dashboard cards, notifications, tabs, profile menu, profile edit and save | Navigation opens the intended feature. Changes and read state persist. Cancel discards unsaved changes. |
| MEM-02 | Discover filter open/apply/clear, gender/country/age, open profile, shortlist toggle | A known matching fixture appears and excluded fixtures disappear. Clearing restores results. Shortlist state persists across refresh. |
| MEM-03 | Send, withdraw, decline and accept interests; open/remove connection | A and B see consistent states. Duplicate requests/connections are rejected or reused. An unrelated member cannot access them. |
| MEM-04 | Open chat, send, reply, mark read, refresh | Both accounts receive the exact text, in order, with correct unread counts. Empty messages cannot be sent. An unrelated member cannot read the thread. |
| MEM-05 | Block, unblock, report, privacy switches, share/revoke profile link | Restrictions apply for both sides. Reports reach the correct queue. Expired or revoked links fail. |
| MEM-06 | Biodata edit/export/share, horoscope upload/edit/compare, verification request | Saved data reloads. Export opens. Private uploads stay private. Empty, invalid and missing-permission cases show clear errors. |
| SUP-01 | New enquiry, category, submit, open thread, reply | Member sees the saved thread. Admin can reply and the member sees the reply in that thread. A different member cannot read it. |
| SUP-02 | Guest enquiry with invalid then valid email, admin Reply by email | Invalid address is rejected. Valid enquiry arrives in admin. Verify the actual reply in the test inbox after sending from the configured mail client. |
| ANA-01 | Footer Analytics settings, Allow and Decline, reload | No floating prompt. Collection occurs only after opt-in and stops after decline. Confirm the synthetic visit appears in admin. |
| PAY-01 | Choose Free, Plus or Premium, select available price, start/cancel checkout | Checkout uses the displayed supported plan, currency and price. Cancellation returns to membership and leaves entitlement unchanged. |
| PAY-02 | Complete sandbox payment, simulate failure and webhook replay | Successful payment grants the correct entitlement once. Failed or unsigned events grant nothing. Replay never creates a second subscription. |
| PAY-03 | Activate trial, manage subscription, cancel and reload | Eligible member receives the configured trial once. Plan limits and expiry apply. Cancellation preserves any remaining paid access according to policy. |

## Admin scenarios

Run changes against a dedicated QA environment with disposable records. Check Cancel first, then confirm the mutation, refresh to verify persistence, check the audit entry where applicable, and restore the fixture. For controls that open a modal, check Escape, focus return, and the disabled/pending state while saving.

| ID | Admin area and actions | Expected result |
|---|---|---|
| ADM-01 | Overview Refresh, Manage members, Review requests, all navigation tabs and Main site | Counts and links work. Admin sees workspace; guest goes to login and regular member returns to dashboard. |
| ADM-02 | Members search, filter, pagination, edit, save, suspend, restore, permanent delete | Correct member is selected. Changes persist. Deletion requires matching confirmation and rejects protected accounts. |
| ADM-03 | Verification queue filters, open evidence, approve and reject | Evidence is admin-only. Decision reaches the member. Repeating a completed decision is handled. |
| ADM-04 | Registration pause/reopen, submit a fresh signup | Signup reflects the latest setting even from an already-open form. Existing sign-in works while registration is paused. |
| ADM-05 | Feedback tabs, open enquiry, reply, Reply by email, mark guest handled | Correct thread and unread/awaiting status update. Member reply displays in app. Guest receives email via the admin's mail client. |
| ADM-06 | Analytics date/source/country/browser filters, visit detail and pagination | Synthetic opted-in traffic appears with accurate attribution. Declined traffic and account identifiers are absent. |
| ADM-07 | Plans, country pricing, plan entitlements, edit/save/cancel | Updated values persist and appear in the matching market. Invalid prices are rejected. Verify the price actually used by checkout separately. |
| ADM-08 | Subscriptions, Payments, provider controls, filters and details | Correct ledger and plan data appear. Only admins can change allowed settings. Use sandbox transactions for activation, refund and cancellation checks. |
| ADM-09 | Promo Codes create, edit, disable and redeem | Only eligible test members redeem active codes. Expired, invalid and already-used codes show the expected outcome. |
| ADM-10 | Stories publish/unpublish, horoscope access or moderation, security audit filters/pagination | Visibility changes persist, private information stays restricted, and audit paging and date filters preserve matching events. |

Add a case for any visible control or route introduced by a release. Mark inaccessible or unconfigured features **Blocked** and record the missing prerequisite. Never mark a scenario passed based only on the page opening.
