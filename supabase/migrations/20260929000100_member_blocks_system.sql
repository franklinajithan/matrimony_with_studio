-- Member blocking system for CupidMatch
-- Allows members to block others, preventing connections, messages, and discovery

create table if not exists public.member_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  unique(blocker_id, blocked_id)
);

-- Indexes for efficient block checks
create index if not exists member_blocks_blocker_idx 
  on public.member_blocks(blocker_id);

create index if not exists member_blocks_blocked_idx 
  on public.member_blocks(blocked_id);

-- Composite index for bidirectional block checks
create index if not exists member_blocks_bidirectional_idx 
  on public.member_blocks(blocker_id, blocked_id);

-- Enable RLS
alter table public.member_blocks enable row level security;

-- Members can view their own blocks (who they blocked)
drop policy if exists "members_view_own_blocks" on public.member_blocks;
create policy "members_view_own_blocks"
  on public.member_blocks for select
  to authenticated
  using (blocker_id = auth.uid());

-- Members can create blocks (cannot block themselves)
drop policy if exists "members_create_blocks" on public.member_blocks;
create policy "members_create_blocks"
  on public.member_blocks for insert
  to authenticated
  with check (
    blocker_id = auth.uid() 
    and blocked_id <> auth.uid()
  );

-- Members can delete their own blocks (unblock)
drop policy if exists "members_delete_own_blocks" on public.member_blocks;
create policy "members_delete_own_blocks"
  on public.member_blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

-- Admins can view all blocks
drop policy if exists "admins_view_all_blocks" on public.member_blocks;
create policy "admins_view_all_blocks"
  on public.member_blocks for select
  to authenticated
  using (public.is_admin());

-- Grant permissions
revoke all on public.member_blocks from anon;
grant select, insert, delete on public.member_blocks to authenticated;

-- Function to check if a block exists between two members (either direction)
create or replace function public.is_blocked_between(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.member_blocks
    where (blocker_id = p_user_a and blocked_id = p_user_b)
       or (blocker_id = p_user_b and blocked_id = p_user_a)
  );
$$;

revoke all on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- Function to check if current user is blocked by or has blocked another member
create or replace function public.has_block_with(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_blocked_between(auth.uid(), p_other_user_id);
$$;

revoke all on function public.has_block_with(uuid) from public, anon;
grant execute on function public.has_block_with(uuid) to authenticated;

-- Trigger to prevent interactions between blocked users
-- This applies to match_requests, connections, chats, and messages
create or replace function public.reject_blocked_interactions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_a uuid;
  v_user_b uuid;
begin
  -- Determine the two users involved based on table
  if tg_table_name = 'messages' then
    -- For messages, get participants from the chat
    select participant_1, participant_2 into v_user_a, v_user_b
    from public.chats
    where id = new.chat_id;
  elsif tg_table_name = 'chats' then
    v_user_a := new.participant_1;
    v_user_b := new.participant_2;
  elsif tg_table_name = 'connections' then
    v_user_a := new.member_a_id;
    v_user_b := new.member_b_id;
  elsif tg_table_name = 'match_requests' then
    v_user_a := new.sender_id;
    v_user_b := new.receiver_id;
  else
    -- Unknown table, allow
    return new;
  end if;

  -- Check if there's a block between these users
  if public.is_blocked_between(v_user_a, v_user_b) then
    raise exception 'Cannot interact with blocked members' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Apply blocking triggers to relevant tables
drop trigger if exists block_interactions_match_requests on public.match_requests;
create trigger block_interactions_match_requests
  before insert on public.match_requests
  for each row execute function public.reject_blocked_interactions();

drop trigger if exists block_interactions_connections on public.connections;
create trigger block_interactions_connections
  before insert on public.connections
  for each row execute function public.reject_blocked_interactions();

drop trigger if exists block_interactions_chats on public.chats;
create trigger block_interactions_chats
  before insert on public.chats
  for each row execute function public.reject_blocked_interactions();

drop trigger if exists block_interactions_messages on public.messages;
create trigger block_interactions_messages
  before insert on public.messages
  for each row execute function public.reject_blocked_interactions();

-- When a block is created, remove existing connection and prevent future chat messages
create or replace function public.cleanup_blocked_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Remove the connection if it exists (in either direction)
  delete from public.connections
  where (member_a_id = new.blocker_id and member_b_id = new.blocked_id)
     or (member_a_id = new.blocked_id and member_b_id = new.blocker_id);

  -- Note: We do NOT delete the chat or messages - historical messages are preserved
  -- The triggers above will prevent new messages from being sent

  return new;
end;
$$;

drop trigger if exists cleanup_blocked_connection_trigger on public.member_blocks;
create trigger cleanup_blocked_connection_trigger
  after insert on public.member_blocks
  for each row execute function public.cleanup_blocked_connection();
