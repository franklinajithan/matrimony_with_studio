create function public.visitor_traffic_summary(p_day date default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with calendar as (
    select (now() at time zone 'Europe/London')::date as today
  ), dates as (
    select today, greatest(today - 29, least(coalesce(p_day, today), today)) as selected_day
    from calendar
  ), bounds as (
    select *,
      selected_day::timestamp at time zone 'Europe/London' as selected_start,
      (selected_day + 1)::timestamp at time zone 'Europe/London' as selected_end
    from dates
  ), activity as (
    select a.page, a.source, a.opened_at, a.active_seconds,
      (a.opened_at at time zone 'Europe/London')::date as day,
      date_trunc('hour', a.opened_at, 'UTC') as hour,
      row_number() over (partition by a.visit_id order by a.opened_at, a.page_id) = 1 as is_entry
    from public.visitor_activity a cross join bounds b
    -- Include earlier rows so an ongoing session is not counted as a new visit at the reporting boundary.
    where a.opened_at >= least(now() - interval '30 days',
      ((b.today - 29)::timestamp at time zone 'Europe/London') - interval '4 hours')
      and a.opened_at <= now()
  ), daily as (
    select day, count(*) filter (where is_entry) as visits, count(*) as views,
      count(*) filter (where is_entry and page = '/') as home_entries,
      count(*) filter (where page = '/') as home_views
    from activity cross join bounds
    where day >= today - 29
    group by day
  ), selected_activity as (
    select a.* from activity a cross join bounds b where a.day = b.selected_day
  ), hourly as (
    select hour, count(*) filter (where is_entry) as visits, count(*) as views,
      count(*) filter (where is_entry and page = '/') as home_entries,
      count(*) filter (where page = '/') as home_views
    from selected_activity
    group by hour
  ), pages as (
    select page, count(*) as views, count(*) filter (where is_entry) as entries,
      sum(active_seconds) as active_seconds
    from selected_activity group by page
  ), sources as (
    select source, count(*) as visits from selected_activity where is_entry group by source
  )
  select jsonb_build_object(
    'today', b.today,
    'selected_day', b.selected_day,
    'daily', (
      select jsonb_agg(jsonb_build_object('day', b.today - n,
        'visits', coalesce(d.visits, 0), 'views', coalesce(d.views, 0),
        'home_entries', coalesce(d.home_entries, 0), 'home_views', coalesce(d.home_views, 0))
        order by n)
      from generate_series(0, 29) as days(n) left join daily d on d.day = b.today - n
    ),
    'hourly', (
      select jsonb_agg(jsonb_build_object('hour', hours.hour,
        'visits', coalesce(h.visits, 0), 'views', coalesce(h.views, 0),
        'home_entries', coalesce(h.home_entries, 0), 'home_views', coalesce(h.home_views, 0))
        order by hours.hour)
      from generate_series(b.selected_start, least(b.selected_end - interval '1 hour', now()), interval '1 hour') as hours(hour)
      left join hourly h on h.hour = hours.hour
    ),
    'pages', coalesce((select jsonb_agg(to_jsonb(p) order by p.views desc, p.page) from pages p), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(to_jsonb(s) order by s.visits desc, s.source) from sources s), '[]'::jsonb)
  )
  from bounds b;
$$;

revoke all on function public.visitor_traffic_summary(date) from public, anon, authenticated;
grant execute on function public.visitor_traffic_summary(date) to service_role;
