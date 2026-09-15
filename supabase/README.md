# Supabase (PostgreSQL)

This app uses **Supabase Auth**, **Postgres**, and **Storage**.

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Wait until the database is ready.

## 2. Run the schema

For a **new** project:

1. Run `schema.sql` in the SQL editor.
2. Then run `migrations/20260915_phase2a_auth_onboarding.sql`.

For the **existing** CupidMatch database, run only the Phase 2A migration. Do not drop tables.

Local helper (uses `DATABASE_URL` from `.env.local`, never commit that file):

```bash
node scripts/apply-migration.mjs
```

## 3. App environment variables

See `docs/deployment.md`. Copy `.env.example` to `.env.local`.

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:9002
```

Do not put the database password, service-role key, or secret API key in `NEXT_PUBLIC_` variables.

## 4. Auth settings

In **Authentication → Providers**, enable **Email**.

Keep **Confirm email enabled** (required for production). Local signup shows `/signup/check-email` until the user opens the confirmation link.

**URL configuration**

- Site URL: `http://localhost:9002` locally, production origin in production
- Redirect URLs must include:
  - `http://localhost:9002/auth/callback`
  - `https://YOUR_PRODUCTION_DOMAIN/auth/callback`

## 5. First admin user

Sign up in the app, confirm the email, then in the SQL editor:

```sql
update public.profiles
set is_admin = true
where email = 'you@example.com';
```
