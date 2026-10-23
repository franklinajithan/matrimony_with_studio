-- Guard OLD references by both table and operation; INSERT triggers have no OLD row.
create or replace function public.reject_suspended_social_writes()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_a uuid; v_b uuid;
begin
  if current_setting('role',true) in ('service_role','postgres','none','supabase_auth_admin') then return new; end if;
  if tg_table_name = 'chats' then
    if tg_op = 'UPDATE' then
      if (old.participant_1 is null or old.participant_2 is null)
         and (to_jsonb(new)-'unread_by')=(to_jsonb(old)-'unread_by') then
        return new;
      end if;
    end if;
  end if;
  if tg_table_name='messages' then
    select participant_1,participant_2 into v_a,v_b from public.chats where id=new.chat_id;
  elsif tg_table_name='chats' then
    v_a:=new.participant_1; v_b:=new.participant_2;
  elsif tg_table_name='connections' then
    v_a:=new.member_a_id; v_b:=new.member_b_id;
  else
    v_a:=new.sender_id; v_b:=new.receiver_id;
  end if;
  if not coalesce(public.member_is_active(v_a),false) or not coalesce(public.member_is_active(v_b),false) then
    raise exception 'Interaction unavailable for suspended accounts' using errcode='42501';
  end if;
  return new;
end
$$;