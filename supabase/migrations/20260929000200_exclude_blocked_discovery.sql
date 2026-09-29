-- Exclude blocked members from discovery
-- Members who have blocked each other should not appear in discovery results

-- Update the discovery_profiles view to exclude blocked members
-- A member should not see anyone they've blocked or anyone who has blocked them
create or replace view public.discovery_profiles as
select 
  p.id,
  p.display_name,
  p.bio,
  case when p.photo_privacy='hidden' then null::text else p.photo_url end as photo_url,
  p.data_ai_hint,
  p.location,
  p.profession,
  p.country,
  p.region,
  p.languages,
  p.is_verified,
  case 
    when p.photo_privacy = any(array['members'::text,'connections'::text]) 
    then p.additional_photo_urls 
    else '[]'::jsonb 
  end as additional_photo_urls,
  public.age_from_dob(p.dob) as age_years,
  p.created_at,
  p.updated_at,
  p.religion,
  p.height,
  p.education_level,
  p.smoking_habits,
  p.drinking_habits,
  p.relationship_intentions,
  p.values_lifestyle,
  p.cultural_family,
  p.settlement,
  jsonb_build_object(
    'gender', p.extra->'gender',
    'matchDetails', jsonb_strip_nulls(
      jsonb_build_object(
        'gender', p.extra->'matchDetails'->'gender',
        'maritalStatus', p.extra->'matchDetails'->'maritalStatus',
        'country', p.extra->'matchDetails'->'country',
        'languages', p.extra->'matchDetails'->'languages',
        'education', p.extra->'matchDetails'->'education',
        'height', p.extra->'matchDetails'->'height',
        'wantsChildren', p.extra->'matchDetails'->'wantsChildren',
        'relocation', p.extra->'matchDetails'->'relocation',
        'familyInvolvement', p.extra->'matchDetails'->'familyInvolvement',
        'marriageTimeline', p.extra->'matchDetails'->'marriageTimeline',
        'smoking', p.extra->'matchDetails'->'smoking',
        'drinking', p.extra->'matchDetails'->'drinking'
      )
    )
  ) as extra
from public.profiles p
where p.is_published = true 
  and p.suspended_at is null
  -- Exclude members who have a block relationship with the current user
  and not exists (
    select 1 from public.member_blocks mb
    where (mb.blocker_id = auth.uid() and mb.blocked_id = p.id)
       or (mb.blocker_id = p.id and mb.blocked_id = auth.uid())
  );

-- RLS policy for discovery_profiles view
drop policy if exists "discovery_profiles_select_authenticated" on public.discovery_profiles;
create policy "discovery_profiles_select_authenticated"
  on public.discovery_profiles for select
  to authenticated
  using (true);

-- Grant permissions
revoke all on public.discovery_profiles from anon;
grant select on public.discovery_profiles to authenticated;
