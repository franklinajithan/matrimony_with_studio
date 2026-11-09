-- Retain the existing publication and photo privacy rules in an internal source.
do $$
begin
  perform set_config('search_path', 'pg_catalog', true);
  execute 'create view private.membership_profile_details as '
    || pg_get_viewdef('public.discovery_profiles'::regclass, true);
end;
$$;
revoke all on private.membership_profile_details from public, anon, authenticated;

create function private.membership_advanced_search_enabled()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select p.entitlements -> 'advancedFilters' = 'true'::jsonb
    from public.subscription_plans p
    where auth.uid() is not null and p.is_active and p.code = private.member_membership_tier(auth.uid())
  ), false);
$$;
revoke all on function private.membership_advanced_search_enabled() from public, anon;
grant execute on function private.membership_advanced_search_enabled() to authenticated;

-- The public discovery surface supplies cards and basic filters. Advanced
-- discovery fields are only projected for viewers with the current entitlement.
create or replace view public.discovery_profiles as
select p.id, p.display_name, null::text as bio, p.photo_url, p.data_ai_hint,
  p.location, p.profession, p.country, p.region, p.languages, p.is_verified,
  '[]'::jsonb as additional_photo_urls, p.age_years, p.created_at, p.updated_at, p.religion,
  case when access.advanced then p.height end as height,
  case when access.advanced then p.education_level end as education_level,
  p.smoking_habits, p.drinking_habits,
  null::jsonb as relationship_intentions, null::jsonb as values_lifestyle,
  null::jsonb as cultural_family, null::jsonb as settlement,
  case when access.advanced then p.extra else
    jsonb_build_object('gender', p.extra -> 'gender', 'matchDetails',
      jsonb_build_object('gender', p.extra #> '{matchDetails,gender}'))
  end as extra
from private.membership_profile_details p
cross join (select (select private.membership_advanced_search_enabled()) as advanced) access;
revoke all on public.discovery_profiles from public, anon;
grant select on public.discovery_profiles to authenticated;

create function public.open_member_profile(p_profile_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  details jsonb;
begin
  if viewer is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select to_jsonb(p) into details from private.membership_profile_details p where p.id = p_profile_id;
  if details is null then
    return null;
  end if;
  perform public.consume_member_profile_view(p_profile_id);
  return details;
end;
$$;
revoke all on function public.open_member_profile(uuid) from public, anon;
grant execute on function public.open_member_profile(uuid) to authenticated;

-- ON CONFLICT retries do not fire an AFTER INSERT trigger. A quota failure
-- still rolls back both the inserted message and its usage increment.
drop trigger enforce_message_membership_quota on public.messages;
create trigger enforce_message_membership_quota after insert on public.messages
for each row execute function private.enforce_message_membership_quota();

create function public.send_member_message(p_message_id uuid, p_chat_id text, p_text text)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  sender uuid := auth.uid();
  recipient uuid;
  sent_at timestamptz;
begin
  if sender is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_message_id is null or nullif(btrim(p_text), '') is null then
    raise exception 'Message text and ID are required' using errcode = '22023';
  end if;
  select case when c.participant_1 = sender then c.participant_2 else c.participant_1 end
  into recipient from public.chats c
  where c.id = p_chat_id and sender in (c.participant_1, c.participant_2);
  if recipient is null then
    raise exception 'Chat unavailable' using errcode = '42501';
  end if;

  insert into public.messages(id, chat_id, sender_id, text, is_read)
  values (p_message_id, p_chat_id, sender, p_text, false)
  on conflict (id) do nothing returning created_at into sent_at;
  if not found then
    if not exists (select 1 from public.messages m where m.id = p_message_id
      and m.chat_id = p_chat_id and m.sender_id = sender and m.text = p_text) then
      raise exception 'Message ID already used' using errcode = '23505';
    end if;
    return;
  end if;

  update public.chats c set
    unread_by = coalesce(c.unread_by, '{}'::jsonb) || jsonb_build_object(
      sender::text, 0, recipient::text, coalesce((c.unread_by ->> recipient::text)::integer, 0) + 1),
    last_message_text = case when c.last_message_at > sent_at then c.last_message_text else p_text end,
    last_message_sender_id = case when c.last_message_at > sent_at then c.last_message_sender_id else sender end,
    last_message_at = greatest(c.last_message_at, sent_at)
  where c.id = p_chat_id;
  if not found then
    raise exception 'Chat could not be updated' using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.send_member_message(uuid,text,text) from public, anon;
grant execute on function public.send_member_message(uuid,text,text) to authenticated;

-- Members can mark messages read. Message content and identity are immutable
-- through the member API so updating an old row cannot bypass sending quotas.
revoke update on public.messages from public, anon, authenticated;
grant update (is_read) on public.messages to authenticated;
