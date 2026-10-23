-- Run only through an authorised database connection. All fixtures and temporary
-- setting changes are rolled back; no existing member content is selected.
begin;
select set_config('horoscope.qa.a',gen_random_uuid()::text,true),set_config('horoscope.qa.b',gen_random_uuid()::text,true);
update public.registration_control set enabled=true where singleton;
update public.horoscope_settings set horoscope_enabled=true,horoscope_upload_enabled=true;
insert into auth.users(id,email,raw_user_meta_data)
select current_setting('horoscope.qa.a')::uuid,'horoscope-qa-'||current_setting('horoscope.qa.a')||'@example.invalid','{}'::jsonb
union all select current_setting('horoscope.qa.b')::uuid,'horoscope-qa-'||current_setting('horoscope.qa.b')||'@example.invalid','{}'::jsonb;
update public.profiles set is_published=true where id in(select current_setting('horoscope.qa.a')::uuid union all select current_setting('horoscope.qa.b')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.a'),true);
do $$ declare h jsonb; begin
 h:=public.horoscope_save('{"revision":0,"tradition":"tamil","visibility":"private","fields":{"dateOfBirth":"1990-06-15","timeQuality":"unknown","birthCity":"QA City","birthCountry":"UK","timezone":"Europe/London","language":"Tamil","rasi":"Mesha"},"shared_fields":["rasi"],"comparison_consent":true,"ai_consent":false,"planets":[]}');
 if h->>'visibility'<>'private' or h->'fields' ? 'timeOfBirth' then raise exception 'Private/unknown-time save failed'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.b'),true);
do $$ begin
 if (select count(*) from public.horoscope_profiles)<>0 then raise exception 'Raw peer data exposed'; end if;
 begin
 perform public.horoscope_view(current_setting('horoscope.qa.a')::uuid);
 raise exception 'Private horoscope exposed';
 exception when insufficient_privilege then null;end;
 begin
 update public.horoscope_profiles set visibility='members';
 raise exception 'Raw write permitted';
 exception when insufficient_privilege then null;end;
 begin
 perform public.horoscope_admin_settings('{}');
 raise exception 'Ordinary member changed admin settings';
 exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.a'),true);
do $$ declare h jsonb; begin
 select to_jsonb(p) into h from public.horoscope_profiles p;
 h:=h - 'user_id' - 'provenance' - 'verified_at' - 'updated_at' - 'created_at';
 h:=h || '{"visibility":"members","planets":[]}';
 perform public.horoscope_save(h);
end $$;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.b'),true);
do $$ declare h jsonb; begin
 h:=public.horoscope_view(current_setting('horoscope.qa.a')::uuid);
 if h->'fields' <> '{"rasi":"Mesha"}'::jsonb or h ? 'provenance' then raise exception 'Sensitive fields not redacted'; end if;
 if public.horoscope_can_compare(current_setting('horoscope.qa.a')::uuid) then raise exception 'Comparison allowed without reciprocal horoscope';end if;
 perform public.horoscope_save('{"revision":0,"tradition":"tamil","visibility":"members","fields":{"dateOfBirth":"1991-07-16","timeQuality":"unknown","birthCity":"Other QA City","birthCountry":"UK","timezone":"Europe/London","language":"Tamil","rasi":"Simha"},"shared_fields":["rasi"],"comparison_consent":true,"ai_consent":false,"planets":[]}');
 if not public.horoscope_can_compare(current_setting('horoscope.qa.a')::uuid) then raise exception 'Mutual comparison denied';end if;
 perform public.horoscope_store_report(current_setting('horoscope.qa.a')::uuid,1,2,'{"comparison":{"score":null},"aiExplanation":null}');
 if (select count(*) from public.horoscope_match_reports)<>1 then raise exception 'Owner report unavailable';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.a'),true);
insert into public.blocks(blocker_id,blocked_id) select current_setting('horoscope.qa.a')::uuid,current_setting('horoscope.qa.b')::uuid;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.b'),true);
do $$ begin
 if public.horoscope_can_compare(current_setting('horoscope.qa.a')::uuid) then raise exception 'Block did not revoke comparison';end if;
 if (select count(*) from public.horoscope_match_reports)<>0 then raise exception 'Cached report exposed after block';end if;
 begin perform public.horoscope_view(current_setting('horoscope.qa.a')::uuid);raise exception 'Blocked view allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.a'),true);
delete from public.blocks where blocker_id=auth.uid();
do $$ declare h jsonb; begin
 select to_jsonb(p) into h from public.horoscope_profiles p;
 h:=h - 'user_id' - 'provenance' - 'verified_at' - 'updated_at' - 'created_at';
 h:=h || '{"comparison_consent":false,"planets":[]}';
 perform public.horoscope_save(h);
 begin perform public.horoscope_save(h);raise exception 'Stale revision allowed';exception when sqlstate 'PT409' then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.b'),true);
do $$ begin
 if public.horoscope_can_compare(current_setting('horoscope.qa.a')::uuid) then raise exception 'Consent withdrawal ineffective';end if;
 if (select count(*) from public.horoscope_match_reports)<>0 then raise exception 'Derived reports retained after edit';end if;
end $$;
reset role;
update public.profiles set suspended_at=now() where id=current_setting('horoscope.qa.a')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.b'),true);
do $$ begin
 begin perform public.horoscope_view(current_setting('horoscope.qa.a')::uuid);raise exception 'Suspended member exposed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('horoscope.qa.a'),true);
select public.horoscope_delete();
do $$ begin if exists(select 1 from public.horoscope_profiles where user_id=auth.uid()) then raise exception 'Owner deletion failed';end if;end $$;
reset role;
rollback;
select jsonb_build_object('status','passed','environment','live Supabase PostgreSQL','fixtures','rolled back','checks',array['private unknown-time save','raw peer isolation','private RPC denial','raw write denial','admin denial','sensitive field redaction','reciprocal comparison','report owner access','block revocation','cached-report block denial','consent withdrawal','stale revisions','suspension','owner deletion']) as verification;
