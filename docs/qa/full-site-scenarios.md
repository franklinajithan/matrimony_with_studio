# CupidMatch – Full Site End-to-End QA Matrix

This is a test *plan*, not evidence that tests have passed.

## Test design
Test roles: guest, unverified, Free, Plus, Premium, suspended, non-admin, admin. Run at desktop, mobile, keyboard-only and WebKit (Safari). For **every button, icon, link, checkbox, dropdown, tab, form, modal** inventory the accessible name, path, role, before/after state, backend request, cancel/error path, and persistence after reload.

| ID | Area | Scenario | Expected outcome | Status |
|---|---|---|---|---|
| CM-001 | Public website | Homepage CTAs and navigation | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-002 | Public website | Header and footer links | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-003 | Public website | Mobile navigation | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-004 | Public website | Contact, terms, privacy, accessibility | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-005 | Public website | Public SEO metadata and sitemap | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-006 | Public website | Visitor feedback and form validation | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-007 | Public website | Cookie and analytics behavior | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-008 | Public website | 404 and redirects | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-009 | Registration and auth | Email registration success/invalid/duplicate | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-010 | Registration and auth | Email confirmation and expired token | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-011 | Registration and auth | Google OAuth signup, login, cancel | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-012 | Registration and auth | Login, logout, wrong password | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-013 | Registration and auth | Forgot/reset password | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-014 | Registration and auth | Authentication rate limits and session expiry | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-015 | Registration and auth | Unverified account restrictions | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-016 | Onboarding and profiles | Required marriage-focused questions | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-017 | Onboarding and profiles | Optional fields and resume | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-018 | Onboarding and profiles | Gender selection and persistence | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-019 | Onboarding and profiles | Country, region, city edits | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-020 | Onboarding and profiles | Photo upload, crop, delete | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-021 | Onboarding and profiles | Privacy and profile visibility | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-022 | Onboarding and profiles | Horoscope fields and uploaded files | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-023 | Onboarding and profiles | Biodata and PDF | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-024 | Onboarding and profiles | Deactivate and delete account | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-025 | Discovery and interaction | Gender and location filters | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-026 | Discovery and interaction | Age filters and pagination | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-027 | Discovery and interaction | Profile view limits | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-028 | Discovery and interaction | Shortlist add and remove | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-029 | Discovery and interaction | Interest send, accept, decline | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-030 | Discovery and interaction | Duplicate interest blocking | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-031 | Discovery and interaction | Messaging permissions and read receipts | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-032 | Discovery and interaction | Notifications and unread counts | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-033 | Discovery and interaction | Block and report users | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-034 | Membership and payments | Post-registration plan choice | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-035 | Membership and payments | Free 2 request/message limits | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-036 | Membership and payments | Plus 30 request/message limits | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-037 | Membership and payments | Premium unlimited limits | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-038 | Membership and payments | Free 50 views, Plus 400 views | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-039 | Membership and payments | Plus top-20 and Premium top-10 placement | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-040 | Membership and payments | Monthly limit reset | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-041 | Membership and payments | UK and country-specific price | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-042 | Membership and payments | Admin plan configuration | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-043 | Membership and payments | Card UI and checkout sandbox | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-044 | Membership and payments | Success, decline, cancel and retry | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-045 | Membership and payments | Webhook idempotency | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-046 | Membership and payments | Billing audit and refunds | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-047 | Feedback and enquiries | Visitor enquiry email validation | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-048 | Feedback and enquiries | Member new enquiry | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-049 | Feedback and enquiries | Separate multiple enquiries | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-050 | Feedback and enquiries | Admin receives enquiry | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-051 | Feedback and enquiries | Admin reply and member thread | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-052 | Feedback and enquiries | Nonmember email reply | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-053 | Feedback and enquiries | Close, reopen and unread status | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-054 | Feedback and enquiries | Access control for other users' tickets | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-055 | Admin panel | Admin-only route and API protection | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-056 | Admin panel | Admin navigation/menu/button audit | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-057 | Admin panel | Dashboard accurate counts | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-058 | Admin panel | Member search and filters | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-059 | Admin panel | View/edit/suspend/delete member | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-060 | Admin panel | Moderation controls | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-061 | Admin panel | Enquiry list, open, reply | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-062 | Admin panel | Plan and country pricing edits | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-063 | Admin panel | Payments and refunds visibility | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-064 | Admin panel | Country, device and browser analytics | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-065 | Admin panel | Visit sessions, page clicks, durations | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-066 | Admin panel | Date filters, export and timezone | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-067 | Admin panel | Audit log pagination and permissions | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-068 | Admin panel | Admin confirmation dialogs and errors | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-069 | Security and quality | Server-side role and quota enforcement | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-070 | Security and quality | Cross-account direct URL/API denial | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-071 | Security and quality | XSS, CSRF, upload validation | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-072 | Security and quality | Rate limits and secrets | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-073 | Security and quality | Accessibility keyboard, labels, focus | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-074 | Security and quality | iPhone Safari and Android Chrome | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-075 | Security and quality | Network errors and loading states | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-076 | Security and quality | Performance and pagination | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-077 | Security and quality | Database migrations and backup recovery | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |
| CM-078 | Security and quality | Console errors, responsive overflow | Verify click/validation, expected API authorization, saved state, and mobile behavior | Not run |

## Full-cycle scripted journeys
1. Guest visits home → navigates information pages → sends feedback → admin receives and replies to email.
2. User registers with email → verifies → completes marriage-oriented onboarding → uploads photo → edits profile → selects membership.
3. Second user registers with Google → fills preferences → searches → views profile → sends interest → first user accepts → conversation begins.
4. Free tier reaches usage limits → blocked at client and API → Plus upgrade in **sandbox** → permissions updated → Premium upgrade and country pricing checked.
5. Member raises multiple support enquiries → admin replies separately → member sees correct conversation history.
6. Admin signs in → dashboard and audit checks → search/suspend/reactivate disposable member → adjust test catalogue → restore values → review test payments.
7. Member deactivates then reactivates where supported; disposable member deletes account; verify storage/data deletion behavior.
8. Attack simulation: guest/member access admin URL/API, member accesses another member's ticket/message, forged webhook and duplicate transactions.

## Safety
Use isolated staging Supabase database, test users, test email inboxes and sandbox payment keys. Do not run registration, deletions, admin edits, messages or payments on production. A **read-only production smoke test** is allowed; no real card charging.

## Run existing repository tests
```bash
npm ci
npx playwright install --with-deps chromium
npm run typecheck
npm run lint
npm run test:signup
npm run test:admin
npm run test:payments
npm run test:e2e
npx playwright show-report
```

To run only the added safe production smoke suite:
```bash
PLAYWRIGHT_BASE_URL=https://cupidmatch.co.uk npx playwright test e2e/public-site-smoke.spec.ts --project=chromium
```

## Reporting and release gate
Record pass/fail/skipped for each ID, device, role, screenshot/trace, root cause, issue link and verified deployment SHA. P0/P1 open failures must be zero before production release. Sensitive journeys require independent server-side tests; a green browser UI alone does not prove authorization.

Total: 78 initial named scenario groups. Split each into detailed positive, negative, validation, mobile, API, and permission test cases during automation.
