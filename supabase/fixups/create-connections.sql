-- Minimal fix: create connections + shortlist tables only.
-- Run in Supabase SQL Editor if /connections shows errors.

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  member_a_id uuid not null references auth.users(id) on delete cascade,
  member_b_id uuid not null references auth.users(id) on delete cascade,
  connected_at timestamptz not null default now(),
  created_from_request_id uuid references public.match_requests(id) on delete set null,
  check (member_a_id < member_b_id),
  unique(member_a_id, member_b_id)
);

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

-- Backfill from accepted interests
insert into public.connections (member_a_id, member_b_id, created_from_request_id, connected_at)
select
  least(sender_id, receiver_id),
  greatest(sender_id, receiver_id),
  id,
  coalesce(updated_at, created_at, now())
from public.match_requests
where status = 'accepted'
on conflict (member_a_id, member_b_id) do nothing;
