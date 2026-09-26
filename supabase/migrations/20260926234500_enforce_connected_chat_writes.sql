create or replace function public.enforce_connected_chat_writes()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_a uuid;v_b uuid;
begin
 if tg_table_name='messages' then
   select participant_1,participant_2 into v_a,v_b from public.chats where id=new.chat_id;
   if v_a is null or v_b is null then raise exception 'Chat not found' using errcode='42501'; end if;
   if new.sender_id not in (v_a,v_b) then raise exception 'Sender is not a participant' using errcode='42501'; end if;
 else v_a:=new.participant_1;v_b:=new.participant_2;end if;
 if not exists(select 1 from public.connections where member_a_id=least(v_a,v_b) and member_b_id=greatest(v_a,v_b))
 then raise exception 'Active connection required for messaging' using errcode='42501';end if;
 return new;
end $$;
drop trigger if exists require_connection_for_message on public.messages;
create trigger require_connection_for_message before insert on public.messages for each row execute function public.enforce_connected_chat_writes();
drop trigger if exists require_connection_for_chat on public.chats;
create trigger require_connection_for_chat before insert on public.chats for each row execute function public.enforce_connected_chat_writes();