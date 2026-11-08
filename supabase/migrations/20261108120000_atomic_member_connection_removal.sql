-- Remove a member relationship and its accepted status as one transaction.
-- Existing orphaned accepted requests are deliberately not repaired here: a prior
-- removal must never be reversed without renewed consent.
create or replace function public.remove_my_connection(p_other_member_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_connection_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_other_member_id is null or p_other_member_id = v_actor then
    raise exception 'Invalid connection member' using errcode = '22023';
  end if;

  select c.id into v_connection_id
  from public.connections c
  where c.member_a_id = least(v_actor, p_other_member_id)
    and c.member_b_id = greatest(v_actor, p_other_member_id)
  for update;

  if v_connection_id is null then
    raise exception 'Connection not found' using errcode = 'P0002';
  end if;

  delete from public.connections c where c.id = v_connection_id;

  -- Clear BOTH directional requests so stale accepted records cannot be
  -- counted as live connections or prevent a new consent cycle.
  update public.match_requests mr
  set status = 'withdrawn',
      withdrawn_at = now(),
      updated_at = now()
  where mr.status = 'accepted'
    and (
      (mr.sender_id = v_actor and mr.receiver_id = p_other_member_id)
      or
      (mr.sender_id = p_other_member_id and mr.receiver_id = v_actor)
    );

  return true;
end;
$$;

revoke all on function public.remove_my_connection(uuid) from public, anon;
grant execute on function public.remove_my_connection(uuid) to authenticated;
