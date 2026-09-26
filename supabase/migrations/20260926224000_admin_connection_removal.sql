create or replace function public.admin_remove_member_connection(p_member_id uuid,p_connection_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_connection public.connections%rowtype; v_request_id text;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_reason is null or length(trim(p_reason)) not between 10 and 1000 then raise exception 'Reason must be 10-1000 characters' using errcode='22023'; end if;
 select * into v_connection from public.connections where id=p_connection_id for update;
 if not found then raise exception 'Connection not found' using errcode='P0002'; end if;
 if p_member_id not in (v_connection.member_a_id,v_connection.member_b_id) then raise exception 'Connection does not belong to member' using errcode='42501'; end if;
 v_request_id:=v_connection.created_from_request_id;
 delete from public.connections where id=p_connection_id;
 if v_request_id is not null then
  update public.match_requests set status='withdrawn',withdrawn_at=now(),updated_at=now()
   where id=v_request_id and status='accepted';
 end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),'member_connection_removed','connection',p_connection_id::text,
 jsonb_build_object('member_id',p_member_id,'other_member_id',case when v_connection.member_a_id=p_member_id then v_connection.member_b_id else v_connection.member_a_id end,'reason',trim(p_reason)));
 return jsonb_build_object('removed',true,'connection_id',p_connection_id);
end $$;
revoke all on function public.admin_remove_member_connection(uuid,uuid,text) from public,anon;
grant execute on function public.admin_remove_member_connection(uuid,uuid,text) to authenticated;