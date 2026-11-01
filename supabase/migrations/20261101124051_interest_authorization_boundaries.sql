-- Review/staging proposal: no member data is rewritten or deleted.
-- Keep account_live_session and existing activity/block/quota triggers intact.
create or replace function public.guard_member_interest_write()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_actor uuid := auth.uid();
begin
  -- Trusted maintenance and SECURITY DEFINER admin routines retain their path.
  -- Never use user-editable JWT metadata or a client-settable bypass flag.
  if current_user in ('postgres', 'supabase_admin', 'service_role') then return new; end if;
  if v_actor is null then raise exception 'Sign in to manage interests' using errcode='42501'; end if;
  if tg_op = 'INSERT' then
    if new.sender_id <> v_actor or new.sender_id = new.receiver_id
      or new.status <> 'pending' or new.withdrawn_at is not null then
      raise exception 'Only a pending interest from the sender is allowed' using errcode='42501';
    end if;
    return new;
  end if;
  if new.id is distinct from old.id or new.sender_id is distinct from old.sender_id
    or new.receiver_id is distinct from old.receiver_id or new.created_at is distinct from old.created_at then
    raise exception 'Interest participants and identity cannot change' using errcode='42501';
  end if;
  if v_actor not in (old.sender_id, old.receiver_id) then
    raise exception 'Interest unavailable' using errcode='42501';
  end if;
  -- Harmless retries, including an already accepted RPC, may refresh updated_at.
  if (to_jsonb(new) - 'updated_at') = (to_jsonb(old) - 'updated_at') then return new; end if;
  if old.status = 'pending' and new.message is not distinct from old.message then
    if v_actor = old.sender_id and new.status = 'withdrawn' and new.withdrawn_at is not null then return new; end if;
    if v_actor = old.receiver_id and new.status in ('accepted','declined')
      and new.withdrawn_at is not distinct from old.withdrawn_at then return new; end if;
  end if;
  if v_actor = old.sender_id and new.status = 'pending' and new.withdrawn_at is null
    and (old.status in ('declined','withdrawn','declined_by_sender','declined_by_receiver')
      or (old.status = 'accepted' and not exists (
        select 1 from public.connections c
        where c.member_a_id = least(old.sender_id,old.receiver_id)
          and c.member_b_id = greatest(old.sender_id,old.receiver_id)
      ))) then return new; end if;
  raise exception 'This interest transition is not allowed' using errcode='42501';
end $$;
revoke all on function public.guard_member_interest_write() from public, anon, authenticated;
drop trigger if exists guard_member_interest_write on public.match_requests;
create trigger guard_member_interest_write before insert or update on public.match_requests
for each row execute function public.guard_member_interest_write();

-- Restrictive policies remain effective even if a legacy permissive policy
-- exists. Transition/immutable-column validation belongs in the trigger above.
drop policy if exists interest_sender_insert_guard on public.match_requests;
create policy interest_sender_insert_guard on public.match_requests as restrictive for insert to authenticated
with check (sender_id = (select auth.uid()) and sender_id <> receiver_id and status = 'pending');
drop policy if exists interest_participant_update_guard on public.match_requests;
create policy interest_participant_update_guard on public.match_requests as restrictive for update to authenticated
using ((select auth.uid()) in (sender_id,receiver_id))
with check ((select auth.uid()) in (sender_id,receiver_id));
-- Replace the two known competing update rules with one rule compatible with
-- sender resends. The trigger independently validates OLD -> NEW transitions.
drop policy if exists match_requests_update_involved on public.match_requests;
drop policy if exists match_requests_update_participants on public.match_requests;
create policy match_requests_update_involved on public.match_requests for update to authenticated
using ((select auth.uid()) in (sender_id,receiver_id))
with check ((select auth.uid()) in (sender_id,receiver_id));
drop policy if exists interest_sender_delete_guard on public.match_requests;
create policy interest_sender_delete_guard on public.match_requests as restrictive for delete to authenticated
using (sender_id = (select auth.uid()) and status = 'pending');

-- A connection requires consent from the request's actual receiver. Merely
-- being one of the two members is not sufficient to create a connection.
drop policy if exists connection_consent_insert_guard on public.connections;
create policy connection_consent_insert_guard on public.connections as restrictive for insert to authenticated
with check (member_a_id < member_b_id and exists (
  select 1 from public.match_requests mr where mr.id = created_from_request_id
    and mr.status = 'accepted' and mr.receiver_id = (select auth.uid())
    and least(mr.sender_id,mr.receiver_id) = member_a_id
    and greatest(mr.sender_id,mr.receiver_id) = member_b_id
));
drop policy if exists connection_client_update_guard on public.connections;
create policy connection_client_update_guard on public.connections as restrictive for update to authenticated
using (false) with check (false);

-- Preserve invoker RLS and make repeat acceptance idempotent without granting
-- clients UPDATE access to existing connections or replacing their provenance.
create or replace function public.accept_interest_and_connect(p_request_id text)
returns table(sender_id uuid, receiver_id uuid)
language plpgsql security invoker set search_path = '' as $$
declare v_sender uuid; v_receiver uuid;
begin
  select mr.sender_id,mr.receiver_id into v_sender,v_receiver
    from public.match_requests mr where mr.id=p_request_id for update;
  if v_sender is null then raise exception 'Interest request not found'; end if;
  if v_receiver <> auth.uid() then raise exception 'Only the receiver can accept this interest' using errcode='42501'; end if;
  update public.match_requests set status='accepted',updated_at=now()
    where id=p_request_id and status in ('pending','accepted');
  if not found then raise exception 'Interest request is no longer pending'; end if;
  insert into public.connections(member_a_id,member_b_id,created_from_request_id)
    values(least(v_sender,v_receiver),greatest(v_sender,v_receiver),p_request_id)
    on conflict(member_a_id,member_b_id) do nothing;
  return query select v_sender,v_receiver;
end $$;
revoke all on function public.accept_interest_and_connect(text) from public,anon;
grant execute on function public.accept_interest_and_connect(text) to authenticated;
