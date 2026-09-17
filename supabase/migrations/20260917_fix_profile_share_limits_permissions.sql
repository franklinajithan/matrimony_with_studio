-- Keep production share-link limits aligned with the application and prevent anonymous link creation.
create or replace function public.create_profile_share(
  p_profile_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table(link_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_link_id uuid;
  v_expires timestamptz;
begin
  if v_owner is null then raise exception 'Unauthorized'; end if;
  if p_token_hash is null or length(trim(p_token_hash)) < 32 then raise exception 'Invalid share token'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '49 hours' then raise exception 'Invalid expiry'; end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_profile_id
      and coalesce(p.is_published, false) = true
  ) then
    raise exception 'Profile not found or unavailable';
  end if;

  if (
    select count(*) from public.profile_share_links l
    where l.owner_id = v_owner
      and l.created_at >= now() - interval '24 hours'
  ) >= 20 then
    raise exception 'Share limit reached. Try again later.';
  end if;

  if (
    select count(*) from public.profile_share_links l
    where l.owner_id = v_owner
      and l.revoked_at is null
      and l.expires_at > now()
  ) >= 10 then
    raise exception 'You already have the maximum number of active share links.';
  end if;

  insert into public.profile_share_links(profile_id, owner_id, token_hash, expires_at)
  values (p_profile_id, v_owner, lower(trim(p_token_hash)), p_expires_at)
  returning id, profile_share_links.expires_at into v_link_id, v_expires;

  return query select v_link_id, v_expires;
end;
$$;

revoke all on function public.create_profile_share(uuid, text, timestamptz) from public;
revoke execute on function public.create_profile_share(uuid, text, timestamptz) from anon;
grant execute on function public.create_profile_share(uuid, text, timestamptz) to authenticated;

notify pgrst, 'reload schema';
