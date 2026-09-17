-- Allow a signed-in member to create a temporary token for another published profile.
-- The token itself remains the only public access mechanism.

alter table public.profile_share_links
  drop constraint if exists profile_share_links_owner_matches_profile;

drop policy if exists "profile_share_links_owner_insert" on public.profile_share_links;
create policy "profile_share_links_owner_insert"
  on public.profile_share_links
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = profile_id
        and coalesce(p.is_published, false) = true
    )
  );

-- Resolution remains SECURITY DEFINER and returns only the deliberately limited
-- public payload. Expired/revoked/unpublished links return no row.
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
set search_path = public
as $$
begin
  if p_token_hash is null or length(trim(p_token_hash)) < 32 then return; end if;
  return query
  select l.id, l.profile_id, l.expires_at,
    coalesce(nullif(trim(p.display_name), ''), 'Member')::text,
    case when p.age_years is null or p.age_years < 18 or p.age_years > 120 then null else p.age_years::integer end,
    nullif(trim(p.location), '')::text,
    nullif(trim(p.profession), '')::text,
    nullif(trim(p.bio), '')::text,
    case when coalesce(p.photo_privacy, 'members') = 'hidden' then null else nullif(trim(p.photo_url), '')::text end,
    coalesce(p.is_verified, false)
  from public.profile_share_links l
  inner join public.profiles p on p.id = l.profile_id
  where l.token_hash = lower(trim(p_token_hash))
    and l.revoked_at is null
    and l.expires_at > now()
    and coalesce(p.is_published, false) = true
  limit 1;
end;
$$;

revoke all on function public.resolve_profile_share(text) from public;
grant execute on function public.resolve_profile_share(text) to anon, authenticated;
notify pgrst, 'reload schema';