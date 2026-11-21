create table private.family_helper_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null,
  recipient_id uuid references auth.users(id) on delete cascade,
  token_hash bytea not null unique,
  profile_ids uuid[] not null,
  biodata jsonb,
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz
);
create index family_helper_owner_idx on private.family_helper_invites(owner_id, expires_at desc);
create index family_helper_recipient_idx on private.family_helper_invites(recipient_id);
alter table private.family_helper_invites enable row level security;
revoke all on private.family_helper_invites from public, anon, authenticated;

-- The helper receives a small text projection. Never return the underlying profile row.
create function private.family_helper_shortlist(p_owner uuid, p_viewer uuid, p_ids uuid[])
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(
    jsonb_build_object('id', c.id, 'name', c.display_name, 'age', public.age_from_dob(c.dob), 'country', c.country)
    order by c.created_at desc, c.id
  ), '[]'::jsonb)
  from (
    select p.id, p.display_name, p.dob, p.country, s.created_at
    from public.shortlist s
    join public.profiles p on p.id = s.shortlisted_id
    where s.user_id = p_owner and (p_ids is null or p.id = any(p_ids))
      and p.is_published and p.suspended_at is null and p.deletion_requested_at is null
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = p.id and b.blocked_id in (p_owner, p_viewer))
           or (b.blocked_id = p.id and b.blocker_id in (p_owner, p_viewer))
      )
    order by s.created_at desc, p.id
    limit 50
  ) c;
$$;

create function private.family_helper_invitation(
  p_action text, p_email text, p_ids uuid[], p_biodata boolean, p_invite uuid, p_code text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  viewer uuid := auth.uid();
  verified_email text;
  target_email text := lower(trim(p_email));
  summary jsonb;
  items jsonb;
  invitation private.family_helper_invites%rowtype;
  code text;
begin
  if viewer is null or not private.account_session_active() then
    raise exception 'Sign in with an active session' using errcode = '42501';
  end if;

  if p_action = 'open' then
    select lower(trim(email)) into verified_email from auth.users
    where id = viewer and email_confirmed_at is not null;
    if verified_email is null or p_code is null or p_code !~ '^[0-9a-f]{64}$' then return null; end if;
    if exists (select 1 from public.profiles where id = viewer and (suspended_at is not null or deletion_requested_at is not null)) then return null; end if;

    select i.* into invitation
    from private.family_helper_invites i
    join public.profiles owner on owner.id = i.owner_id
    where i.token_hash = sha256(convert_to(p_code, 'UTF8')) and i.recipient_email = verified_email
      and (i.recipient_id is null or i.recipient_id = viewer)
      and i.expires_at > statement_timestamp() and i.revoked_at is null
      and owner.suspended_at is null and owner.deletion_requested_at is null
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = viewer and b.blocked_id = i.owner_id)
           or (b.blocked_id = viewer and b.blocker_id = i.owner_id)
      )
    for update of i;
    if not found then return null; end if;
    if invitation.recipient_id is null then
      update private.family_helper_invites set recipient_id = viewer where id = invitation.id;
    end if;
    select coalesce(jsonb_agg(value - 'id'), '[]'::jsonb) into items
    from jsonb_array_elements(private.family_helper_shortlist(invitation.owner_id, viewer, invitation.profile_ids));
    return jsonb_build_object('biodata', invitation.biodata, 'shortlist', items, 'expiresAt', invitation.expires_at);
  end if;

  select jsonb_build_object('name', display_name, 'age', public.age_from_dob(dob), 'country', country)
  into summary from public.profiles
  where id = viewer and suspended_at is null and deletion_requested_at is null;
  if not found then raise exception 'Active member profile required' using errcode = '42501'; end if;

  case p_action
    when 'preview' then
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', active.id, 'email', active.recipient_email, 'expiresAt', active.expires_at
      ) order by active.expires_at desc), '[]'::jsonb) into items
      from (
        select id, recipient_email, expires_at from private.family_helper_invites
        where owner_id = viewer and expires_at > statement_timestamp() and revoked_at is null
      ) active;
      return jsonb_build_object('biodata', summary, 'shortlist', private.family_helper_shortlist(viewer, viewer, null), 'invites', items);
    when 'create' then
      if target_email is null or length(target_email) > 254 or target_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
        or p_ids is null or cardinality(p_ids) > 20 or (cardinality(p_ids) = 0 and p_biodata is not true) then
        raise exception 'Choose a valid email and something to share' using errcode = '22023';
      end if;
      if jsonb_array_length(private.family_helper_shortlist(viewer, viewer, p_ids)) <> cardinality(p_ids) then
        raise exception 'A selection is no longer available' using errcode = '22023';
      end if;
      perform 1 from public.profiles where id = viewer for update;
      if (select count(*) from private.family_helper_invites
          where owner_id = viewer and expires_at > statement_timestamp() and revoked_at is null) >= 10 then
        raise exception 'Revoke an existing invitation before creating another' using errcode = '22023';
      end if;
      delete from private.family_helper_invites where owner_id = viewer and (expires_at <= statement_timestamp() or revoked_at is not null);
      code := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
      insert into private.family_helper_invites (owner_id, recipient_email, token_hash, profile_ids, biodata)
      values (viewer, target_email, sha256(convert_to(code, 'UTF8')), p_ids, case when p_biodata then summary end)
      returning * into invitation;
      return jsonb_build_object('code', code, 'expiresAt', invitation.expires_at);
    when 'revoke' then
      update private.family_helper_invites set revoked_at = statement_timestamp()
      where id = p_invite and owner_id = viewer and revoked_at is null;
      return to_jsonb(found);
    else
      raise exception 'Invalid invitation action' using errcode = '22023';
  end case;
end;
$$;

create function public.family_helper_invitation(
  p_action text, p_email text default null, p_ids uuid[] default null,
  p_biodata boolean default false, p_invite uuid default null, p_code text default null
) returns jsonb language sql security invoker set search_path = '' as $$
  select private.family_helper_invitation(p_action, p_email, p_ids, p_biodata, p_invite, p_code);
$$;
revoke all on function private.family_helper_shortlist(uuid, uuid, uuid[]),
  private.family_helper_invitation(text, text, uuid[], boolean, uuid, text),
  public.family_helper_invitation(text, text, uuid[], boolean, uuid, text)
from public, anon, authenticated;
grant execute on function private.family_helper_invitation(text, text, uuid[], boolean, uuid, text),
  public.family_helper_invitation(text, text, uuid[], boolean, uuid, text)
to authenticated;
