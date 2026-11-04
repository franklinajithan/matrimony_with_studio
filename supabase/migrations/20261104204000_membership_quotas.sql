-- Membership usage limits. Run only after review of actual production schema.
-- All counters use calendar months in UTC. Counters are charged on successful inserts.
update public.subscription_plans
set entitlements = entitlements ||
  case code
   when 'free' then '{"interestsPerMonth":2,"messagesPerMonth":2,"profileViewsPerMonth":50,"searchPlacement":0}'::jsonb
   when 'plus' then '{"interestsPerMonth":30,"messagesPerMonth":30,"profileViewsPerMonth":400,"searchPlacement":20}'::jsonb
   when 'premium' then '{"interestsPerMonth":null,"messagesPerMonth":null,"profileViewsPerMonth":null,"searchPlacement":10}'::jsonb
  end,
  updated_at=clock_timestamp()
where code in ('free','plus','premium');

create or replace function private.member_membership_tier(p_user uuid)
returns text language plpgsql security definer set search_path='' stable
as $$
declare result text;
begin
  select s.plan_code into result from public.user_subscriptions s
   where s.user_id=p_user and s.status in ('active','trialing')
     and (s.current_period_end is null or s.current_period_end>now())
     and s.plan_code in ('premium','plus')
   order by case s.plan_code when 'premium' then 2 else 1 end desc,s.created_at desc
   limit 1;
  if result is not null then return result; end if;
  if exists(select 1 from public.member_trials t where t.user_id=p_user and t.starts_at<=now() and t.ends_at>now())
   or exists(select 1 from public.premium_launch_offers t where t.user_id=p_user and t.starts_at<=now() and t.ends_at>now())
  then return 'premium'; end if;
  return 'free';
end $$;
revoke all on function private.member_membership_tier(uuid) from public,anon,authenticated;

create or replace function private.charge_membership_usage(p_user uuid,p_feature text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_limit integer; v_used integer; v_period date := date_trunc('month',now() at time zone 'UTC')::date;
begin
  if p_user is null or auth.uid() is distinct from p_user then
    raise exception 'Unauthorised membership use' using errcode='42501';
  end if;
  if p_feature not in ('interestsPerMonth','messagesPerMonth','profileViewsPerMonth') then
    raise exception 'Unknown quota' using errcode='22023';
  end if;
  select (p.entitlements->>p_feature)::integer into v_limit
    from public.subscription_plans p where p.code=private.member_membership_tier(p_user) and p.is_active;
  if not found then raise exception 'Membership unavailable' using errcode='P0001'; end if;
  -- Serialize the current member and feature counter under the row lock.
  insert into public.subscription_usage(user_id,feature_key,period_start,used_count)
    values(p_user,p_feature,v_period,0)
    on conflict(user_id,feature_key,period_start) do nothing;
  select s.used_count into v_used from public.subscription_usage s
    where s.user_id=p_user and s.feature_key=p_feature and s.period_start=v_period for update;
  if v_limit is not null and v_used>=v_limit then
    raise exception 'Monthly membership limit reached for %',p_feature using errcode='P0001';
  end if;
  update public.subscription_usage set used_count=used_count+1,updated_at=now()
    where user_id=p_user and feature_key=p_feature and period_start=v_period;
end $$;
revoke all on function private.charge_membership_usage(uuid,text) from public,anon,authenticated;

create or replace function private.enforce_interest_membership_quota()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if (tg_op='INSERT' and new.status='pending')
   or (tg_op='UPDATE' and new.status='pending' and old.status is distinct from 'pending')
 then perform private.charge_membership_usage(new.sender_id,'interestsPerMonth'); end if;
 return new;
end $$;
drop trigger if exists enforce_interest_membership_quota on public.match_requests;
create trigger enforce_interest_membership_quota before insert or update on public.match_requests
for each row execute function private.enforce_interest_membership_quota();

create or replace function private.enforce_message_membership_quota()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 perform private.charge_membership_usage(new.sender_id,'messagesPerMonth');
 return new;
end $$;
drop trigger if exists enforce_message_membership_quota on public.messages;
create trigger enforce_message_membership_quota before insert on public.messages
for each row execute function private.enforce_message_membership_quota();

create or replace function public.consume_member_profile_view(p_profile_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare caller uuid := auth.uid();
begin
 if caller is null then raise exception 'Not authenticated' using errcode='42501'; end if;
 if caller=p_profile_id then return jsonb_build_object('allowed',true,'charged',false); end if;
 if not exists(select 1 from public.profiles p where p.id=p_profile_id and p.is_published=true and p.suspended_at is null)
 then raise exception 'Profile unavailable' using errcode='P0001'; end if;
 perform private.charge_membership_usage(caller,'profileViewsPerMonth');
 return jsonb_build_object('allowed',true,'charged',true);
end $$;
revoke all on function public.consume_member_profile_view(uuid) from public,anon;
grant execute on function public.consume_member_profile_view(uuid) to authenticated;

create or replace function public.discovery_member_tiers(p_member_ids uuid[])
returns table(member_id uuid, plan_code text)
language plpgsql security definer set search_path='' stable
as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if cardinality(p_member_ids)>500 then raise exception 'Too many profiles' using errcode='22023'; end if;
 return query
 select p.id,private.member_membership_tier(p.id)
 from public.profiles p
 where p.id=any(p_member_ids) and p.is_published and p.suspended_at is null
 and p.id<>auth.uid();
end $$;
revoke all on function public.discovery_member_tiers(uuid[]) from public,anon;
grant execute on function public.discovery_member_tiers(uuid[]) to authenticated;
