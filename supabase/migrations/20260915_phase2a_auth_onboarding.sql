-- Phase 2A: additive profile privacy, onboarding, and storage hardening.
-- Does not drop or replace existing tables.

create extension if not exists pg_trgm;

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

alter table public.profiles
  drop constraint if exists profiles_photo_privacy_check;
alter table public.profiles
  add constraint profiles_photo_privacy_check
  check (photo_privacy in ('members', 'connections', 'hidden'));

alter table public.profiles
  drop constraint if exists profiles_onboarding_step_check;
alter table public.profiles
  add constraint profiles_onboarding_step_check
  check (onboarding_step >= 0 and onboarding_step <= 8);

create index if not exists profiles_is_published_idx
  on public.profiles (is_published)
  where is_published = true;

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, photo_url, is_published, onboarding_step)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'photo_url', new.raw_user_meta_data->>'avatar_url', ''),
    false,
    0
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      return new;
    end if;
    if new.id is distinct from auth.uid() then
      raise exception 'Cannot create a profile for another user';
    end if;
    if new.is_admin is true or new.is_verified is true then
      raise exception 'Members cannot set verification flags or roles';
    end if;
    if coalesce(new.subscription_plan, 'free') is distinct from 'free'
       or coalesce(new.subscription_entitlements, '{}'::jsonb) is distinct from '{}'::jsonb then
      raise exception 'Members cannot set subscription entitlements';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Profile owner cannot be changed';
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin
     or new.is_verified is distinct from old.is_verified then
    raise exception 'Only admins can change admin or verification status';
  end if;

  if new.subscription_plan is distinct from old.subscription_plan
     or new.subscription_entitlements is distinct from old.subscription_entitlements then
    raise exception 'Members cannot change subscription entitlements';
  end if;

  if new.email is distinct from old.email then
    raise exception 'Email must be changed through account settings';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_privileged_profile_fields on public.profiles;
create trigger protect_privileged_profile_fields
  before insert or update on public.profiles
  for each row execute function public.protect_privileged_profile_fields();

-- Full profile rows: owner or admin only. Anonymous cannot read private fields.
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
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

revoke all on table public.profiles from anon;
revoke all on table public.profiles from public;
grant select, insert, update on table public.profiles to authenticated;

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

-- Photo storage: members may only write inside their own folder. Anon cannot read.
update storage.buckets
set public = false
where id = 'media';

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

notify pgrst, 'reload schema';
