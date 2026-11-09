-- Existing profiles have no reliable publication timestamp. Leave them undated
-- until they actually enter discovery again.
alter table public.profiles add column discovery_available_at timestamptz;

create function private.track_discovery_availability()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_published is not true or new.suspended_at is not null or new.deletion_requested_at is not null then
    new.discovery_available_at := null;
  elsif tg_op = 'INSERT' or old.is_published is not true
      or old.suspended_at is not null or old.deletion_requested_at is not null then
    new.discovery_available_at := statement_timestamp();
  else
    new.discovery_available_at := old.discovery_available_at;
  end if;
  return new;
end;
$$;
revoke all on function private.track_discovery_availability() from public, anon, authenticated;
create trigger track_discovery_availability
before insert or update on public.profiles
for each row execute function private.track_discovery_availability();

create index profiles_discovery_available_idx on public.profiles (discovery_available_at desc, id desc)
where discovery_available_at is not null;

create table private.dashboard_match_visits (
  member_id uuid primary key references public.profiles(id) on delete cascade,
  visited_at timestamptz not null
);
alter table private.dashboard_match_visits enable row level security;
revoke all on private.dashboard_match_visits from public, anon, authenticated;

create function private.dashboard_match_visit(p_acknowledge timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  viewer uuid := auth.uid();
  opened_at timestamptz := statement_timestamp();
  previous_visit timestamptz;
begin
  if viewer is null or not private.account_session_active() or not public.member_is_active(viewer) then
    raise exception 'Active member session required' using errcode = '42501';
  end if;

  if p_acknowledge is not null and p_acknowledge <= opened_at then
    insert into private.dashboard_match_visits as visits (member_id, visited_at)
    values (viewer, p_acknowledge)
    on conflict (member_id) do update
    set visited_at = greatest(visits.visited_at, excluded.visited_at);
  end if;

  select visited_at into previous_visit
  from private.dashboard_match_visits where member_id = viewer;
  return jsonb_build_object('previous', previous_visit, 'opened', opened_at);
end;
$$;

create function public.dashboard_match_visit(p_acknowledge timestamptz default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.dashboard_match_visit(p_acknowledge);
$$;

create function private.dashboard_new_match_candidates(
  p_since timestamptz, p_until timestamptz, p_before_at timestamptz, p_before_id uuid
)
returns table (available_at timestamptz, member_id uuid, profile jsonb)
language sql stable security definer set search_path = '' as $$
  select p.discovery_available_at, p.id, to_jsonb(d)
  from public.profiles p
  join public.discovery_profiles d on d.id = p.id
  where auth.uid() is not null and private.account_session_active()
    and public.member_is_active(auth.uid())
    and exists (
      select 1 from public.profiles viewer
      where viewer.id = auth.uid() and viewer.is_published and viewer.deletion_requested_at is null
    )
    and p.id <> auth.uid() and p.is_published and p.suspended_at is null
    and p.deletion_requested_at is null and not public.are_blocked(auth.uid(), p.id)
    and p.discovery_available_at > p_since and p.discovery_available_at <= p_until
    and (p_before_at is null or (p.discovery_available_at, p.id) < (p_before_at, p_before_id))
  order by p.discovery_available_at desc, p.id desc
  limit 100;
$$;

create function public.dashboard_new_match_candidates(
  p_since timestamptz, p_until timestamptz, p_before_at timestamptz default null, p_before_id uuid default null
)
returns table (available_at timestamptz, member_id uuid, profile jsonb)
language sql stable security invoker set search_path = '' as $$
  select * from private.dashboard_new_match_candidates(p_since, p_until, p_before_at, p_before_id);
$$;

revoke all on function private.dashboard_match_visit(timestamptz),
  public.dashboard_match_visit(timestamptz),
  private.dashboard_new_match_candidates(timestamptz, timestamptz, timestamptz, uuid),
  public.dashboard_new_match_candidates(timestamptz, timestamptz, timestamptz, uuid)
from public, anon, authenticated;
grant execute on function private.dashboard_match_visit(timestamptz),
  public.dashboard_match_visit(timestamptz),
  private.dashboard_new_match_candidates(timestamptz, timestamptz, timestamptz, uuid),
  public.dashboard_new_match_candidates(timestamptz, timestamptz, timestamptz, uuid)
to authenticated;
