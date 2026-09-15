# Supabase (PostgreSQL)

This app uses **Supabase Auth**, **Postgres**, and **Storage** instead of Firebase.

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Wait until the database is ready.

## 2. Run the schema

In the Supabase dashboard open **SQL Editor**, paste the contents of `schema.sql`, and run it.

That creates tables, indexes, row-level security, realtime publication, and a public `media` storage bucket.

## 3. App environment variables

Copy `.env.example` to `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Find both values under **Project Settings → API**.

## 4. Auth settings

In **Authentication → Providers**, enable **Email**.

Optional but recommended:

- Turn off “Confirm email” while developing so signup can continue immediately.
- Set **Site URL** to `http://localhost:9002` (this app’s Next.js port) and add your production URL.

## 5. First admin user

Sign up in the app, then in the SQL editor:

```sql
update public.profiles
set is_admin = true
where email = 'you@example.com';
```

## 6. Existing Firebase data

This is a new database. Firestore documents and Firebase Storage files are not migrated automatically. Recreate accounts (or import users) and re-upload photos after switching.
