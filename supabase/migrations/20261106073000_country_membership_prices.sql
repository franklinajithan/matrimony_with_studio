-- Country-specific price overrides. The GBP base plans remain authoritative.
-- A disabled or missing market ALWAYS falls back to GBP; never infer a chargeable currency.
create table if not exists public.subscription_country_prices(
 country_code text primary key check(country_code ~ '^[A-Z]{2}$' and country_code <> 'GB'),
 currency text not null check(currency in ('EUR','USD','LKR','INR','CAD','AUD','CHF','GBP','NZD','SGD','AED','ZAR')),
 enabled boolean not null default false,
 plus_monthly_minor integer not null check(plus_monthly_minor between 1 and 10000000),
 premium_monthly_minor integer not null check(premium_monthly_minor between 1 and 10000000),
 plus_three_month_minor integer check(plus_three_month_minor between 1 and 60000000),
 premium_three_month_minor integer check(premium_three_month_minor between 1 and 60000000),
 plus_six_month_minor integer check(plus_six_month_minor between 1 and 120000000),
 premium_six_month_minor integer check(premium_six_month_minor between 1 and 120000000),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
alter table public.subscription_country_prices enable row level security;
revoke all on public.subscription_country_prices from anon,authenticated;
grant select on public.subscription_country_prices to anon, authenticated;
create policy "Country pricing visible only when enabled" on public.subscription_country_prices
 for select to anon, authenticated using(enabled=true);
-- Admins read all states via a checked RPC, not open direct table access.
create or replace function public.admin_list_country_prices()
returns setof public.subscription_country_prices
language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not public.is_admin() then
   raise exception 'Administrator required' using errcode='42501';
 end if;
 return query select * from public.subscription_country_prices order by country_code;
end $$;
revoke all on function public.admin_list_country_prices() from public,anon;
grant execute on function public.admin_list_country_prices() to authenticated;

create or replace function public.admin_save_country_prices(
 p_country_code text,p_currency text,p_enabled boolean,
 p_plus_monthly integer,p_premium_monthly integer,
 p_plus_three integer,p_premium_three integer,
 p_plus_six integer,p_premium_six integer,
 p_expected_updated_at timestamptz
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare previous public.subscription_country_prices%rowtype;
 revised public.subscription_country_prices%rowtype;
begin
 if auth.uid() is null or not public.is_admin() then
   raise exception 'Administrator required' using errcode='42501';
 end if;
 if p_country_code !~ '^[A-Z]{2}$' or p_country_code='GB'
    or p_currency not in ('EUR','USD','LKR','INR','CAD','AUD','CHF','GBP','NZD','SGD','AED','ZAR')
    or p_enabled is null or p_plus_monthly not between 1 and 10000000
    or p_premium_monthly not between 1 and 10000000
    or (p_plus_three is not null and p_plus_three not between 1 and 60000000)
    or (p_premium_three is not null and p_premium_three not between 1 and 60000000)
    or (p_plus_six is not null and p_plus_six not between 1 and 120000000)
    or (p_premium_six is not null and p_premium_six not between 1 and 120000000)
 then raise exception 'Invalid country prices' using errcode='22023'; end if;
 select * into previous from public.subscription_country_prices
 where country_code=p_country_code for update;
 if found and (p_expected_updated_at is null or previous.updated_at is distinct from p_expected_updated_at) then
   raise exception 'Market changed. Refresh before saving.' using errcode='40001';
 end if;
 if not found and p_expected_updated_at is not null then
   raise exception 'Market no longer exists. Refresh.' using errcode='40001';
 end if;
 insert into public.subscription_country_prices(
  country_code,currency,enabled,plus_monthly_minor,premium_monthly_minor,
  plus_three_month_minor,premium_three_month_minor,plus_six_month_minor,premium_six_month_minor,updated_by,updated_at)
 values(p_country_code,p_currency,p_enabled,p_plus_monthly,p_premium_monthly,
  p_plus_three,p_premium_three,p_plus_six,p_premium_six,auth.uid(),clock_timestamp())
 on conflict(country_code) do update set
  currency=excluded.currency,enabled=excluded.enabled,plus_monthly_minor=excluded.plus_monthly_minor,
  premium_monthly_minor=excluded.premium_monthly_minor,plus_three_month_minor=excluded.plus_three_month_minor,
  premium_three_month_minor=excluded.premium_three_month_minor,plus_six_month_minor=excluded.plus_six_month_minor,
  premium_six_month_minor=excluded.premium_six_month_minor,updated_by=excluded.updated_by,updated_at=excluded.updated_at
 returning * into revised;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),'country_membership_prices_saved','subscription_country_prices',p_country_code,
  jsonb_build_object('before',case when previous.country_code is null then null else to_jsonb(previous) end,
                     'after',to_jsonb(revised)));
 return to_jsonb(revised);
end $$;
revoke all on function public.admin_save_country_prices(text,text,boolean,integer,integer,integer,integer,integer,integer,timestamptz) from public,anon;
grant execute on function public.admin_save_country_prices(text,text,boolean,integer,integer,integer,integer,integer,integer,timestamptz) to authenticated;
