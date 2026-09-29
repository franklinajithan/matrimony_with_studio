-- Phone verification for member registration and onboarding
-- Mobile numbers are stored in E.164 format and kept private (never in public profiles)

-- Add phone fields to profiles
alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists phone_verification_metadata jsonb not null default '{}'::jsonb;

-- Create index for phone lookup (used by server for uniqueness checks)
create index if not exists profiles_phone_number_idx
  on public.profiles (phone_number)
  where phone_number is not null;

-- Constraint: phone number must be unique when set
create unique index if not exists profiles_phone_unique_idx
  on public.profiles (phone_number)
  where phone_number is not null;

-- Function: normalize phone number to E.164 format
create or replace function public.normalize_phone_e164(phone text)
returns text
language plpgsql
immutable
as $$
begin
  -- Remove all non-digit characters except leading +
  -- E.164 format: +[country code][number]
  if phone is null or btrim(phone) = '' then
    return null;
  end if;
  
  -- Remove spaces, dashes, parentheses
  phone := regexp_replace(phone, '[^\+0-9]', '', 'g');
  
  -- Ensure it starts with +
  if not phone ~ '^\+' then
    return null; -- Invalid E.164 format
  end if;
  
  -- Basic validation: should be between 8-15 digits after +
  if length(phone) < 9 or length(phone) > 16 then
    return null;
  end if;
  
  return phone;
end;
$$;

-- Trigger: normalize phone number before insert/update
create or replace function public.normalize_profile_phone()
returns trigger
language plpgsql
as $$
begin
  if new.phone_number is not null then
    new.phone_number := public.normalize_phone_e164(new.phone_number);
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_profile_phone_trigger on public.profiles;
create trigger normalize_profile_phone_trigger
  before insert or update of phone_number on public.profiles
  for each row execute function public.normalize_profile_phone();

-- Function: protect phone verification fields from unauthorized changes
create or replace function public.protect_phone_verification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- On insert, non-admins cannot set verified status
  if tg_op = 'INSERT' then
    if auth.uid() is null then
      return new;
    end if;
    
    if not public.is_admin() then
      if new.phone_verified_at is not null then
        raise exception 'Members cannot mark their phone as verified';
      end if;
    end if;
    
    return new;
  end if;

  -- On update, only admins can change verification status directly
  if tg_op = 'UPDATE' then
    if auth.uid() is null then
      return new;
    end if;

    if public.is_admin() then
      return new;
    end if;

    -- If phone number changed, clear verification
    if new.phone_number is distinct from old.phone_number then
      if new.phone_number is not null and old.phone_verified_at is not null then
        -- Phone changed from verified number to new number - clear verification
        new.phone_verified_at := null;
      end if;
    end if;

    -- Members cannot directly set verified status
    if new.phone_verified_at is distinct from old.phone_verified_at then
      raise exception 'Members cannot change phone verification status directly';
    end if;
    
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_phone_verification_fields_trigger on public.profiles;
create trigger protect_phone_verification_fields_trigger
  before insert or update on public.profiles
  for each row execute function public.protect_phone_verification_fields();

-- Table: phone verification OTP codes (server-side only, no direct RLS access)
create table if not exists public.phone_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phone_number text not null,
  code text not null,
  expires_at timestamptz not null,
  verified boolean not null default false,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index for lookup by user and phone
create index if not exists phone_verification_codes_user_phone_idx
  on public.phone_verification_codes (user_id, phone_number, created_at desc);

-- Index for cleanup of expired codes
create index if not exists phone_verification_codes_expires_at_idx
  on public.phone_verification_codes (expires_at)
  where verified = false;

-- No direct RLS policies - this table is accessed only via Edge Functions/API routes
revoke all on table public.phone_verification_codes from anon;
revoke all on table public.phone_verification_codes from authenticated;
grant select, insert, update on table public.phone_verification_codes to service_role;

-- Function: create verification code (called from Edge Function)
create or replace function public.create_phone_verification_code(
  p_user_id uuid,
  p_phone_number text,
  p_code text,
  p_ttl_seconds integer default 600
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_id uuid;
  v_normalized_phone text;
  v_recent_count integer;
begin
  -- Normalize phone
  v_normalized_phone := public.normalize_phone_e164(p_phone_number);
  if v_normalized_phone is null then
    raise exception 'Invalid phone number format (must be E.164 with country code)';
  end if;

  -- Rate limiting: max 3 codes in last 15 minutes per user
  select count(*)
  into v_recent_count
  from public.phone_verification_codes
  where user_id = p_user_id
    and created_at > now() - interval '15 minutes';
  
  if v_recent_count >= 3 then
    raise exception 'Too many verification attempts. Please try again later.';
  end if;

  -- Invalidate any existing unverified codes for this user+phone
  update public.phone_verification_codes
  set expires_at = now()
  where user_id = p_user_id
    and phone_number = v_normalized_phone
    and verified = false
    and expires_at > now();

  -- Create new code
  insert into public.phone_verification_codes (
    user_id,
    phone_number,
    code,
    expires_at
  ) values (
    p_user_id,
    v_normalized_phone,
    p_code,
    now() + (p_ttl_seconds || ' seconds')::interval
  )
  returning id into v_code_id;

  return v_code_id;
end;
$$;

-- Function: verify code and mark phone as verified
create or replace function public.verify_phone_code(
  p_user_id uuid,
  p_phone_number text,
  p_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_normalized_phone text;
  v_code_record record;
  v_max_attempts integer := 5;
begin
  v_normalized_phone := public.normalize_phone_e164(p_phone_number);
  if v_normalized_phone is null then
    raise exception 'Invalid phone number format';
  end if;

  -- Find the most recent unverified code
  select *
  into v_code_record
  from public.phone_verification_codes
  where user_id = p_user_id
    and phone_number = v_normalized_phone
    and verified = false
    and expires_at > now()
  order by created_at desc
  limit 1;

  if v_code_record is null then
    raise exception 'No valid verification code found. Please request a new code.';
  end if;

  -- Check attempts
  if v_code_record.attempts >= v_max_attempts then
    raise exception 'Too many failed attempts. Please request a new code.';
  end if;

  -- Check code match
  if v_code_record.code <> p_code then
    -- Increment attempts
    update public.phone_verification_codes
    set attempts = attempts + 1
    where id = v_code_record.id;
    
    raise exception 'Incorrect verification code. % attempts remaining.', v_max_attempts - v_code_record.attempts - 1;
  end if;

  -- Success: mark code as verified
  update public.phone_verification_codes
  set verified = true
  where id = v_code_record.id;

  -- Update profile with verified phone
  update public.profiles
  set 
    phone_number = v_normalized_phone,
    phone_verified_at = now(),
    phone_verification_metadata = jsonb_build_object(
      'verified_at', now(),
      'method', 'otp_sms'
    )
  where id = p_user_id;

  return true;
end;
$$;

-- Function: check if phone number is already in use
create or replace function public.is_phone_number_taken(p_phone_number text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_normalized_phone text;
  v_exists boolean;
begin
  v_normalized_phone := public.normalize_phone_e164(p_phone_number);
  if v_normalized_phone is null then
    return false;
  end if;

  select exists(
    select 1
    from public.profiles
    where phone_number = v_normalized_phone
      and phone_verified_at is not null
  ) into v_exists;

  return v_exists;
end;
$$;

-- Cleanup function for expired verification codes (can be run as cron job)
create or replace function public.cleanup_expired_verification_codes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_count integer;
begin
  delete from public.phone_verification_codes
  where verified = false
    and expires_at < now() - interval '24 hours';
  
  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

-- Update discovery_profiles view to ensure phone is never exposed
drop view if exists public.discovery_profiles cascade;
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
  -- Explicitly exclude: phone_number, phone_verified_at, phone_verification_metadata
from public.profiles
where is_published = true;

grant select on table public.discovery_profiles to authenticated;

-- Comment for documentation
comment on column public.profiles.phone_number is 'E.164 format phone number (private, never in discovery)';
comment on column public.profiles.phone_verified_at is 'Timestamp when phone was verified via OTP';
comment on column public.profiles.phone_verification_metadata is 'Verification method and metadata';
comment on table public.phone_verification_codes is 'Server-side OTP codes for phone verification (service_role only)';

notify pgrst, 'reload schema';
