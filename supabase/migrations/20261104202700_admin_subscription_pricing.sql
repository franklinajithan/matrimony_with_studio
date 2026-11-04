-- Central, audited plan management. Prices remain denominated in GBP.
-- This migration does not change live price rows or activate payment processing.
revoke insert, update, delete on public.subscription_plans from anon, authenticated;

create or replace function public.admin_update_subscription_plan(
  p_code text,
  p_monthly_price_pence integer,
  p_three_month_price_pence integer,
  p_six_month_price_pence integer,
  p_entitlements jsonb,
  p_expected_updated_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  previous public.subscription_plans%rowtype;
  revised public.subscription_plans%rowtype;
  feature record;
  actual_type text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Not authorized to manage pricing' using errcode='42501';
  end if;
  if p_code not in ('free','plus','premium') then
    raise exception 'Unknown plan' using errcode='22023';
  end if;
  select * into previous from public.subscription_plans where code=p_code for update;
  if not found then raise exception 'Plan unavailable' using errcode='22023'; end if;
  if previous.updated_at is distinct from p_expected_updated_at then
    raise exception 'Plan has been modified. Refresh before saving.' using errcode='40001';
  end if;
  if previous.currency <> 'GBP' then
    raise exception 'Only GBP base prices can be edited' using errcode='22023';
  end if;
  if p_monthly_price_pence is null
     or p_monthly_price_pence < case when p_code='free' then 0 else 1 end
     or p_monthly_price_pence > case when p_code='free' then 0 else 100000 end then
    raise exception 'Monthly price outside allowed range' using errcode='22023';
  end if;
  if p_code='free' and (p_three_month_price_pence is not null or p_six_month_price_pence is not null) then
    raise exception 'Free plan cannot have billed terms' using errcode='22023';
  end if;
  if p_three_month_price_pence is not null and (p_three_month_price_pence < 1 or p_three_month_price_pence > 600000) then
    raise exception 'Invalid three-month price' using errcode='22023';
  end if;
  if p_six_month_price_pence is not null and (p_six_month_price_pence < 1 or p_six_month_price_pence > 1200000) then
    raise exception 'Invalid six-month price' using errcode='22023';
  end if;
  if p_entitlements is null or jsonb_typeof(p_entitlements) <> 'object' or p_entitlements = '{}'::jsonb then
    raise exception 'Missing feature configuration' using errcode='22023';
  end if;
  if exists (select 1 from jsonb_object_keys(previous.entitlements) as item(k) where not p_entitlements ? item.k) then
    raise exception 'Cannot remove existing feature keys' using errcode='22023';
  end if;
  for feature in select key, value from jsonb_each(p_entitlements) loop
    if not previous.entitlements ? feature.key then
      raise exception 'Unknown feature key' using errcode='22023';
    end if;
    actual_type := jsonb_typeof(feature.value);
    if feature.key in ('interestsPerMonth','profileSharesPerMonth','biodataTemplates','profileBoostsPerMonth') then
      if actual_type not in ('null','number') or (actual_type='number' and
           (feature.value::text !~ '^[0-9]+$' or (feature.value::text)::numeric > 100000)) then
        raise exception 'Invalid feature limit' using errcode='22023';
      end if;
    elsif actual_type <> 'boolean' then
      raise exception 'Invalid boolean feature' using errcode='22023';
    end if;
  end loop;
  update public.subscription_plans set
    monthly_price_pence=p_monthly_price_pence,
    three_month_price_pence=p_three_month_price_pence,
    six_month_price_pence=p_six_month_price_pence,
    entitlements=p_entitlements,
    updated_at=clock_timestamp()
  where code=p_code
  returning * into revised;
  insert into public.admin_audit_log(actor_id, action, target_type, target_id, metadata)
  values (auth.uid(),'admin_subscription_plan_updated','subscription_plans',p_code,
    jsonb_build_object('before',to_jsonb(previous),'after',to_jsonb(revised)));
  return to_jsonb(revised);
end;
$function$;

revoke all on function public.admin_update_subscription_plan(text,integer,integer,integer,jsonb,timestamptz) from public, anon;
grant execute on function public.admin_update_subscription_plan(text,integer,integer,integer,jsonb,timestamptz) to authenticated;
