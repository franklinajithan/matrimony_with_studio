create or replace function public.accept_interest_and_connect(p_request_id text)
returns table(sender_id uuid, receiver_id uuid)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sender uuid;
  v_receiver uuid;
  v_a uuid;
  v_b uuid;
begin
  select mr.sender_id, mr.receiver_id into v_sender, v_receiver
  from public.match_requests mr where mr.id = p_request_id for update;
  if v_sender is null then raise exception 'Interest request not found'; end if;
  if v_receiver <> auth.uid() then raise exception 'Only the receiver can accept this interest'; end if;
  update public.match_requests set status='accepted', updated_at=now()
  where id=p_request_id and status in ('pending','accepted');
  if not found then raise exception 'Interest request is no longer pending'; end if;
  v_a := least(v_sender,v_receiver); v_b := greatest(v_sender,v_receiver);
  insert into public.connections(member_a_id,member_b_id,created_from_request_id)
  values(v_a,v_b,p_request_id)
  on conflict(member_a_id,member_b_id) do update
  set created_from_request_id=excluded.created_from_request_id;
  return query select v_sender,v_receiver;
end;
$$;
revoke all on function public.accept_interest_and_connect(text) from public;
grant execute on function public.accept_interest_and_connect(text) to authenticated;
