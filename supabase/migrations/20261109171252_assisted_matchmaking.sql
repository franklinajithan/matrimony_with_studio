create table private.assisted_matchmaking_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false
);
insert into private.assisted_matchmaking_settings default values;

create table private.assisted_matchmaking_advisers (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table private.assisted_matchmaking_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  note text not null check (length(note) between 1 and 1500),
  preferences jsonb not null,
  status text not null default 'requested' check (status in ('requested','review_ready','changes_requested','approved','closed')),
  candidate_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);
create unique index assisted_matchmaking_one_open on private.assisted_matchmaking_requests(member_id) where status <> 'closed';
create index assisted_matchmaking_queue_idx on private.assisted_matchmaking_requests(updated_at desc);

alter table private.assisted_matchmaking_settings enable row level security;
alter table private.assisted_matchmaking_advisers enable row level security;
alter table private.assisted_matchmaking_requests enable row level security;
revoke all on private.assisted_matchmaking_settings, private.assisted_matchmaking_advisers,
  private.assisted_matchmaking_requests from public, anon, authenticated;

create function private.assisted_matchmaking_candidates(p_member uuid, p_adviser uuid, p_ids uuid[], p_query text)
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'name', c.display_name, 'country', c.country
  ) order by c.display_name, c.id), '[]'::jsonb)
  from (
    select p.id, p.display_name, p.country from public.profiles p
    where p.id <> p_member and p.id <> p_adviser
      and p.is_published and p.suspended_at is null and p.deletion_requested_at is null
      and (p_ids is null or p.id = any(p_ids))
      and (p_query is null or position(lower(p_query) in lower(p.display_name)) > 0)
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = p.id and b.blocked_id in (p_member, p_adviser))
           or (b.blocked_id = p.id and b.blocker_id in (p_member, p_adviser))
      )
    order by p.display_name, p.id limit 20
  ) c;
$$;

create function private.assisted_matchmaking(
  p_action text, p_request uuid, p_note text, p_candidates uuid[]
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  viewer uuid := auth.uid();
  adviser boolean;
  live boolean;
  request_row private.assisted_matchmaking_requests%rowtype;
  list_json jsonb;
  previous_status text;
  next_status text;
begin
  if viewer is null or not private.account_session_active() or not public.member_is_active(viewer)
     or not exists (select 1 from public.profiles where id = viewer and deletion_requested_at is null) then
    raise exception 'Active account required' using errcode = '42501';
  end if;
  select exists (
    select 1 from private.assisted_matchmaking_advisers a where a.user_id = viewer
  ) and public.is_admin() into adviser;
  select exists (select 1 from private.assisted_matchmaking_settings where enabled)
    and exists (
      select 1 from private.assisted_matchmaking_advisers a join public.profiles p on p.id = a.user_id
      where p.is_admin and p.suspended_at is null and p.deletion_requested_at is null
    ) into live;

  if p_action = 'queue' then
    if not adviser then raise exception 'Adviser access required' using errcode = '42501'; end if;
    if not live then return jsonb_build_object('available', false, 'requests', '[]'::jsonb); end if;
    select coalesce(jsonb_agg(to_jsonb(q) - 'candidate_ids' order by q.updated_at desc), '[]'::jsonb) into list_json
    from (
      select r.* from private.assisted_matchmaking_requests r
      join public.profiles p on p.id = r.member_id
      where r.status <> 'closed' and p.is_published and p.suspended_at is null and p.deletion_requested_at is null
      order by r.updated_at desc, r.id limit 100
    ) q;
    return jsonb_build_object('available', true, 'requests', list_json);
  end if;

  if p_action = 'mine' then
    select * into request_row from private.assisted_matchmaking_requests
    where member_id = viewer and status <> 'closed';
    return jsonb_build_object('available', live, 'request', case when found then jsonb_build_object(
      'id', request_row.id, 'status', request_row.status, 'note', request_row.note,
      'shortlist', private.assisted_matchmaking_candidates(viewer, viewer, request_row.candidate_ids, null),
      'sharedCount', cardinality(request_row.candidate_ids)
    ) end);
  end if;

  if p_action = 'submit' then
    if not live then raise exception 'Service unavailable' using errcode = '42501'; end if;
    if p_note is null or length(trim(p_note)) not between 1 and 1500 then
      raise exception 'Enter a request of up to 1500 characters' using errcode = '22023';
    end if;
    insert into private.assisted_matchmaking_requests(member_id, note, preferences)
    select id, trim(p_note), case when jsonb_typeof(prefs.value) = 'object' then prefs.value else '{}'::jsonb end
    from public.profiles
    cross join lateral (select coalesce(extra->'partnerPreferences', extra->'partner_preferences',
      onboarding_draft->'partnerPreferences', onboarding_draft->'partner_preferences') as value) prefs
    where id = viewer and is_published and suspended_at is null and deletion_requested_at is null
    returning * into request_row;
    if not found then raise exception 'Publish your profile first' using errcode = '22023'; end if;
    next_status := 'requested';
  else
    if p_action in ('search','curate') and not adviser then
      raise exception 'Adviser access required' using errcode = '42501';
    end if;
    select * into request_row from private.assisted_matchmaking_requests r
    where r.id = p_request and (r.member_id = viewer or (adviser and p_action in ('search','curate','close')))
    for update;
    if not found then raise exception 'Request unavailable' using errcode = '42501'; end if;
    if p_action <> 'close' and not live then raise exception 'Service unavailable' using errcode = '42501'; end if;
    if p_action in ('search','curate') and not exists (
      select 1 from public.profiles where id = request_row.member_id and is_published
        and suspended_at is null and deletion_requested_at is null
    ) then raise exception 'Request unavailable' using errcode = '42501'; end if;

    previous_status := request_row.status;
    case p_action
      when 'search' then
        if previous_status not in ('requested','changes_requested') then
          raise exception 'This request is unavailable for curation' using errcode = '22023';
        end if;
        if length(trim(coalesce(p_note, ''))) not between 2 and 80 then return '[]'::jsonb; end if;
        return private.assisted_matchmaking_candidates(request_row.member_id, viewer, null, trim(p_note));
      when 'curate' then
        if previous_status not in ('requested','changes_requested') or p_candidates is null
          or cardinality(p_candidates) not between 1 and 8
          or jsonb_array_length(private.assisted_matchmaking_candidates(request_row.member_id, viewer, p_candidates, null)) <> cardinality(p_candidates) then
          raise exception 'Choose one to eight currently eligible profiles' using errcode = '22023';
        end if;
        next_status := 'review_ready';
      when 'approve' then
        if previous_status <> 'review_ready' or (p_candidates is null or not (p_candidates @> request_row.candidate_ids and request_row.candidate_ids @> p_candidates))
          or jsonb_array_length(private.assisted_matchmaking_candidates(viewer, viewer, request_row.candidate_ids, null)) <> cardinality(request_row.candidate_ids) then
          raise exception 'The shortlist changed. Ask the adviser to update it.' using errcode = '22023';
        end if;
        next_status := 'approved';
      when 'request_changes' then
        if previous_status <> 'review_ready' then raise exception 'No shortlist is ready for review' using errcode = '22023'; end if;
        next_status := 'changes_requested';
      when 'close' then
        if previous_status = 'closed' then return '{}'::jsonb; end if;
        next_status := 'closed';
      else
        raise exception 'Invalid request action' using errcode = '22023';
    end case;

    update private.assisted_matchmaking_requests
    set status = next_status, updated_at = statement_timestamp(),
      candidate_ids = case when p_action = 'curate' then p_candidates else candidate_ids end
    where id = request_row.id;
  end if;

  insert into public.admin_audit_log(actor_id, action, target_type, target_id, metadata)
  values (viewer, 'assisted_matchmaking_status_changed', 'assisted_matchmaking_request', request_row.id::text,
    jsonb_build_object('from', previous_status, 'to', next_status));
  return jsonb_build_object('status', next_status);
end;
$$;

create function public.assisted_matchmaking(
  p_action text, p_request uuid default null, p_note text default null, p_candidates uuid[] default null
) returns jsonb language sql security invoker set search_path = '' as $$
  select private.assisted_matchmaking(p_action, p_request, p_note, p_candidates);
$$;
revoke all on function private.assisted_matchmaking_candidates(uuid, uuid, uuid[], text),
  private.assisted_matchmaking(text, uuid, text, uuid[]), public.assisted_matchmaking(text, uuid, text, uuid[])
from public, anon, authenticated;
grant execute on function private.assisted_matchmaking(text, uuid, text, uuid[]),
  public.assisted_matchmaking(text, uuid, text, uuid[]) to authenticated;
