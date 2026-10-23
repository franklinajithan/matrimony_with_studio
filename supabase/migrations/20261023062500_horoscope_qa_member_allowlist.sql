create table if not exists public.horoscope_qa_allowlist (user_id uuid primary key references auth.users(id) on delete cascade, added_at timestamptz not null default now());
alter table public.horoscope_qa_allowlist enable row level security;
revoke all on public.horoscope_qa_allowlist from anon, authenticated, public;
create or replace function public.horoscope_qa_member_allowed() returns boolean language sql stable security definer set search_path = '' as $$ select auth.uid() is not null and exists(select 1 from public.horoscope_qa_allowlist q where q.user_id = auth.uid()) and exists(select 1 from public.profiles p where p.id = auth.uid() and p.suspended_at is null and p.deletion_requested_at is null) and private.account_session_active() $$;
revoke all on function public.horoscope_qa_member_allowed() from public, anon;
grant execute on function public.horoscope_qa_member_allowed() to authenticated;