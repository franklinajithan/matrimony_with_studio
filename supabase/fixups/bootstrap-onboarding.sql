-- One-shot fix for local/prod Supabase projects where onboarding save / photo upload fail.
-- Run in Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run (idempotent).

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Onboarding / privacy columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_published boolean not null default false,
  add column if not exists onboarding_step integer not null default 0,
  add column if not exists onboarding_draft jsonb not null default '{}'::jsonb,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists languages jsonb not null default '[]'::jsonb,
  add column if not exists relationship_intentions jsonb not null default '{}'::jsonb,
  add column if not exists values_lifestyle jsonb not null default '{}'::jsonb,
  add column if not exists cultural_family jsonb not null default '{}'::jsonb,
  add column if not exists settlement jsonb not null default '{}'::jsonb,
  add column if not exists photo_privacy text not null default 'members',
  add column if not exists subscription_plan text not null default 'free',
  add column if not exists subscription_entitlements jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_photo_privacy_check;
alter table public.profiles
  add constraint profiles_photo_privacy_check
  check (photo_privacy in ('members', 'connections', 'hidden'));

alter table public.profiles drop constraint if exists profiles_onboarding_step_check;
alter table public.profiles
  add constraint profiles_onboarding_step_check
  check (onboarding_step >= 0 and onboarding_step <= 8);

-- ---------------------------------------------------------------------------
-- Helper used by RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Table privileges (anon cannot read private profiles)
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon;
revoke all on table public.profiles from public;
grant select, insert, update on table public.profiles to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (
    id = auth.uid()
    and coalesce(is_admin, false) = false
    and coalesce(is_verified, false) = false
  );

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Media storage bucket (required for photo upload)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "media_public_read" on storage.objects;
drop policy if exists "media_authenticated_insert" on storage.objects;
drop policy if exists "media_authenticated_update" on storage.objects;
drop policy if exists "media_authenticated_delete" on storage.objects;
drop policy if exists "media_select_authenticated" on storage.objects;
drop policy if exists "media_insert_own_folder" on storage.objects;
drop policy if exists "media_update_own_folder" on storage.objects;
drop policy if exists "media_delete_own_folder" on storage.objects;

create policy "media_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media');

create policy "media_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "media_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "media_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Discovery feed (what /discover and dashboard suggestions read)
-- ---------------------------------------------------------------------------
create or replace function public.age_from_dob(dob text)
returns integer
language plpgsql
stable
as $$
begin
  if dob is null or btrim(dob) = '' then
    return null;
  end if;
  return date_part('year', age(current_date, dob::date))::integer;
exception when others then
  return null;
end;
$$;

create or replace view public.discovery_profiles
  with (security_invoker = false)
as
select
  id,
  display_name,
  bio,
  case when photo_privacy = 'hidden' then null else photo_url end as photo_url,
  data_ai_hint,
  location,
  profession,
  country,
  region,
  languages,
  is_verified,
  case
    when photo_privacy in ('members', 'connections') then additional_photo_urls
    else '[]'::jsonb
  end as additional_photo_urls,
  public.age_from_dob(dob) as age_years,
  created_at,
  updated_at
from public.profiles
where is_published = true;

revoke all on table public.discovery_profiles from anon;
revoke all on table public.discovery_profiles from public;
grant select on table public.discovery_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Interests / connections / shortlist (Phase 2B essentials)
-- ---------------------------------------------------------------------------
alter table public.match_requests
  add column if not exists message text,
  add column if not exists withdrawn_at timestamptz;

alter table public.match_requests drop constraint if exists match_requests_status_check;
alter table public.match_requests
  add constraint match_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'withdrawn', 'declined_by_sender', 'declined_by_receiver'));

grant select, insert, update on table public.match_requests to authenticated;

alter table public.match_requests enable row level security;

drop policy if exists "match_requests_select_involved" on public.match_requests;
create policy "match_requests_select_involved"
  on public.match_requests for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "match_requests_insert_as_sender" on public.match_requests;
create policy "match_requests_insert_as_sender"
  on public.match_requests for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and sender_id != receiver_id
    and status = 'pending'
  );

drop policy if exists "match_requests_update_involved" on public.match_requests;
create policy "match_requests_update_involved"
  on public.match_requests for update
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid())
  with check (
    (sender_id = auth.uid() and status = 'withdrawn')
    or (receiver_id = auth.uid() and status in ('accepted', 'declined'))
  );

create table if not exists public.shortlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shortlisted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, shortlisted_id)
);

alter table public.shortlist enable row level security;

drop policy if exists "shortlist_select_own" on public.shortlist;
create policy "shortlist_select_own"
  on public.shortlist for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "shortlist_insert_own" on public.shortlist;
create policy "shortlist_insert_own"
  on public.shortlist for insert
  to authenticated
  with check (user_id = auth.uid() and user_id != shortlisted_id);

drop policy if exists "shortlist_delete_own" on public.shortlist;
create policy "shortlist_delete_own"
  on public.shortlist for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on table public.shortlist to authenticated;

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  member_a_id uuid not null references auth.users(id) on delete cascade,
  member_b_id uuid not null references auth.users(id) on delete cascade,
  connected_at timestamptz not null default now(),
  created_from_request_id uuid references public.match_requests(id) on delete set null,
  check (member_a_id < member_b_id),
  unique(member_a_id, member_b_id)
);

alter table public.connections enable row level security;

drop policy if exists "connections_select_involved" on public.connections;
create policy "connections_select_involved"
  on public.connections for select
  to authenticated
  using (member_a_id = auth.uid() or member_b_id = auth.uid());

drop policy if exists "connections_insert_involved" on public.connections;
create policy "connections_insert_involved"
  on public.connections for insert
  to authenticated
  with check (
    (member_a_id = auth.uid() or member_b_id = auth.uid())
    and member_a_id != member_b_id
    and member_a_id < member_b_id
  );

drop policy if exists "connections_delete_involved" on public.connections;
create policy "connections_delete_involved"
  on public.connections for delete
  to authenticated
  using (member_a_id = auth.uid() or member_b_id = auth.uid());

grant select, insert, delete on table public.connections to authenticated;

-- ---------------------------------------------------------------------------
-- Ensure every new auth user gets a profiles row (onboarding starts empty)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, photo_url, is_published, onboarding_step, onboarding_draft)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'photo_url', new.raw_user_meta_data->>'avatar_url', ''),
    false,
    0,
    '{}'::jsonb
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing auth users missing a row
insert into public.profiles (id, email, display_name, is_published, onboarding_step, onboarding_draft)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', ''),
  false,
  0,
  '{}'::jsonb
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
