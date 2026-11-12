create table public.visitor_referrers (
  visit_id uuid primary key,
  domain text not null check (length(domain) <= 180 and domain ~ '^[a-z0-9.-]+[.][a-z][a-z0-9-]*$'),
  engine text check (engine in ('Google','Bing','DuckDuckGo','Yahoo','Ecosia','Brave Search','Yandex','Baidu')),
  recorded_at timestamptz not null default now()
);
create index visitor_referrers_retention_idx on public.visitor_referrers(recorded_at);
alter table public.visitor_referrers enable row level security;
revoke all on public.visitor_referrers from public, anon, authenticated;
grant select, insert on public.visitor_referrers to service_role;

select cron.schedule('cupidmatch-referrer-retention', '27 3 * * *',
  $$delete from public.visitor_referrers where recorded_at < now() - interval '30 days'$$);

create function public.visitor_acquisition_report(p_days integer, p_channel text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with period as (
    select (now() at time zone 'Europe/London')::date as today,
      case when p_days in (1,7,28) then p_days else 7 end as days
  ), bounds as (
    select *, today - (days - 1) as start_day,
      ((today - (days - 1))::timestamp at time zone 'Europe/London') as start_at
    from period
  ), ordered_pages as (
    select a.visit_id, a.page, a.source, a.opened_at, a.active_seconds,
      row_number() over (partition by a.visit_id order by a.opened_at, a.page_id) as position
    from bounds b join public.visitor_activity a
      on a.opened_at >= b.start_at - interval '4 hours' and a.opened_at <= now()
  ), entries as (
    select a.visit_id, a.page, a.source, (a.opened_at at time zone 'Europe/London')::date as day,
      r.domain, coalesce(r.engine, case when a.source in ('Google','Bing','Other search') then a.source end) as engine
    from ordered_pages a cross join bounds b left join public.visitor_referrers r on r.visit_id = a.visit_id
    where a.position = 1 and a.opened_at >= b.start_at
  ), visits as (
    select *, case when engine is not null then 'search'
      when source in ('Social','Referral') or domain is not null then 'referrals'
      else 'unattributed' end as channel
    from entries
  ), selected as (
    select * from visits where p_channel is null or p_channel not in ('search','referrals') or channel = p_channel
  ), landing as (
    select v.page, count(*) as visits, count(a.visit_id) as continued
    from selected v left join ordered_pages a on a.visit_id = v.visit_id and a.position = 2
    group by v.page order by visits desc, v.page limit 12
  ), popular as (
    select a.page, count(*) as views, count(distinct a.visit_id) as visits
    from selected v join ordered_pages a on a.visit_id = v.visit_id
    group by a.page order by views desc, a.page limit 12
  ), sources as (
    select coalesce(v.engine, v.domain, v.source) as name, v.channel, count(*) as visits
    from selected v group by 1, 2 order by visits desc, name, v.channel limit 12
  ), next_pages as (
    select v.page as landing, a.page as next, count(*) as visits
    from selected v join ordered_pages a on a.visit_id = v.visit_id and a.position = 2
    group by v.page, a.page order by visits desc, landing, next limit 10
  ), daily as (
    select d.day, count(v.visit_id) as visits,
      count(v.visit_id) filter (where v.channel='search') as search,
      count(v.visit_id) filter (where v.channel='referrals') as referrals
    from bounds b cross join lateral (
      select b.start_day + n as day from generate_series(0, b.days - 1) n
    ) d left join selected v on v.day = d.day
    group by d.day
  )
  select jsonb_build_object(
    'start', b.start_day, 'end', b.today,
    'totals', (select jsonb_build_object('visits',count(*),'search',count(*) filter (where channel='search'),
      'referrals',count(*) filter (where channel='referrals'),'unattributed',count(*) filter (where channel='unattributed')) from visits),
    'selected_visits', (select count(*) from selected),
    'sources', coalesce((select jsonb_agg(to_jsonb(s) order by s.visits desc,s.name,s.channel) from sources s), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from daily d), '[]'::jsonb),
    'landing', coalesce((select jsonb_agg(to_jsonb(l) order by l.visits desc,l.page) from landing l), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(to_jsonb(p) order by p.views desc,p.page) from popular p), '[]'::jsonb),
    'next_pages', coalesce((select jsonb_agg(to_jsonb(n) order by n.visits desc,n.landing,n.next) from next_pages n), '[]'::jsonb)
  )
  from bounds b;
$$;

revoke all on function public.visitor_acquisition_report(integer,text) from public, anon, authenticated;
grant execute on function public.visitor_acquisition_report(integer,text) to service_role;
