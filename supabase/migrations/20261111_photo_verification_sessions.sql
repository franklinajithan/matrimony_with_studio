-- Face-verification sessions. Apply before enabling PHOTO_VERIFICATION_ENABLED.
-- A provider liveness pass ALONE does not match the member's uploaded primary photo.
-- Never update profiles.is_verified from this table without server-side primary-photo matching.
create table if not exists public.photo_verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider = 'didit'),
  provider_session_id text not null unique,
  primary_photo_url text not null,
  status text not null default 'pending'
    check (status in ('pending','review','failed','passed_liveness','expired','cancelled')),
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists photo_verification_sessions_user_created
  on public.photo_verification_sessions(user_id, created_at desc);
alter table public.photo_verification_sessions enable row level security;
revoke all on public.photo_verification_sessions from anon;
-- Members may see their own status, but only trusted server code may create or update sessions.
create policy "Members read own photo verification sessions"
  on public.photo_verification_sessions for select to authenticated
  using (auth.uid() = user_id);
-- No user update/delete policy: provider verdicts and badges require privileged server logic.

-- Prevent forged vendor session IDs and biometric states via direct browser writes.
revoke insert, update, delete on public.photo_verification_sessions from authenticated;
grant select on public.photo_verification_sessions to authenticated;
