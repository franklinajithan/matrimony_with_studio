create or replace function public.admin_edit_member_extended(p_id uuid,p_fields jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_allowed text[]:=array['height','religion','caste','language','hobbies','favorite_movies','favorite_music','education_level','smoking_habits','drinking_habits','country','region']; v_key text; v_value jsonb; v_before jsonb; v_changes jsonb:='{}'::jsonb;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_fields is null or jsonb_typeof(p_fields)<>'object' or p_fields='{}'::jsonb then raise exception 'Invalid fields' using errcode='22023'; end if;
 for v_key,v_value in select key,value from jsonb_each(p_fields) loop
  if not v_key=any(v_allowed) or jsonb_typeof(v_value)<>'string' or length(v_value #>> '{}')>500 then raise exception 'Invalid field' using errcode='22023'; end if;
 end loop;
 select to_jsonb(p) into v_before from public.profiles p where id=p_id for update;
 if v_before is null then raise exception 'Member not found' using errcode='P0002'; end if;
 for v_key,v_value in select key,value from jsonb_each(p_fields) loop
  if v_before->v_key is distinct from v_value then v_changes:=v_changes||jsonb_build_object(v_key,jsonb_build_object('old',v_before->v_key,'new',v_value)); end if;
 end loop;
 if v_changes<>'{}'::jsonb then
  update public.profiles set
  height=coalesce(p_fields->>'height',height),religion=coalesce(p_fields->>'religion',religion),caste=coalesce(p_fields->>'caste',caste),
  language=coalesce(p_fields->>'language',language),hobbies=coalesce(p_fields->>'hobbies',hobbies),
  favorite_movies=coalesce(p_fields->>'favorite_movies',favorite_movies),favorite_music=coalesce(p_fields->>'favorite_music',favorite_music),
  education_level=coalesce(p_fields->>'education_level',education_level),smoking_habits=coalesce(p_fields->>'smoking_habits',smoking_habits),
  drinking_habits=coalesce(p_fields->>'drinking_habits',drinking_habits),country=coalesce(p_fields->>'country',country),region=coalesce(p_fields->>'region',region)
  where id=p_id;
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata) values(auth.uid(),'member_extended_profile_edited','profile',p_id::text,jsonb_build_object('changes',v_changes));
 end if;
 return jsonb_build_object('updated',true,'changed_fields',(select coalesce(jsonb_agg(key),'[]'::jsonb) from jsonb_object_keys(v_changes) key));
end $$;
revoke all on function public.admin_edit_member_extended(uuid,jsonb) from public,anon;
grant execute on function public.admin_edit_member_extended(uuid,jsonb) to authenticated;