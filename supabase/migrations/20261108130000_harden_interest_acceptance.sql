-- Only a pending interest may create a connection. An accepted request is
-- idempotent ONLY if the canonical connection still exists. After removal,
-- it must never silently recreate a relationship without a fresh request.
-- SECURITY INVOKER preserves the existing RLS and active-session policies.
create or replace function public.accept_interest_and_connect(p_request_id text)
returns table(sender_id uuid, receiver_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_sender uuid;
  v_receiver uuid;
  v_status text;
  v_a uuid;
  v_b uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select mr.sender_id, mr.receiver_id, mr.status
    into v_sender, v_receiver, v_status
    from public.match_requests mr
   where mr.id = p_request_id
     for update;

  if v_sender is null then
    raise exception 'Interest request not found' using errcode = 'P0002';
  end if;
  if v_receiver <> auth.uid() then
    raise exception 'Only the receiver can accept this interest'
      using errcode = '42501';
  end if;

  v_a := least(v_sender, v_receiver);
  v_b := greatest(v_sender, v_receiver);

  if v_status = 'accepted' then
    -- A retry is safe only if the pair is still connected. The previously
    -- accepted request must not resurrect a deliberately removed connection.
    if not exists (
      select 1 from public.connections c
      where c.member_a_id = v_a and c.member_b_id = v_b
    ) then
      raise exception 'This connection has been removed. Send a new interest.'
        using errcode = 'P0001';
    end if;
  elsif v_status = 'pending' then
    update public.match_requests mr
       set status = 'accepted', updated_at = now()
     where mr.id = p_request_id and mr.status = 'pending';
    if not found then
      raise exception 'Interest request is no longer pending'
        using errcode = 'P0001';
    end if;

    -- DO UPDATE previously required an UPDATE privilege/policy on connections,
    -- which members do not have. DO NOTHING safely handles concurrent accepts.
    insert into public.connections (member_a_id, member_b_id, created_from_request_id)
    values (v_a, v_b, p_request_id)
    on conflict (member_a_id, member_b_id) do nothing;
  else
    raise exception 'Interest request is no longer pending'
      using errcode = 'P0001';
  end if;

  -- The chat must be committed alongside the accepted connection; relying on a
  -- later browser request can leave the members connected but unable to message.
  -- Preserve existing conversations and their unread/message history.
  insert into public.chats
    (id, participant_1, participant_2, last_message_text)
  values
    (v_a::text || '_' || v_b::text, v_a, v_b, 'You are now connected!')
  on conflict (id) do nothing;

  return query select v_sender, v_receiver;
end;
$$;

revoke all on function public.accept_interest_and_connect(text) from public, anon;
grant execute on function public.accept_interest_and_connect(text) to authenticated;
