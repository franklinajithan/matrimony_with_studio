alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspension_reason text;
create or replace function public.enforce_profile_suspension_fields() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.suspended_at is distinct from old.suspended_at or new.suspension_reason is distinct from old.suspension_reason) and current_user not in ('postgres','service_role','supabase_admin') then
 raise exception 'Suspension status can only be changed through administration' using errcode='42501'; end if;
 return new;
end $$;
drop trigger if exists protect_profile_suspension on public.profiles;
create trigger protect_profile_suspension before update on public.profiles for each row execute function public.enforce_profile_suspension_fields();
create or replace function public.admin_set_member_suspension(p_member_id uuid,p_suspend boolean,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_was_suspended boolean; v_is_admin boolean;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_reason is null or length(trim(p_reason)) not between 10 and 1000 then raise exception 'Reason must be 10-1000 characters' using errcode='22023'; end if;
 select suspended_at is not null,coalesce(is_admin,false) into v_was_suspended,v_is_admin from public.profiles where id=p_member_id for update;
 if not found then raise exception 'Member not found' using errcode='P0002'; end if;
 if v_is_admin then raise exception 'Administrator accounts require separate controls' using errcode='42501'; end if;
 if v_was_suspended=p_suspend then return jsonb_build_object('changed',false,'suspended',p_suspend); end if;
 update public.profiles set suspended_at=case when p_suspend then now() else null end,suspension_reason=case when p_suspend then trim(p_reason) else null end where id=p_member_id;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),case when p_suspend then 'member_suspended' else 'member_restored' end,'profile',p_member_id::text,jsonb_build_object('reason',trim(p_reason)));
 return jsonb_build_object('changed',true,'suspended',p_suspend);
end $$;
revoke all on function public.admin_set_member_suspension(uuid,boolean,text) from public,anon;
grant execute on function public.admin_set_member_suspension(uuid,boolean,text) to authenticated;
create or replace function public.member_is_active(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=p_id and suspended_at is null)
$$;
revoke all on function public.member_is_active(uuid) from public,anon;
grant execute on function public.member_is_active(uuid) to authenticated;
create or replace function public.reject_suspended_social_writes() returns trigger language plpgsql security definer set search_path='' as $$
declare v_a uuid;v_b uuid;
begin
 if tg_table_name='messages' then
  select participant_1,participant_2 into v_a,v_b from public.chats where id=new.chat_id;
 elsif tg_table_name='chats' then v_a:=new.participant_1;v_b:=new.participant_2;
 elsif tg_table_name='connections' then v_a:=new.member_a_id;v_b:=new.member_b_id;
 else v_a:=new.sender_id;v_b:=new.receiver_id;end if;
 if not coalesce(public.member_is_active(v_a),false) or not coalesce(public.member_is_active(v_b),false) then
  raise exception 'Interaction unavailable for suspended accounts' using errcode='42501';
 end if;
 return new;
end $$;
drop trigger if exists block_suspended_messages on public.messages;
create trigger block_suspended_messages before insert or update on public.messages for each row execute function public.reject_suspended_social_writes();
drop trigger if exists block_suspended_chats on public.chats;
create trigger block_suspended_chats before insert or update on public.chats for each row execute function public.reject_suspended_social_writes();
drop trigger if exists block_suspended_connections on public.connections;
create trigger block_suspended_connections before insert or update on public.connections for each row execute function public.reject_suspended_social_writes();
drop trigger if exists block_suspended_match_requests on public.match_requests;
create trigger block_suspended_match_requests before insert or update on public.match_requests for each row execute function public.reject_suspended_social_writes();