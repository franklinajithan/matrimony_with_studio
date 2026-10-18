-- Run against a seeded database. All settings, users and audit events roll back.
begin;
do $$
declare admin_id uuid; member_id uuid; v integer; result jsonb; audit_count bigint; provider text; test_id uuid;
begin
  select id into strict admin_id from public.profiles where is_admin is true limit 1;
  select id into strict member_id from public.profiles where is_admin is not true limit 1;
  select version into v from public.registration_control where singleton;
  select count(*) into audit_count from public.admin_audit_log;
  if has_table_privilege('anon','public.registration_control','UPDATE') or has_table_privilege('authenticated','public.registration_control','UPDATE') or has_function_privilege('anon','public.set_registration_access(boolean,text,integer)','EXECUTE') then raise exception 'Public write access'; end if;
  perform set_config('request.jwt.claim.sub',member_id::text,true);
  begin perform public.set_registration_access(false,'Test pause',v); raise exception 'Member allowed'; exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  result:=public.set_registration_access(false,'Test pause',v);
  if (result->>'enabled')::boolean is distinct from false then raise exception 'Pause failed'; end if;
  foreach provider in array array['email','google','facebook'] loop
    begin
      insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),'registration-control-test@example.invalid',jsonb_build_object('provider',provider));
      raise exception 'Account creation allowed';
    exception when raise_exception then if SQLERRM <> 'New registrations are temporarily paused.' then raise; end if; end;
  end loop;
  begin perform public.set_registration_access(true,'Test pause',v); raise exception 'Stale save allowed'; exception when serialization_failure then null; end;
  result:=public.set_registration_access(true,'Test pause',v+1);
  if (result->>'enabled')::boolean is distinct from true then raise exception 'Reopen failed'; end if;
  if (select count(*) from public.admin_audit_log) <> audit_count+2 then raise exception 'Audit missing'; end if;
  -- Auth creates new users before a member session exists.
  perform set_config('request.jwt.claim.sub','',true);
  test_id:=gen_random_uuid();
  insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values(test_id,'registration-control-test@example.invalid','{"provider":"email","providers":["email"]}','{"display_name":"Registration test"}');
  if not exists(select 1 from auth.users where id=test_id) then raise exception 'Open registration blocked'; end if;
end $$;
rollback;
select 'registration access assertions passed; all changes rolled back' as result;
