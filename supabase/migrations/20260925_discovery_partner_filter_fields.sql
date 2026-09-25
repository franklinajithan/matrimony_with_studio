-- Expose only matchmaking-safe published profile fields needed by Discover.
-- Keep private profile fields and saved partner preferences out of the public discovery contract.
create or replace view public.discovery_profiles
with (security_invoker = false) as
select
  id, display_name, bio,
  case when photo_privacy = 'hidden' then null else photo_url end as photo_url,
  data_ai_hint, location, profession, country, region, languages, is_verified,
  case when photo_privacy in ('members','connections') then additional_photo_urls else '[]'::jsonb end as additional_photo_urls,
  public.age_from_dob(dob) as age_years,
  created_at, updated_at,
  religion, height, education_level, smoking_habits, drinking_habits,
  relationship_intentions, values_lifestyle, cultural_family, settlement,
  jsonb_build_object(
    'gender', extra->'gender',
    'matchDetails', jsonb_strip_nulls(jsonb_build_object(
      'gender', extra->'matchDetails'->'gender',
      'maritalStatus', extra->'matchDetails'->'maritalStatus',
      'country', extra->'matchDetails'->'country',
      'languages', extra->'matchDetails'->'languages',
      'education', extra->'matchDetails'->'education',
      'height', extra->'matchDetails'->'height',
      'wantsChildren', extra->'matchDetails'->'wantsChildren',
      'relocation', extra->'matchDetails'->'relocation',
      'familyInvolvement', extra->'matchDetails'->'familyInvolvement',
      'marriageTimeline', extra->'matchDetails'->'marriageTimeline',
      'smoking', extra->'matchDetails'->'smoking',
      'drinking', extra->'matchDetails'->'drinking'
    ))
  ) as extra
from public.profiles
where is_published = true;

grant select on public.discovery_profiles to authenticated;
