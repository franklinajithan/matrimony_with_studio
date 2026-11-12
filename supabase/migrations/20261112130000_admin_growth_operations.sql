create table public.visitor_growth_events (
  visit_id uuid not null,
  milestone text not null check (milestone in ('signup_started','account_created','profile_published','request_sent')),
  recorded_at timestamptz not null default now(),
  primary key (visit_id, milestone)
);
create index visitor_growth_events_retention_idx on public.visitor_growth_events (recorded_at);

create table public.visitor_campaigns (
  visit_id uuid primary key,
  channel text not null check (channel in ('google','instagram','facebook','whatsapp','bing','tiktok','linkedin','newsletter','other')),
  name text not null check (name ~ '^[a-z0-9][a-z0-9_-]{0,47}$'),
  recorded_at timestamptz not null default now()
);
create index visitor_campaigns_retention_idx on public.visitor_campaigns (recorded_at);

create table public.admin_growth_configuration (
  singleton boolean primary key default true check (singleton),
  started_at timestamptz not null default now()
);
insert into public.admin_growth_configuration default values;
alter table public.admin_growth_configuration enable row level security;
revoke all on public.admin_growth_configuration from public, anon, authenticated;
grant select on public.admin_growth_configuration to service_role;

create table public.admin_daily_traffic (
  day date primary key,
  visits bigint not null,
  page_views bigint not null
);
create table public.admin_profile_publications (
  member_id uuid primary key references public.profiles(id) on delete cascade,
  recorded_at timestamptz not null default now()
);
create index admin_profile_publications_date_idx on public.admin_profile_publications (recorded_at);
create table public.admin_subscription_cancellations (
  subscription_id uuid not null references public.user_subscriptions(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  primary key (subscription_id, recorded_at)
);
create index admin_subscription_cancellations_date_idx on public.admin_subscription_cancellations (recorded_at);

alter table public.visitor_growth_events enable row level security;
alter table public.visitor_campaigns enable row level security;
alter table public.admin_daily_traffic enable row level security;
alter table public.admin_profile_publications enable row level security;
alter table public.admin_subscription_cancellations enable row level security;
revoke all on public.visitor_growth_events, public.visitor_campaigns, public.admin_daily_traffic,
  public.admin_profile_publications, public.admin_subscription_cancellations from public, anon, authenticated;
grant select on public.visitor_growth_events, public.visitor_campaigns, public.admin_daily_traffic,
  public.admin_profile_publications, public.admin_subscription_cancellations to service_role;
grant insert on public.visitor_growth_events, public.visitor_campaigns to service_role;

create function public.admin_capture_profile_publication()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.is_published and (tg_op = 'INSERT' or old.is_published is distinct from true) then
    insert into public.admin_profile_publications(member_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger admin_capture_profile_publication after insert or update of is_published on public.profiles
  for each row execute function public.admin_capture_profile_publication();

create function public.admin_capture_subscription_cancellation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.provider = 'stripe' and new.plan_code in ('plus','premium')
    and (new.status = 'cancelled' or new.cancel_at_period_end is true)
    and old.status is distinct from 'cancelled' and old.cancel_at_period_end is distinct from true then
    insert into public.admin_subscription_cancellations(subscription_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger admin_capture_subscription_cancellation after update of status, cancel_at_period_end
  on public.user_subscriptions for each row execute function public.admin_capture_subscription_cancellation();
revoke all on function public.admin_capture_profile_publication(), public.admin_capture_subscription_cancellation()
  from public, anon, authenticated, service_role;

create function public.admin_refresh_daily_traffic()
returns void language sql security invoker set search_path = '' as $$
  insert into public.admin_daily_traffic(day, visits, page_views)
  select (entry->>'day')::date, (entry->>'visits')::bigint, (entry->>'views')::bigint
  from jsonb_array_elements(public.visitor_traffic_summary(null)->'daily') as entry
  where (entry->>'day')::date < (now() at time zone 'Europe/London')::date
    and (entry->>'day')::date >= (now() at time zone 'Europe/London')::date - 28
    and ((entry->>'day')::date >= (select min(day) from public.admin_daily_traffic)
      or (entry->>'day')::date >= coalesce(
        (select (min(opened_at) at time zone 'Europe/London')::date + 1 from public.visitor_activity),
        (now() at time zone 'Europe/London')::date - 1))
  on conflict (day) do update set visits = excluded.visits, page_views = excluded.page_views;
  delete from public.admin_daily_traffic where day < (now() at time zone 'Europe/London')::date - 90;
  delete from public.visitor_growth_events where recorded_at < now() - interval '30 days';
  delete from public.visitor_campaigns where recorded_at < now() - interval '30 days';
$$;
revoke all on function public.admin_refresh_daily_traffic() from public, anon, authenticated, service_role;
select public.admin_refresh_daily_traffic();
select cron.schedule('cupidmatch-growth-rollup', '45 1 * * *', 'select public.admin_refresh_daily_traffic()');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('inappropriate_content','fake_profile','harassment','spam','safety_concern','other')),
  description text check (length(description) <= 1000),
  status text not null default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
create unique index reports_open_pair_idx on public.reports (reporter_id, reported_id)
  where status in ('pending','reviewing');
create index reports_reported_id_idx on public.reports (reported_id);
create index reports_open_created_idx on public.reports (created_at, id)
  where status in ('pending','reviewing');
alter table public.reports enable row level security;
revoke all on public.reports from public, anon, authenticated;
grant insert (reporter_id, reported_id, reason, description, status) on public.reports to authenticated;
grant select, update (status, reviewed_by, reviewed_at, updated_at) on public.reports to service_role;
create policy "Members submit their own reports" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'pending'
    and exists (select 1 from public.discovery_profiles p where p.id = reported_id));

create function public.admin_growth_report(p_days integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with period as (
    select (now() at time zone 'Europe/London')::date as today,
      case when p_days = 30 then 30 else 7 end as days
  ), bounds as (
    select *, (today::timestamp at time zone 'Europe/London') as finish,
      ((today - days)::timestamp at time zone 'Europe/London') as start_at,
      ((today - days * 2)::timestamp at time zone 'Europe/London') as previous_at
    from period cross join public.admin_growth_configuration
  ), traffic as (
    select
      case when count(*) filter (where day >= b.today - b.days) = b.days
        then sum(visits) filter (where day >= b.today - b.days) end as visits,
      case when count(*) filter (where day < b.today - b.days) = b.days
        then sum(visits) filter (where day < b.today - b.days) end as previous_visits,
      case when count(*) filter (where day >= b.today - b.days) = b.days
        then sum(page_views) filter (where day >= b.today - b.days) end as page_views,
      case when count(*) filter (where day < b.today - b.days) = b.days
        then sum(page_views) filter (where day < b.today - b.days) end as previous_page_views
    from bounds b left join public.admin_daily_traffic d on d.day >= b.today - b.days * 2 and d.day < b.today
    group by b.today, b.days
  ), registration as (
    select count(*) filter (where p.created_at >= b.start_at) as registrations,
      count(*) filter (where p.created_at < b.start_at) as previous_registrations
    from bounds b join public.profiles p on p.created_at >= b.previous_at and p.created_at < b.finish
    where p.is_admin is distinct from true
  ), publications as (
    select case when b.finish > b.started_at then count(p.member_id) filter (where p.recorded_at >= b.start_at) end as published,
      case when b.start_at >= b.started_at then count(p.member_id) filter (where p.recorded_at < b.start_at) end as previous_published
    from bounds b left join public.admin_profile_publications p on p.recorded_at >= b.previous_at and p.recorded_at < b.finish
    group by b.finish, b.start_at, b.started_at
  ), first_pages as (
    select distinct on (a.visit_id) a.visit_id, a.page, a.opened_at
    from bounds b join public.visitor_activity a on a.opened_at >= b.start_at - interval '4 hours' and a.opened_at < b.finish
    order by a.visit_id, a.opened_at, a.page_id
  ), journeys as (
    select v.visit_id, v.page, c.channel, c.name, s.recorded_at as signup_at, a.recorded_at as account_at,
      p.recorded_at as publication_at, r.recorded_at as request_at
    from first_pages v cross join bounds b
    left join public.visitor_campaigns c on c.visit_id = v.visit_id
    left join public.visitor_growth_events s on s.visit_id = v.visit_id and s.milestone = 'signup_started'
      and s.recorded_at between v.opened_at and v.opened_at + interval '4 hours'
    left join public.visitor_growth_events a on a.visit_id = v.visit_id and a.milestone = 'account_created'
      and a.recorded_at between s.recorded_at and v.opened_at + interval '4 hours'
    left join public.visitor_growth_events p on p.visit_id = v.visit_id and p.milestone = 'profile_published'
      and p.recorded_at between a.recorded_at and v.opened_at + interval '4 hours'
    left join public.visitor_growth_events r on r.visit_id = v.visit_id and r.milestone = 'request_sent'
      and r.recorded_at between p.recorded_at and v.opened_at + interval '4 hours'
    where v.opened_at >= greatest(b.start_at, b.started_at, now() - interval '30 days' + interval '4 hours')
  ), campaigns as (
    select channel, name, count(*) as visits, count(account_at) as registrations, count(publication_at) as publications
    from journeys where channel is not null group by channel, name
    order by visits desc, channel, name limit 50
  ), request_activity as (
    select m.sender_id, m.created_at
    from bounds b join public.match_requests m on m.created_at >= b.start_at and m.created_at < b.finish
  ), connections as (
    select c.member_a_id, c.member_b_id, c.connected_at
    from bounds b join public.connections c on c.connected_at >= b.start_at and c.connected_at < b.finish
  ), messages as (
    select m.chat_id, m.sender_id, m.created_at
    from bounds b join public.messages m on m.created_at >= b.start_at and m.created_at < b.finish
  ), returning_members as (
    select member_id from (
      select sender_id as member_id, created_at as happened_at from request_activity
      union all select sender_id, created_at from messages
      union all select member_a_id, connected_at from connections
      union all select member_b_id, connected_at from connections
    ) a group by member_id having count(distinct (happened_at at time zone 'Europe/London')::date) > 1
  ), first_payments as (
    select distinct on (i.user_id) i.plan_code, i.verified_at
    from public.payment_intents i
    where i.provider = 'stripe' and i.status = 'paid' and i.amount_pence > 0
      and i.plan_code in ('plus','premium') and i.verified_at is not null
    order by i.user_id, i.verified_at, i.id
  ), mrr as (
    select upper(i.currency) as currency, count(*) as subscriptions,
      round(sum(i.amount_pence::numeric / case i.billing_term when 'six_months' then 6 when 'three_months' then 3 else 1 end)) as minor_units
    from public.user_subscriptions s join public.payment_intents i on i.id = s.payment_intent_id
    where s.provider = 'stripe' and s.status = 'active' and s.plan_code in ('plus','premium')
      and s.current_period_end > now() and i.provider = 'stripe' and i.status = 'paid' and i.amount_pence > 0
    group by upper(i.currency)
  )
  select jsonb_build_object(
    'today', b.today, 'days', b.days, 'tracking_started', b.started_at,
    'comparison', to_jsonb(t) || to_jsonb(g) || to_jsonb(p),
    'funnel', (select jsonb_build_object('homepage',count(*),'signup',count(signup_at),'account',count(account_at),
      'profile',count(publication_at),'request',count(request_at)) from journeys where page = '/'),
    'campaigns', coalesce((select jsonb_agg(to_jsonb(c) order by visits desc, channel, name) from campaigns c), '[]'::jsonb),
    'engagement', jsonb_build_object(
      'returning', (select count(*) from returning_members),
      'sent', (select count(*) from request_activity),
      'accepted', (select count(*) from connections),
      'first_replies', (select count(distinct m.chat_id) from messages m
        cross join lateral (select first.sender_id from public.messages first where first.chat_id = m.chat_id
          order by first.created_at, first.id limit 1) opener
        where m.sender_id <> opener.sender_id and not exists (
          select 1 from public.messages prior where prior.chat_id = m.chat_id and prior.sender_id <> opener.sender_id
            and prior.created_at < b.start_at))),
    'billing', jsonb_build_object(
      'plus_upgrades', (select count(*) from first_payments f where f.plan_code = 'plus' and f.verified_at >= b.start_at and f.verified_at < b.finish),
      'premium_upgrades', (select count(*) from first_payments f where f.plan_code = 'premium' and f.verified_at >= b.start_at and f.verified_at < b.finish),
      'cancellations', (select count(distinct s.subscription_id) from public.admin_subscription_cancellations s
        where s.recorded_at >= b.start_at and s.recorded_at < b.finish),
      'mrr', coalesce((select jsonb_agg(to_jsonb(m) order by currency) from mrr m), '[]'::jsonb)))
  from bounds b cross join traffic t cross join registration g cross join publications p;
$$;
revoke all on function public.admin_growth_report(integer) from public, anon, authenticated;
grant execute on function public.admin_growth_report(integer) to service_role;
