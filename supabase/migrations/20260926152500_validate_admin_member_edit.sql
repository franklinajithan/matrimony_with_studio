create or replace function public.admin_edit_member(p_id uuid,p_name text,p_location text,p_profession text,p_bio text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_name is null or length(trim(p_name)) not between 1 and 100 or
 p_location is null or length(p_location)>150 or
 p_profession is null or length(p_profession)>150 or
 p_bio is null or length(p_bio)>3000 then
 raise exception 'Invalid profile fields' using errcode='22023'; end if;
 update public.profiles set display_name=trim(p_name),location=p_location,profession=p_profession,bio=p_bio where id=p_id;
 if not found then raise exception 'Member not found' using errcode='P0002'; end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),'member_profile_edited','profile',p_id::text,
 jsonb_build_object('changed_fields',jsonb_build_array('display_name','location','profession','bio')));
end $$;