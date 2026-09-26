-- Member-requested verification queue. Approval requires a separate audited server workflow.
create table if not exists public.verification_requests (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 member_note text not null default '' check (char_length(member_note) <= 1000),
 reviewer_id uuid references auth.users(id) on delete set null,
 reviewer_note text,
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 constraint reviewed_consistency check ((status='pending' and reviewer_id is null and reviewed_at is null) or (status <> 'pending' and reviewer_id is not null and reviewed_at is not null))
);
create unique index if not exists one_pending_verification_per_member on public.verification_requests(member_id) where status='pending';
create index if not exists verification_requests_status_created on public.verification_requests(status,created_at);
alter table public.verification_requests enable row level security;
revoke all on public.verification_requests from anon,authenticated;
grant select,insert on public.verification_requests to authenticated;
create policy "member can read own requests or admin can review" on public.verification_requests for select to authenticated using (member_id=(select auth.uid()) or (select public.is_admin()));
create policy "member can request own review" on public.verification_requests for insert to authenticated with check (member_id=(select auth.uid()) and status='pending' and reviewer_id is null and reviewed_at is null and reviewer_note is null);
