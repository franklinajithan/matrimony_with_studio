-- Create / repair the media bucket used for profile photos site-wide.
-- Run in Supabase Dashboard → SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Reset policies
drop policy if exists "media_public_read" on storage.objects;
drop policy if exists "media_select_authenticated" on storage.objects;
drop policy if exists "media_authenticated_insert" on storage.objects;
drop policy if exists "media_authenticated_update" on storage.objects;
drop policy if exists "media_authenticated_delete" on storage.objects;
drop policy if exists "media_insert_own_folder" on storage.objects;
drop policy if exists "media_update_own_folder" on storage.objects;
drop policy if exists "media_delete_own_folder" on storage.objects;

-- Anyone can view profile photos (needed for <img src> without expiring signed URLs)
create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

-- Members can upload only into their own folder: users/<auth.uid()>/...
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
