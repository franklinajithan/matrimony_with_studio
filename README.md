# CupidMatch

Next.js matrimony app backed by **Supabase** (PostgreSQL, Auth, and Storage).

## Setup

1. Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable key.
2. Apply `supabase/schema.sql` on a new project, then `supabase/migrations/20260915_phase2a_auth_onboarding.sql`.
3. Follow `supabase/README.md` and `docs/deployment.md` for Auth redirect URLs and Vercel env vars.
4. Keep email confirmation enabled.

```bash
npm install
npm run dev
```

The app runs at [http://localhost:9002](http://localhost:9002).

## Scripts

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Authorization against a live project (uses `.env.local`, does not print secrets):

```bash
npm run test:authz
```
