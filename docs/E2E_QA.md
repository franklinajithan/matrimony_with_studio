# CupidMatch end-to-end QA

Playwright tests real member journeys in separate browser sessions.

## Current coverage
- Anonymous visitors cannot open Dashboard, Interests, Connections or Messages.
- Two independent members can sign in.
- Connected QA members can exchange messages in both directions.
- A message sent by A becomes visible to B and vice versa.
- Messages remain visible after both browsers refresh.
- Desktop Chrome is the CI target; a mobile Chrome project is available locally.

## One-time GitHub setup
Create two dedicated, confirmed CupidMatch test members in the Supabase environment used by QA. Publish their profiles and connect them once.

Repository **Secrets**:
- `QA_USER_A_EMAIL`
- `QA_USER_A_PASSWORD`
- `QA_USER_B_EMAIL`
- `QA_USER_B_PASSWORD`

Repository **Variable**:
- `QA_BASE_URL` — use a stable QA/staging deployment URL, not a per-commit preview URL.

The scheduled workflow runs daily and can also be started manually from GitHub Actions. It deliberately does not run against production until `QA_BASE_URL` is configured.

## Local
```bash
npm install
npx playwright install chromium
QA_USER_A_EMAIL=... QA_USER_A_PASSWORD=... QA_USER_B_EMAIL=... QA_USER_B_PASSWORD=... PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

Never use real member credentials for automated QA.
