create table public.country_page_load_totals (
  day date not null,
  country text not null check (country ~ '^[A-Z]{2}$'),
  page_loads bigint not null check (page_loads > 0),
  primary key (day, country)
);

alter table public.country_page_load_totals enable row level security;
revoke all on public.country_page_load_totals from public, anon, authenticated;
grant select, insert, update on public.country_page_load_totals to service_role;

create function public.record_country_page_load(p_country text)
returns void language sql security invoker set search_path = '' as $$
  insert into public.country_page_load_totals as totals (day, country, page_loads)
  values ((now() at time zone 'Europe/London')::date, p_country, 1)
  on conflict (day, country) do update set page_loads = totals.page_loads + 1;
$$;

create function public.country_page_load_report()
returns table (country text, today bigint, last_7_days bigint, last_28_days bigint)
language sql stable security invoker set search_path = '' as $$
  with bounds as (select (now() at time zone 'Europe/London')::date as current_day)
  select t.country,
    coalesce(sum(t.page_loads) filter (where t.day = b.current_day), 0)::bigint,
    coalesce(sum(t.page_loads) filter (where t.day >= b.current_day - 6), 0)::bigint,
    sum(t.page_loads)::bigint
  from public.country_page_load_totals t cross join bounds b
  where t.day between b.current_day - 27 and b.current_day
  group by t.country
  order by sum(t.page_loads) desc, t.country;
$$;

revoke all on function public.record_country_page_load(text), public.country_page_load_report()
  from public, anon, authenticated;
grant execute on function public.record_country_page_load(text), public.country_page_load_report() to service_role;

select cron.schedule('cupidmatch-country-total-retention', '31 3 * * *',
  $$delete from public.country_page_load_totals where day < (now() at time zone 'Europe/London')::date - 89$$);
