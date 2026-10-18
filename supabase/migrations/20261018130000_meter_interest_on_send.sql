-- Draft migration: count a newly sent (or re-sent) interest in the SAME
-- transaction as the match_requests write. Rollbacks do not consume allowance.
-- Existing match_requests RLS continues to govern who may send an interest.
create or replace function public.meter_new_interest()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_plan text := 'free';
  v_period date := date_trunc('month', now() at time zone 'UTC')::date;
  v_used integer;
begin
  if new.status <> 'pending'
     or (tg_op = 'UPDATE' and old.status = 'pending') then
    return new;
  end if;

  -- Trusted server-side writes (such as repair/import) are not member sends.
  if v_user is null then return new; end if;
  if new.sender_id <> v_user then
    raise exception 'Only the sender can send an interest';
  end if;

  -- Serialize sends from one member, even when the usage row does not yet exist.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 129204));

  select case when s.plan_code = 'plus' then 'premium' else s.plan_code end
    into v_plan
    from public.user_subscriptions s
   where s.user_id = v_user
     and s.status in ('active', 'trialing')
     and s.current_period_end > now()
     and s.plan_code in ('premium', 'premium_plus', 'plus')
   order by s.created_at desc
   limit 1;

  if v_plan is null or v_plan = 'free' then
    if exists (
      select 1 from public.member_trials t
       where t.user_id = v_user
         and t.starts_at <= now() and t.ends_at > now()
    ) then v_plan := 'premium'; end if;
  end if;

  if coalesce(v_plan, 'free') <> 'free' then return new; end if;

  insert into public.subscription_usage(user_id, feature_key, period_start, used_count)
  values(v_user, 'interestsPerMonth', v_period, 0)
  on conflict (user_id, feature_key, period_start) do nothing;

  select used_count into v_used from public.subscription_usage
   where user_id = v_user and feature_key = 'interestsPerMonth'
     and period_start = v_period
   for update;

  if v_used is null then raise exception 'Interest allowance unavailable'; end if;
  if v_used >= 10 then
    raise exception 'Monthly interest allowance reached'
      using errcode = 'P0001';
  end if;

  update public.subscription_usage
     set used_count = used_count + 1, updated_at = now()
   where user_id = v_user and feature_key = 'interestsPerMonth'
     and period_start = v_period;
  return new;
end;
$$;

revoke all on function public.meter_new_interest() from public, anon, authenticated;
drop trigger if exists meter_new_interest_on_match_requests on public.match_requests;
create trigger meter_new_interest_on_match_requests
before insert or update of status on public.match_requests
for each row execute function public.meter_new_interest();
