-- PROPOSAL ONLY: do not apply to production without release approval.
-- Requires the existing account lifecycle member_is_active(uuid) helper.
-- Preserve the public token-limited payload, but respect connection-only photos
-- and immediately hide links for suspended/deactivated/deleting members.
create or replace function public.resolve_profile_share(p_token_hash text)
returns table (
  link_id uuid,
  profile_id uuid,
  expires_at timestamptz,
  display_name text,
  age_years integer,
  location text,
  profession text,
  bio text,
  photo_url text,
  is_verified boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_token_hash is null or length(trim(p_token_hash)) < 32 then return; end if;

  return query
  select
    l.id,
    l.profile_id,
    l.expires_at,
    coalesce(nullif(trim(p.display_name), ''), 'Member')::text,
    case
      when p.dob ~ '^\d{4}-\d{2}-\d{2}$'
        and p.dob::date <= current_date - interval '18 years'
        and p.dob::date >= current_date - interval '120 years'
      then extract(year from age(current_date, p.dob::date))::integer
      else null
    end,
    nullif(trim(p.location), '')::text,
    nullif(trim(p.profession), '')::text,
    nullif(trim(p.bio), '')::text,
    case
      when p.photo_privacy = 'members' then nullif(trim(p.photo_url), '')::text
      else null
    end,
    coalesce(p.is_verified, false)
  from public.profile_share_links l
  inner join public.profiles p on p.id = l.profile_id
  where l.token_hash = lower(trim(p_token_hash))
    and l.revoked_at is null
    and l.expires_at > now()
    and coalesce(p.is_published, false) = true
    and public.member_is_active(p.id)
    and public.member_is_active(l.owner_id)
  limit 1;
end;
$$;

revoke all on function public.resolve_profile_share(text) from public;
grant execute on function public.resolve_profile_share(text) to anon, authenticated;
notify pgrst, 'reload schema';

-- Trigger execution is independent of direct function EXECUTE privileges.
-- Internal profile-reference assignment is not a client RPC.
revoke all on function public.assign_member_public_reference() from public, anon, authenticated;
