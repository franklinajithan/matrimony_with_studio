create table public.visitor_activity (
  visit_id uuid not null,
  page_id uuid not null,
  page text not null check (length(page) between 1 and 80),
  country text check (country ~ '^[A-Z]{2}$'),
  browser text not null check (length(browser) between 1 and 24),
  source text not null check (length(source) between 1 and 40),
  opened_at timestamptz not null default now(),
  active_seconds integer not null default 0 check (active_seconds between 0 and 14400),
  primary key (visit_id, page_id)
);

create index visitor_activity_opened on public.visitor_activity (opened_at desc);
alter table public.visitor_activity enable row level security;
revoke all on public.visitor_activity from public, anon, authenticated;
grant select, insert, update on public.visitor_activity to service_role;

create function public.record_visitor_activity(
  p_visit uuid, p_page_id uuid, p_page text, p_country text,
  p_browser text, p_source text, p_seconds integer
) returns void language sql security invoker set search_path = '' as $$
  insert into public.visitor_activity as activity
    (visit_id, page_id, page, country, browser, source, active_seconds)
  values (p_visit, p_page_id, p_page, p_country, p_browser, p_source, 0)
  on conflict (visit_id, page_id) do update
    set active_seconds = greatest(activity.active_seconds,
      least(p_seconds, greatest(0, extract(epoch from (now() - activity.opened_at))::integer + 2)))
  where activity.page = excluded.page and activity.opened_at >= now() - interval '4 hours';
$$;

create function public.visitor_visit_list(p_offset integer)
returns table (
  visit_id uuid, started_at timestamptz, active_seconds bigint, page_views bigint,
  country text, browser text, source text, landing_page text
) language sql stable security invoker set search_path = '' as $$
  select visit_id, min(opened_at), sum(active_seconds), count(*),
    (array_agg(country order by opened_at, page_id))[1],
    (array_agg(browser order by opened_at, page_id))[1],
    (array_agg(source order by opened_at, page_id))[1],
    (array_agg(page order by opened_at, page_id))[1]
  from public.visitor_activity
  where opened_at >= now() - interval '30 days'
  group by visit_id
  order by min(opened_at) desc, visit_id
  limit 31 offset greatest(0, p_offset);
$$;

revoke all on function public.record_visitor_activity(uuid, uuid, text, text, text, text, integer),
  public.visitor_visit_list(integer) from public, anon, authenticated;
grant execute on function public.record_visitor_activity(uuid, uuid, text, text, text, text, integer),
  public.visitor_visit_list(integer) to service_role;

create extension if not exists pg_cron;
select cron.schedule('cupidmatch-visitor-retention', '21 3 * * *',
  $$delete from public.visitor_activity where opened_at < now() - interval '30 days'$$);
