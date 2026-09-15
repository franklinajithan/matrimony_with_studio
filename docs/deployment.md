# CupidMatch environment and deployment

This repository uses **Supabase Auth + Postgres + Storage**. Do not add Firebase keys. Do not commit `.env.local`.

## Variables used by this repository

| Name | Where it is read | Client-visible | Required |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase/env.ts` | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `src/lib/supabase/env.ts` (preferred) | Yes | Yes (or anon key) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fallback if publishable key is unset | Yes | Yes if publishable key is unset |
| `NEXT_PUBLIC_SITE_URL` | Auth redirect origin on the server | Yes | Recommended in production |
| `DATABASE_URL` | Local SQL scripts only (`scripts/apply-migration.mjs`) | **No** | Local schema work only |

The app **does not** use a service-role/secret key. Do not add `SUPABASE_SERVICE_ROLE_KEY` to Vercel.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill in the project URL and publishable key.
3. Apply additive SQL if it has not been applied:

```bash
node scripts/apply-migration.mjs
```

4. Restart `npm run dev` (port **9002**).

## Supabase Auth allowlist

Keep **Confirm email enabled** for production.

Authentication → URL configuration:

- Site URL: production origin, e.g. `https://your-domain.vercel.app`
- Redirect allow list:
  - `http://localhost:9002/auth/callback`
  - `http://localhost:9002/**` (local recovery/confirm links)
  - `https://YOUR_PRODUCTION_DOMAIN/auth/callback`
  - `https://YOUR_PRODUCTION_DOMAIN/**`
  - `https://*-YOUR_VERCEL_TEAM.vercel.app/auth/callback` (preview, if used)

Email templates should send users to `/auth/callback` (PKCE `code`) or `/auth/callback?token_hash=...&type=...`.

## Vercel Production and Preview

Set these on **both Production and Preview** (Settings → Environment Variables), then redeploy. This task does not deploy.

| Variable | Production | Preview | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Required | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Required | Required | `sb_publishable_...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional duplicate | Optional | Same value as publishable key if you want both names |
| `NEXT_PUBLIC_SITE_URL` | Required | Optional per preview URL | Production origin with no trailing slash |
| `DATABASE_URL` | Do not set | Do not set | Contains the database password |
| Service role / secret keys | Do not set | Do not set | Not used by the app |

This repository was not assumed to have Vercel env vars configured. Add them in the dashboard if they are missing, then trigger a new deployment.

## Auth callback paths

- Signup confirmation: `/auth/callback?next=/onboarding`
- Password recovery: `/auth/callback?next=/reset-password`
- Expired/invalid links land on `/login?error=expired_link` or `/login?error=invalid_link`
