-- Extend the existing plan catalogue and keep allowance reads on the same
-- tier resolver and UTC calendar as transactional social writes.
update public.subscription_plans
set entitlements = entitlements || jsonb_build_object('profileHighlighting', code <> 'free'),
    updated_at = clock_timestamp()
where code in ('free', 'plus', 'premium') and not (entitlements ? 'profileHighlighting');

create or replace function public.my_membership_allowances()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  member_id uuid := auth.uid();
  tier text;
  period_start_utc date := date_trunc('month', now() at time zone 'UTC')::date;
  settings jsonb;
  allowances jsonb;
begin
  if member_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  tier := private.member_membership_tier(member_id);
  select p.entitlements into strict settings
    from public.subscription_plans p where p.code = tier and p.is_active;

  select jsonb_object_agg(features.key, jsonb_build_object(
    'limit', settings -> features.key,
    'used', coalesce(usage.used_count, 0),
    'remaining', case when settings ->> features.key is not null then
      greatest(0, (settings ->> features.key)::integer - coalesce(usage.used_count, 0)) end
  )) into allowances
  from (values ('interestsPerMonth'), ('messagesPerMonth'), ('profileViewsPerMonth')) features(key)
  left join public.subscription_usage usage on usage.user_id = member_id
    and usage.period_start = period_start_utc and usage.feature_key = features.key;

  return jsonb_build_object(
    'plan', tier,
    'periodStart', period_start_utc,
    'resetsAt', (period_start_utc + interval '1 month')::date,
    'allowances', allowances,
    'advancedFilters', settings -> 'advancedFilters',
    'profileHighlighting', settings -> 'profileHighlighting',
    'searchPlacement', settings -> 'searchPlacement'
  );
end;
$$;
revoke all on function public.my_membership_allowances() from public, anon;
grant execute on function public.my_membership_allowances() to authenticated;

-- Social usage is charged by its action. Legacy callers cannot charge these
-- counters directly or supply an override for the other metered features.
create or replace function public.consume_subscription_usage(p_feature_key text, p_limit integer)
returns table(allowed boolean, used_count integer)
language plpgsql security definer set search_path = ''
as $$
declare
  member_id uuid := auth.uid();
  period_start_utc date := date_trunc('month', now() at time zone 'UTC')::date;
  feature_limit integer;
  used integer;
begin
  if member_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_feature_key is null or p_feature_key not in ('profileSharesPerMonth', 'biodataTemplates', 'profileBoostsPerMonth') then
    raise exception 'Unsupported feature' using errcode = '22023';
  end if;
  select (p.entitlements ->> p_feature_key)::integer into strict feature_limit
    from public.subscription_plans p
    where p.code = private.member_membership_tier(member_id) and p.is_active and p.entitlements ? p_feature_key;
  insert into public.subscription_usage(user_id, feature_key, period_start, used_count)
    values (member_id, p_feature_key, period_start_utc, 0)
    on conflict (user_id, feature_key, period_start) do nothing;
  select s.used_count into strict used from public.subscription_usage s
    where s.user_id = member_id and s.feature_key = p_feature_key and s.period_start = period_start_utc
    for update;
  if feature_limit is not null and used >= feature_limit then
    return query select false, used;
    return;
  end if;
  update public.subscription_usage s set used_count = used + 1, updated_at = now()
    where s.user_id = member_id and s.feature_key = p_feature_key and s.period_start = period_start_utc;
  return query select true, used + 1;
end;
$$;

-- Legacy participant policies also allow direct table writes. Reject initial
-- states and identity rewrites that could bypass the pending-interest charge.
create or replace function private.enforce_interest_membership_quota()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status is distinct from 'pending' or new.sender_id = new.receiver_id then
      raise exception 'A new interest must be pending and addressed to another member' using errcode = '42501';
    end if;
    perform private.charge_membership_usage(new.sender_id, 'interestsPerMonth');
  else
    if new.id is distinct from old.id or new.sender_id is distinct from old.sender_id
      or new.receiver_id is distinct from old.receiver_id then
      raise exception 'Interest participants cannot be changed' using errcode = '42501';
    end if;
    if new.status is distinct from old.status then
      if new.status = 'pending' then
        perform private.charge_membership_usage(new.sender_id, 'interestsPerMonth');
      elsif new.status in ('accepted', 'declined') and
        (old.status <> 'pending' or auth.uid() is distinct from new.receiver_id) then
        raise exception 'Only the recipient can respond to a pending interest' using errcode = '42501';
      elsif new.status = 'withdrawn' and auth.uid() is distinct from new.sender_id
        and not public.is_admin() then
        raise exception 'Only the sender or an administrator can withdraw an interest' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;
