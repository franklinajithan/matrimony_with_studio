-- Transactionally exercise the member workflow with synthetic account IDs.
-- Fail fast on any assertion, and roll back all fixture changes.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000b',true);
do $$
declare
  v_count integer;
begin
  perform * from public.accept_interest_and_connect('qa-request-ab');
  select count(*) into v_count from public.connections;
  if v_count <> 1 then raise exception 'accept: expected one connection, got %',v_count; end if;
  select count(*) into v_count from public.chats;
  if v_count <> 1 then raise exception 'accept: chat not provisioned atomically'; end if;
  -- Idempotent acceptance must preserve the existing chat.
  perform * from public.accept_interest_and_connect('qa-request-ab');
  select count(*) into v_count from public.chats;
  if v_count <> 1 then raise exception 'retry: duplicate chat'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000a',true);
insert into public.messages(chat_id,sender_id,text)
values ('00000000-0000-4000-8000-00000000000a_00000000-0000-4000-8000-00000000000b',
        '00000000-0000-4000-8000-00000000000a','qa-msg');
do $$
declare v_count integer;
begin
  select count(*) into v_count from public.messages;
  if v_count <> 1 then raise exception 'messaging: active participant cannot read message'; end if;
  perform public.remove_my_connection('00000000-0000-4000-8000-00000000000b');
  select count(*) into v_count from public.connections;
  if v_count <> 0 then raise exception 'removal: connection remains'; end if;
  select count(*) into v_count from public.match_requests where status='withdrawn';
  if v_count <> 1 then raise exception 'removal: accepted interest not retired'; end if;
  select count(*) into v_count from public.chats;
  if v_count <> 0 then raise exception 'removal: disconnected participant can still see chat'; end if;
  select count(*) into v_count from public.messages;
  if v_count <> 0 then raise exception 'removal: disconnected participant can still read messages'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000b',true);
do $$
declare v_failed boolean := false;
begin
  begin
    perform * from public.accept_interest_and_connect('qa-request-ab');
  exception when others then
    if sqlerrm like '%no longer pending%' then v_failed := true; else raise; end if;
  end;
  if not v_failed then raise exception 'consent: withdrawn request was accepted without new consent'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000c',true);
do $$
declare v_failed boolean := false;
begin
  begin
    perform public.remove_my_connection('00000000-0000-4000-8000-00000000000a');
  exception when others then
    if sqlerrm like '%Connection not found%' then v_failed := true; else raise; end if;
  end;
  if not v_failed then raise exception 'security: third party removed connection'; end if;
end $$;
-- Fresh mutual consent succeeds and restores access to the existing chat.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000a',true);
update public.match_requests set status='pending',updated_at=now() where id='qa-request-ab';
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-00000000000b',true);
do $$
declare v_count integer;
begin
  perform * from public.accept_interest_and_connect('qa-request-ab');
  select count(*) into v_count from public.connections;
  if v_count <> 1 then raise exception 'reconnect: pending request failed'; end if;
  select count(*) into v_count from public.chats;
  if v_count <> 1 then raise exception 'reconnect: chat was recreated or lost'; end if;
  select count(*) into v_count from public.messages;
  if v_count <> 1 then raise exception 'reconnect: existing messages not restored'; end if;
end $$;
rollback;
select 'member database integration PASS' as result;
