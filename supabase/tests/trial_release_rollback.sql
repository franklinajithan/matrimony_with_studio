-- Production release acceptance with synthetic identities. Always rolls back.
-- Run only as a database operator; no emails or real member IDs are used.
begin;
do $$
declare u uuid:=gen_random_uuid();s uuid:=gen_random_uuid();begin
 perform set_config('release.qa_user',u::text,true);
 perform set_config('release.qa_session',s::text,true);
 insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
 values(u,'release-qa-'||u::text||'@example.invalid',now(),'{"display_name":"Release QA (rollback)"}','{"provider":"email","providers":["email"]}');
 insert into auth.sessions(id,user_id,created_at,updated_at) values(s,u,now(),now());
end $$;
select set_config('request.jwt.claim.sub',current_setting('release.qa_user'),true),
 set_config('request.jwt.claim.role','authenticated',true),
 set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('release.qa_user'),'role','authenticated','session_id',current_setting('release.qa_session'))::text,true);
set local role authenticated;
do $$
declare first_grant jsonb;again jsonb;begin
 first_grant:=public.claim_premium_launch_offer();again:=public.claim_premium_launch_offer();
 if first_grant->>'plan'<>'premium' or (first_grant->>'durationMonths')::integer<>2 then raise exception 'QA: wrong trial plan/duration';end if;
 if again is distinct from first_grant then raise exception 'QA: duplicate claim changed the window';end if;
 if (first_grant->>'endsAt')::timestamptz is distinct from (((first_grant->>'startsAt')::timestamptz at time zone 'UTC')+interval '2 months') at time zone 'UTC' then raise exception 'QA: wrong expiry';end if;
 if (select count(*) from public.premium_launch_offers)<>1 then raise exception 'QA: owner read failed';end if;
 begin
  update public.premium_launch_offers set duration_months=6 where user_id=auth.uid();
  raise exception 'QA: direct grant edit unexpectedly succeeded';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
delete from auth.sessions where id=current_setting('release.qa_session')::uuid;
set local role authenticated;
do $$begin
 begin perform public.claim_premium_launch_offer();raise exception 'QA: revoked session accepted';exception when insufficient_privilege then null;end;
 if (select count(*) from public.premium_launch_offers)<>0 then raise exception 'QA: revoked session could read trial';end if;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform public.claim_premium_launch_offer();raise exception 'QA: anonymous claim accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$begin
 if (select enabled from private.payment_configuration where singleton) then raise exception 'QA: unverified payment processing is enabled';end if;
 if has_function_privilege('authenticated','public.record_verified_payment(uuid,text,text,text,integer,text)','execute') then raise exception 'QA: members can confirm payments';end if;
end $$;
rollback;
