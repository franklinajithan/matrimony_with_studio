-- Temporary profile share links (hashed tokens, 24h expiry). Safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists public.profile_share_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint profile_share_links_owner_matches_profile
    check (owner_id = profile_id)
);

create index if not exists profile_share_links_owner_created_idx
  on public.profile_share_links (owner_id, created_at desc);

create index if not exists profile_share_links_owner_active_idx
  on public.profile_share_links (owner_id)
  where revoked_at is null;

create index if not exists profile_share_links_expires_idx
  on public.profile_share_links (expires_at)
  where revoked_at is null;

alter table public.profile_share_links enable row level security;

drop policy if exists "profile_share_links_owner_select" on public.profile_share_links;
create policy "profile_share_links_owner_select"
  on public.profile_share_links
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "profile_share_links_owner_insert" on public.profile_share_links;
create policy "profile_share_links_owner_insert"
  on public.profile_share_links
  for insert
  to authenticated
  with check (owner_id = auth.uid() and profile_id = auth.uid());

drop policy if exists "profile_share_links_owner_update" on public.profile_share_links;
create policy "profile_share_links_owner_update"
  on public.profile_share_links
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- No public SELECT on the table. Resolution goes through this SECURITY DEFINER RPC only.
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
  if p_token_hash is null or length(trim(p_token_hash)) < 32 then
    return;
  end if;

  return query
  select
    l.id,
    l.profile_id,
    l.expires_at,
    coalesce(nullif(trim(p.display_name), ''), 'Member')::text,
    case
      when p.age_years is null then null
      when p.age_years < 18 or p.age_years > 120 then null
      else p.age_years::integer
    end,
    nullif(trim(p.location), '')::text,
    nullif(trim(p.profession), '')::text,
    nullif(trim(p.bio), '')::text,
    case
      when coalesce(p.photo_privacy, 'members') = 'hidden' then null
      else nullif(trim(p.photo_url), '')::text
    end,
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
