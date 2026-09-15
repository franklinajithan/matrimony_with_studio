-- CupidMatch / MatchCraft — PostgreSQL schema for Supabase
-- Run this in the Supabase SQL editor (or via the CLI) after creating a project.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  bio text,
  photo_url text,
  data_ai_hint text,
  location text,
  profession text,
  height text,
  dob text,
  religion text,
  caste text,
  language text,
  hobbies text,
  favorite_movies text,
  favorite_music text,
  education_level text,
  smoking_habits text,
  drinking_habits text,
  sun_sign text,
  moon_sign text,
  nakshatra text,
  horoscope_info text,
  horoscope_file_name text,
  horoscope_file_url text,
  additional_photo_urls jsonb not null default '[]'::jsonb,
  is_admin boolean not null default false,
  is_verified boolean not null default false,
  last_seen_like_notifications_at timestamptz,
  last_seen_comment_notifications_at timestamptz,
  comment_notifications jsonb not null default '{}'::jsonb,
  extra jsonb not null default '{}'::jsonb,
  search_text text generated always as (
    lower(
      coalesce(display_name, '') || ' ' ||
      coalesce(profession, '') || ' ' ||
      coalesce(location, '') || ' ' ||
      coalesce(bio, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_display_name_idx on public.profiles (display_name);
create index if not exists profiles_search_text_trgm_idx on public.profiles using gin (search_text gin_trgm_ops);
create index if not exists profiles_display_name_trgm_idx on public.profiles using gin (display_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Likes
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  liker_id uuid not null references public.profiles (id) on delete cascade,
  liked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (liker_id, liked_id),
  check (liker_id <> liked_id)
);

create index if not exists likes_liked_id_idx on public.likes (liked_id);

-- ---------------------------------------------------------------------------
-- Match requests (id is a stable composite key so chat URLs stay uid1_uid2)
-- ---------------------------------------------------------------------------
create table if not exists public.match_requests (
  id text primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined_by_sender', 'declined_by_receiver')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index if not exists match_requests_receiver_status_idx
  on public.match_requests (receiver_id, status, created_at);

-- ---------------------------------------------------------------------------
-- Chats + messages
-- ---------------------------------------------------------------------------
create table if not exists public.chats (
  id text primary key,
  participant_1 uuid not null references public.profiles (id) on delete cascade,
  participant_2 uuid not null references public.profiles (id) on delete cascade,
  participant_details jsonb not null default '{}'::jsonb,
  last_message_text text,
  last_message_sender_id uuid,
  last_message_at timestamptz default now(),
  unread_by jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (participant_1 < participant_2)
);

create index if not exists chats_participant_1_idx on public.chats (participant_1);
create index if not exists chats_participant_2_idx on public.chats (participant_2);
create index if not exists chats_last_message_at_idx on public.chats (last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null references public.chats (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at);

-- ---------------------------------------------------------------------------
-- Posts (comments stay denormalized in comment_list for a 1:1 Firebase mapping)
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_name text,
  user_avatar text,
  content text not null,
  likes_count integer not null default 0,
  liked_by uuid[] not null default '{}',
  comments_count integer not null default 0,
  comment_list jsonb not null default '[]'::jsonb,
  last_liked_at timestamptz,
  last_commented_at timestamptz,
  comment_notifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);

-- ---------------------------------------------------------------------------
-- Success stories
-- ---------------------------------------------------------------------------
create table if not exists public.success_stories (
  id uuid primary key default gen_random_uuid(),
  couple_names text not null,
  story_text text not null,
  original_story_text text,
  photo_url text,
  photo_storage_path text,
  contact_email text,
  submitted_by_uid uuid references public.profiles (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists success_stories_status_submitted_at_idx
  on public.success_stories (status, submitted_at desc);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists match_requests_set_updated_at on public.match_requests;
create trigger match_requests_set_updated_at
  before update on public.match_requests
  for each row execute function public.set_updated_at();

drop trigger if exists success_stories_set_updated_at on public.success_stories;
create trigger success_stories_set_updated_at
  before update on public.success_stories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'photo_url', new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Admin helpers (security definer to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- SQL editor / service role (no JWT) can always change these.
  if auth.uid() is null then
    return new;
  end if;

  if (new.is_admin is distinct from old.is_admin or new.is_verified is distinct from old.is_verified)
     and not public.is_admin() then
    raise exception 'Only admins can change admin or verification status';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_privileged_profile_fields on public.profiles;
create trigger protect_privileged_profile_fields
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_fields();

-- ---------------------------------------------------------------------------
-- Chat participant helper
-- ---------------------------------------------------------------------------
create or replace function public.is_chat_participant(p_chat_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chats
    where id = p_chat_id
      and (participant_1 = auth.uid() or participant_2 = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.match_requests enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.success_stories enable row level security;

-- Profiles: owners and admins only. Discovery uses public.discovery_profiles.
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
  with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

revoke all on table public.profiles from anon;
revoke all on table public.profiles from public;
grant select, insert, update on table public.profiles to authenticated;

-- Likes
drop policy if exists "likes_select_authenticated" on public.likes;
create policy "likes_select_authenticated"
  on public.likes for select
  to authenticated
  using (true);

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own"
  on public.likes for insert
  to authenticated
  with check (liker_id = auth.uid());

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own"
  on public.likes for delete
  to authenticated
  using (liker_id = auth.uid());

-- Match requests
drop policy if exists "match_requests_select_participants" on public.match_requests;
create policy "match_requests_select_participants"
  on public.match_requests for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid() or public.is_admin());

drop policy if exists "match_requests_insert_sender" on public.match_requests;
create policy "match_requests_insert_sender"
  on public.match_requests for insert
  to authenticated
  with check (sender_id = auth.uid());

drop policy if exists "match_requests_update_participants" on public.match_requests;
create policy "match_requests_update_participants"
  on public.match_requests for update
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid())
  with check (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "match_requests_delete_participants" on public.match_requests;
create policy "match_requests_delete_participants"
  on public.match_requests for delete
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Chats
drop policy if exists "chats_select_participants" on public.chats;
create policy "chats_select_participants"
  on public.chats for select
  to authenticated
  using (participant_1 = auth.uid() or participant_2 = auth.uid());

drop policy if exists "chats_insert_participants" on public.chats;
create policy "chats_insert_participants"
  on public.chats for insert
  to authenticated
  with check (participant_1 = auth.uid() or participant_2 = auth.uid());

drop policy if exists "chats_update_participants" on public.chats;
create policy "chats_update_participants"
  on public.chats for update
  to authenticated
  using (participant_1 = auth.uid() or participant_2 = auth.uid())
  with check (participant_1 = auth.uid() or participant_2 = auth.uid());

-- Messages
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
  on public.messages for select
  to authenticated
  using (public.is_chat_participant(chat_id));

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid() and public.is_chat_participant(chat_id));

drop policy if exists "messages_update_participants" on public.messages;
create policy "messages_update_participants"
  on public.messages for update
  to authenticated
  using (public.is_chat_participant(chat_id));

-- Posts
drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "posts_update_authenticated" on public.posts;
create policy "posts_update_authenticated"
  on public.posts for update
  to authenticated
  using (true)
  with check (true);

-- Success stories
drop policy if exists "success_stories_select_public_or_owner" on public.success_stories;
create policy "success_stories_select_public_or_owner"
  on public.success_stories for select
  using (
    status = 'approved'
    or submitted_by_uid = auth.uid()
    or public.is_admin()
  );

drop policy if exists "success_stories_insert_authenticated" on public.success_stories;
create policy "success_stories_insert_authenticated"
  on public.success_stories for insert
  to authenticated
  with check (submitted_by_uid = auth.uid() or submitted_by_uid is null);

drop policy if exists "success_stories_update_admin" on public.success_stories;
create policy "success_stories_update_admin"
  on public.success_stories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter table public.profiles replica identity full;
alter table public.likes replica identity full;
alter table public.match_requests replica identity full;
alter table public.chats replica identity full;
alter table public.messages replica identity full;
alter table public.posts replica identity full;
alter table public.success_stories replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.likes;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.match_requests;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.chats;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.posts;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.success_stories;
  exception when duplicate_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

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

-- Phase 2A additive columns, discovery view, and privileged-field protection:
--   supabase/migrations/20260915_phase2a_auth_onboarding.sql
-- Run that file on existing databases. Do not drop tables.

-- After your first signup, promote yourself in the SQL editor:
--   update public.profiles set is_admin = true where email = 'you@example.com';
