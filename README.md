# CupidMatch

Next.js matrimony app backed by **Supabase** (PostgreSQL, Auth, and Storage).

## Setup

1. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.
2. In the Supabase SQL editor, run `supabase/schema.sql`.
3. Follow `supabase/README.md` for Auth settings and creating the first admin user.

```bash
npm install
npm run dev
```

The app runs at [http://localhost:9002](http://localhost:9002).
