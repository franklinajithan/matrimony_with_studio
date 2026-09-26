create or replace function public.admin_edit_member(p_id uuid,p_name text,p_location text,p_profession text,p_bio text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 update public.profiles set display_name=p_name,location=p_location,profession=p_profession,bio=p_bio where id=p_id;
 if not found then raise exception 'Member not found'; end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id)
 values(auth.uid(),'member_profile_edited','profile',p_id::text);
end $$;
revoke execute on function public.admin_edit_member(uuid,text,text,text,text) from public,anon;
grant execute on function public.admin_edit_member(uuid,text,text,text,text) to authenticated;