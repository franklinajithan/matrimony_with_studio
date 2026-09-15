-- Seed 10 published demo profiles for Discover.
-- Run AFTER bootstrap-onboarding.sql in the Supabase SQL Editor.
-- Creates auth users + published profiles. Safe to re-run.

create extension if not exists pgcrypto;

-- Helper: upsert a confirmed email user with a known UUID
create or replace function public._seed_auth_user(p_id uuid, p_email text, p_name text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt('DemoPass123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', p_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do update
    set email = excluded.email,
        email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
        raw_user_meta_data = excluded.raw_user_meta_data,
        updated_at = now();

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    p_id,
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do update
    set identity_data = excluded.identity_data,
        updated_at = now();
end;
$$;

select public._seed_auth_user('01a0a652-f929-76ac-bbce-9b3f2c188d5a', 'rajesh.kumar.test@cupidmatch.com', 'Rajesh Kumar');
select public._seed_auth_user('01a0a652-f947-73e7-8499-271e3c1e84d8', 'arun.patel.test@cupidmatch.com', 'Arun Patel');
select public._seed_auth_user('01a0a652-f963-7793-a4da-78dff528095e', 'dinesh.fernando.test@cupidmatch.com', 'Dinesh Fernando');
select public._seed_auth_user('01a0a652-f983-72ec-95e5-6a2f6cafa0ce', 'karthik.reddy.test@cupidmatch.com', 'Karthik Reddy');
select public._seed_auth_user('01a0a652-f9a1-736d-93cf-ac7f98096303', 'vikram.silva.test@cupidmatch.com', 'Vikram Silva');
select public._seed_auth_user('01a0a652-f9c1-70ff-9eef-ad297f2281b0', 'priya.jayawardena.test@cupidmatch.com', 'Priya Jayawardena');
select public._seed_auth_user('01a0a652-f9e0-76ea-bb5b-13ce9e54cca5', 'anjali.perera.test@cupidmatch.com', 'Anjali Perera');
select public._seed_auth_user('01a0a652-f9ff-7f68-ad79-59442a3508bf', 'nithya.rajan.test@cupidmatch.com', 'Nithya Rajan');
select public._seed_auth_user('01a0a652-fa20-782a-9f96-1a38d12e7135', 'kavya.mendis.test@cupidmatch.com', 'Kavya Mendis');
select public._seed_auth_user('01a0a652-fa40-7ce7-836a-e84608163af4', 'roshini.kumar.test@cupidmatch.com', 'Roshini Kumar');

insert into public.profiles (
  id, email, display_name, bio, photo_url, location, profession, dob,
  country, region, languages, relationship_intentions, values_lifestyle,
  cultural_family, settlement, is_published, onboarding_step, education_level,
  religion, height, photo_privacy
) values
(
  '01a0a652-f929-76ac-bbce-9b3f2c188d5a',
  'rajesh.kumar.test@cupidmatch.com',
  'Rajesh Kumar',
  'Software engineer passionate about technology and innovation. Love exploring new places and trying different cuisines.',
  '/profiles/01a0a652-f929-76ac-bbce-9b3f2c188d5a.jpg',
  'Colombo', 'Software Engineer', '1992-03-15', 'Sri Lanka', 'Western Province',
  '["English","Tamil","Sinhala"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"1-2-years"}'::jsonb,
  '{"interests":["Technology","Travel","Cooking"]}'::jsonb,
  '{"family_type":"Nuclear"}'::jsonb,
  '{"open_to_relocation":true}'::jsonb,
  true, 8, 'Bachelors', 'Buddhist', '175 cm', 'members'
),
(
  '01a0a652-f947-73e7-8499-271e3c1e84d8',
  'arun.patel.test@cupidmatch.com',
  'Arun Patel',
  'Marketing professional with a love for adventure and outdoor activities. Family-oriented and looking for a life partner.',
  '/profiles/01a0a652-f947-73e7-8499-271e3c1e84d8.jpg',
  'London', 'Marketing Manager', '1990-07-22', 'United Kingdom', 'Greater London',
  '["English","Tamil"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"ready"}'::jsonb,
  '{"interests":["Sports","Reading","Photography"]}'::jsonb,
  '{"family_type":"Joint"}'::jsonb,
  '{"open_to_relocation":false}'::jsonb,
  true, 8, 'Masters', 'Hindu', '178 cm', 'members'
),
(
  '01a0a652-f963-7793-a4da-78dff528095e',
  'dinesh.fernando.test@cupidmatch.com',
  'Dinesh Fernando',
  'Doctor by profession, music enthusiast by passion. Believe in building meaningful connections.',
  '/profiles/01a0a652-f963-7793-a4da-78dff528095e.jpg',
  'Toronto', 'Medical Doctor', '1988-11-08', 'Canada', 'Ontario',
  '["English","Sinhala"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"exploring"}'::jsonb,
  '{"interests":["Music","Healthcare","Volunteering"]}'::jsonb,
  '{"family_type":"Nuclear"}'::jsonb,
  '{"open_to_relocation":true}'::jsonb,
  true, 8, 'Doctorate', 'Catholic', '180 cm', 'members'
),
(
  '01a0a652-f983-72ec-95e5-6a2f6cafa0ce',
  'karthik.reddy.test@cupidmatch.com',
  'Karthik Reddy',
  'Finance analyst who enjoys good conversations over coffee. Looking for someone to build a future with.',
  '/profiles/01a0a652-f983-72ec-95e5-6a2f6cafa0ce.jpg',
  'Melbourne', 'Finance Analyst', '1993-05-30', 'Australia', 'Victoria',
  '["English","Tamil"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"1-2-years"}'::jsonb,
  '{"interests":["Finance","Travel","Food"]}'::jsonb,
  '{"family_type":"Nuclear"}'::jsonb,
  '{"open_to_relocation":true}'::jsonb,
  true, 8, 'Masters', 'Hindu', '172 cm', 'members'
),
(
  '01a0a652-f9a1-736d-93cf-ac7f98096303',
  'vikram.silva.test@cupidmatch.com',
  'Vikram Silva',
  'Entrepreneur passionate about sustainability and social impact. Love hiking and meaningful conversations.',
  '/profiles/01a0a652-f9a1-736d-93cf-ac7f98096303.jpg',
  'Kandy', 'Business Owner', '1991-09-12', 'Sri Lanka', 'Central Province',
  '["English","Sinhala","Tamil"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"ready"}'::jsonb,
  '{"interests":["Business","Environment","Fitness"]}'::jsonb,
  '{"family_type":"Joint"}'::jsonb,
  '{"open_to_relocation":false}'::jsonb,
  true, 8, 'Bachelors', 'Buddhist', '176 cm', 'members'
),
(
  '01a0a652-f9c1-70ff-9eef-ad297f2281b0',
  'priya.jayawardena.test@cupidmatch.com',
  'Priya Jayawardena',
  'School teacher who loves literature, classical music, and community work. Looking for a kind and grounded partner.',
  '/profiles/01a0a652-f9c1-70ff-9eef-ad297f2281b0.jpg',
  'Jaffna', 'School Teacher', '1994-02-18', 'Sri Lanka', 'Northern Province',
  '["Tamil","English"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"1-2-years"}'::jsonb,
  '{"interests":["Teaching","Literature","Music"]}'::jsonb,
  '{"family_type":"Joint"}'::jsonb,
  '{"open_to_relocation":true}'::jsonb,
  true, 8, 'Bachelors', 'Hindu', '160 cm', 'members'
),
(
  '01a0a652-f9e0-76ea-bb5b-13ce9e54cca5',
  'anjali.perera.test@cupidmatch.com',
  'Anjali Perera',
  'Cybersecurity specialist curious about the world. Enjoy travel, photography, and quiet weekends.',
  '/profiles/01a0a652-f9e0-76ea-bb5b-13ce9e54cca5.jpg',
  'Sydney', 'Cybersecurity Specialist', '1992-08-09', 'Australia', 'New South Wales',
  '["English","Sinhala"]'::jsonb,
  '{"lookingFor":"long-term","relationshipTimeline":"exploring"}'::jsonb,
  '{"interests":["Security","Travel","Photography"]}'::jsonb,
  '{"family_type":"Nuclear"}'::jsonb,
  '{"open_to_relocation":true}'::jsonb,
  true, 8, 'Masters', 'Buddhist', '165 cm', 'members'
),
(
  '01a0a652-f9ff-7f68-ad79-59442a3508bf',
  'nithya.rajan.test@cupidmatch.com',
  'Nithya Rajan',
  'Architect passionate about sustainable design and cultural heritage. Looking for a life partner who appreciates art and culture.',
  '/profiles/01a0a652-f9ff-7f68-ad79-59442a3508bf.jpg',
  'Dubai', 'Architect', '1991-06-14', 'United Arab Emirates', 'Dubai',
  '["English","Tamil","Sinhala"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"1-2-years"}'::jsonb,
  '{"interests":["Architecture","Art","Travel"]}'::jsonb,
  '{"family_type":"Nuclear"}'::jsonb,
  '{"open_to_relocation":true}'::jsonb,
  true, 8, 'Masters', 'Hindu', '162 cm', 'members'
),
(
  '01a0a652-fa20-782a-9f96-1a38d12e7135',
  'kavya.mendis.test@cupidmatch.com',
  'Kavya Mendis',
  'Healthcare administrator dedicated to improving patient care. Enjoy cooking, gardening, and time with family.',
  '/profiles/01a0a652-fa20-782a-9f96-1a38d12e7135.jpg',
  'Galle', 'Healthcare Administrator', '1993-12-03', 'Sri Lanka', 'Southern Province',
  '["Sinhala","English"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"ready"}'::jsonb,
  '{"interests":["Healthcare","Cooking","Gardening"]}'::jsonb,
  '{"family_type":"Joint"}'::jsonb,
  '{"open_to_relocation":false}'::jsonb,
  true, 8, 'Bachelors', 'Buddhist', '158 cm', 'members'
),
(
  '01a0a652-fa40-7ce7-836a-e84608163af4',
  'roshini.kumar.test@cupidmatch.com',
  'Roshini Kumar',
  'Data scientist fascinated by AI and machine learning. Looking for someone who values growth and partnership.',
  '/profiles/01a0a652-fa40-7ce7-836a-e84608163af4.jpg',
  'Singapore', 'Data Scientist', '1990-04-20', 'Singapore', 'Singapore',
  '["English","Tamil"]'::jsonb,
  '{"lookingFor":"marriage","relationshipTimeline":"exploring"}'::jsonb,
  '{"interests":["Data Science","Learning","Travel"]}'::jsonb,
  '{"family_type":"Nuclear"}'::jsonb,
  '{"open_to_relocation":true}'::jsonb,
  true, 8, 'Masters', 'Hindu', '163 cm', 'members'
)
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  bio = excluded.bio,
  photo_url = excluded.photo_url,
  location = excluded.location,
  profession = excluded.profession,
  dob = excluded.dob,
  country = excluded.country,
  region = excluded.region,
  languages = excluded.languages,
  relationship_intentions = excluded.relationship_intentions,
  values_lifestyle = excluded.values_lifestyle,
  cultural_family = excluded.cultural_family,
  settlement = excluded.settlement,
  is_published = true,
  onboarding_step = 8,
  education_level = excluded.education_level,
  religion = excluded.religion,
  height = excluded.height,
  photo_privacy = 'members',
  updated_at = now();

drop function if exists public._seed_auth_user(uuid, text, text);

-- Quick check: should return 10
select count(*) as published_demo_profiles
from public.profiles
where email like '%@cupidmatch.com' and is_published = true;
