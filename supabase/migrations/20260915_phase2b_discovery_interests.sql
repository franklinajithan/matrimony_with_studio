-- Phase 2B: Discovery, shortlist, interests, connections, blocks and reports
-- Additive migration that extends existing schema for Phase 2B features

-- =============================================================================
-- 1. SHORTLIST TABLE
-- =============================================================================

create table if not exists public.shortlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shortlisted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, shortlisted_id)
);

create index if not exists shortlist_user_id_idx on public.shortlist(user_id);
create index if not exists shortlist_shortlisted_id_idx on public.shortlist(shortlisted_id);
create index if not exists shortlist_created_at_idx on public.shortlist(created_at desc);

comment on table public.shortlist is 'Private member shortlists - never visible to other members';

-- RLS for shortlist
alter table public.shortlist enable row level security;

drop policy if exists "shortlist_select_own" on public.shortlist;
create policy "shortlist_select_own"
  on public.shortlist for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "shortlist_insert_own" on public.shortlist;
create policy "shortlist_insert_own"
  on public.shortlist for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and user_id != shortlisted_id -- Cannot shortlist yourself
  );

drop policy if exists "shortlist_delete_own" on public.shortlist;
create policy "shortlist_delete_own"
  on public.shortlist for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on table public.shortlist to authenticated;

-- =============================================================================
-- 2. IMPROVE MATCH_REQUESTS (INTERESTS) TABLE
-- =============================================================================

-- Add columns if they don't exist
alter table public.match_requests
  add column if not exists message text,
  add column if not exists withdrawn_at timestamptz;

-- Add proper constraints
alter table public.match_requests
  drop constraint if exists match_requests_sender_receiver_check;
alter table public.match_requests
  add constraint match_requests_sender_receiver_check
  check (sender_id != receiver_id);

alter table public.match_requests
  drop constraint if exists match_requests_status_check;
alter table public.match_requests
  add constraint match_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'withdrawn'));

-- Add unique constraint to prevent duplicate active requests
create unique index if not exists match_requests_active_unique_idx
  on public.match_requests(sender_id, receiver_id)
  where status in ('pending', 'accepted');

create index if not exists match_requests_receiver_status_idx
  on public.match_requests(receiver_id, status, created_at desc);

create index if not exists match_requests_sender_status_idx
  on public.match_requests(sender_id, status, created_at desc);

comment on table public.match_requests is 'Interest requests between members with state machine: pending -> accepted/declined/withdrawn';

-- Update RLS policies
alter table public.match_requests enable row level security;

drop policy if exists "match_requests_select_involved" on public.match_requests;
create policy "match_requests_select_involved"
  on public.match_requests for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "match_requests_insert_as_sender" on public.match_requests;
create policy "match_requests_insert_as_sender"
  on public.match_requests for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and sender_id != receiver_id
    and status = 'pending'
  );

drop policy if exists "match_requests_update_involved" on public.match_requests;
create policy "match_requests_update_involved"
  on public.match_requests for update
  to authenticated
  using (
    sender_id = auth.uid() or receiver_id = auth.uid()
  )
  with check (
    (sender_id = auth.uid() and status = 'withdrawn')
    or (receiver_id = auth.uid() and status in ('accepted', 'declined'))
  );

grant select, insert, update on table public.match_requests to authenticated;

-- =============================================================================
-- 3. CONNECTIONS TABLE
-- =============================================================================

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  member_a_id uuid not null references auth.users(id) on delete cascade,
  member_b_id uuid not null references auth.users(id) on delete cascade,
  connected_at timestamptz not null default now(),
  created_from_request_id uuid references public.match_requests(id) on delete set null,
  check (member_a_id < member_b_id), -- Ensure consistent ordering
  unique(member_a_id, member_b_id)
);

create index if not exists connections_member_a_idx on public.connections(member_a_id, connected_at desc);
create index if not exists connections_member_b_idx on public.connections(member_b_id, connected_at desc);

comment on table public.connections is 'Accepted connections between members - created when interest is accepted';

-- RLS for connections
alter table public.connections enable row level security;

drop policy if exists "connections_select_involved" on public.connections;
create policy "connections_select_involved"
  on public.connections for select
  to authenticated
  using (member_a_id = auth.uid() or member_b_id = auth.uid());

drop policy if exists "connections_insert_involved" on public.connections;
create policy "connections_insert_involved"
  on public.connections for insert
  to authenticated
  with check (
    (member_a_id = auth.uid() or member_b_id = auth.uid())
    and member_a_id != member_b_id
    and member_a_id < member_b_id
  );

drop policy if exists "connections_delete_involved" on public.connections;
create policy "connections_delete_involved"
  on public.connections for delete
  to authenticated
  using (member_a_id = auth.uid() or member_b_id = auth.uid());

grant select, insert, delete on table public.connections to authenticated;

-- =============================================================================
-- 4. BLOCKS TABLE
-- =============================================================================

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);

create index if not exists blocks_blocker_id_idx on public.blocks(blocker_id);
create index if not exists blocks_blocked_id_idx on public.blocks(blocked_id);

comment on table public.blocks is 'Member blocks - bidirectional restriction on visibility and interaction';

-- RLS for blocks
alter table public.blocks enable row level security;

drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own"
  on public.blocks for select
  to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own"
  on public.blocks for insert
  to authenticated
  with check (
    blocker_id = auth.uid()
    and blocker_id != blocked_id
  );

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own"
  on public.blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

grant select, insert, delete on table public.blocks to authenticated;

-- =============================================================================
-- 5. REPORTS TABLE
-- =============================================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in (
    'inappropriate_content',
    'fake_profile',
    'harassment',
    'spam',
    'safety_concern',
    'other'
  )),
  description text,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(description) <= 1000)
);

create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create index if not exists reports_reported_id_idx on public.reports(reported_id);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);

comment on table public.reports is 'Member reports - stored securely, reporter identity never exposed to reported member';

-- RLS for reports
alter table public.reports enable row level security;

drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin"
  on public.reports for select
  to authenticated
  using (public.is_admin());

drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated"
  on public.reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and reporter_id != reported_id
    and status = 'pending'
  );

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
  on public.reports for update
  to authenticated
  using (public.is_admin());

grant select, insert on table public.reports to authenticated;
grant update on table public.reports to authenticated; -- Only admins can actually update via RLS

-- =============================================================================
-- 6. HELPER FUNCTIONS
-- =============================================================================

-- Check if two users are blocked (either direction)
create or replace function public.are_blocked(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from public.blocks
    where (blocker_id = user_a and blocked_id = user_b)
       or (blocker_id = user_b and blocked_id = user_a)
  );
$$;

-- Check if two users are connected
create or replace function public.are_connected(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from public.connections
    where (member_a_id = least(user_a, user_b) and member_b_id = greatest(user_a, user_b))
  );
$$;

-- Count unread interests for a user
create or replace function public.count_received_interests(user_id uuid)
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer
  from public.match_requests
  where receiver_id = user_id and status = 'pending';
$$;

-- Count connections for a user
create or replace function public.count_connections(user_id uuid)
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer
  from public.connections
  where member_a_id = user_id or member_b_id = user_id;
$$;

-- Count shortlisted profiles for a user
create or replace function public.count_shortlisted(user_id uuid)
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer
  from public.shortlist
  where user_id = user_id;
$$;

-- =============================================================================
-- 7. UPDATE DISCOVERY VIEW TO EXCLUDE BLOCKED USERS
-- =============================================================================

-- Drop and recreate discovery_profiles view with block filtering
drop view if exists public.discovery_profiles;

create or replace view public.discovery_profiles
  with (security_invoker = false)
as
select
  p.id,
  p.display_name,
  p.bio,
  case when p.photo_privacy = 'hidden' then null else p.photo_url end as photo_url,
  p.data_ai_hint,
  p.location,
  p.profession,
  p.country,
  p.region,
  p.languages,
  p.is_verified,
  case
    when p.photo_privacy in ('members', 'connections') then p.additional_photo_urls
    else '[]'::jsonb
  end as additional_photo_urls,
  public.age_from_dob(p.dob) as age_years,
  p.relationship_intentions,
  p.values_lifestyle,
  p.settlement,
  p.created_at,
  p.updated_at
from public.profiles p
where p.is_published = true
  and p.id != coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) -- Exclude self
  and not exists ( -- Exclude blocked users (either direction)
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
       or (b.blocker_id = p.id and b.blocked_id = auth.uid())
  );

revoke all on table public.discovery_profiles from anon;
revoke all on table public.discovery_profiles from public;
grant select on table public.discovery_profiles to authenticated;

notify pgrst, 'reload schema';
