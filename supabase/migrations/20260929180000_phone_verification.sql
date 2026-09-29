-- Private phone verification state. SMS OTP delivery and verification are handled by Supabase Auth.
alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists phone_verified_at timestamptz;

create unique index if not exists profiles_verified_phone_unique_idx
  on public.profiles (phone_number)
  where phone_number is not null and phone_verified_at is not null;

create or replace function public.protect_profile_phone_verification()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if tg_op='INSERT' and auth.uid() is not null and new.phone_verified_at is not null then
    raise exception 'Members cannot set phone verification state directly' using errcode='42501';
  end if;
  if tg_op='UPDATE' and auth.uid() is not null then
    if new.phone_number is distinct from old.phone_number
       or new.phone_verified_at is distinct from old.phone_verified_at then
      raise exception 'Phone verification state is server controlled' using errcode='42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_phone_verification_trigger on public.profiles;
create trigger protect_profile_phone_verification_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_phone_verification();

revoke all on function public.protect_profile_phone_verification() from public, anon, authenticated;

-- Copy only a phone number that Supabase Auth has already confirmed for the current session.
create or replace function public.sync_verified_phone_from_auth()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_phone text;
  v_confirmed timestamptz;
begin
  if v_uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select phone, phone_confirmed_at into v_phone, v_confirmed
  from auth.users where id=v_uid;
  if v_phone is null or v_confirmed is null then
    raise exception 'Phone number is not verified' using errcode='42501';
  end if;
  if v_phone !~ '^\\+[1-9][0-9]{7,14}$' then
    raise exception 'Verified phone is not valid E.164' using errcode='22023';
  end if;
  update public.profiles
    set phone_number=v_phone, phone_verified_at=v_confirmed
    where id=v_uid;
  if not found then raise exception 'Profile not found' using errcode='P0002'; end if;
  return jsonb_build_object('phone_number',v_phone,'phone_verified_at',v_confirmed);
end $$;

revoke all on function public.sync_verified_phone_from_auth() from public, anon;
grant execute on function public.sync_verified_phone_from_auth() to authenticated;

comment on column public.profiles.phone_number is 'Private E.164 phone number copied from confirmed Supabase Auth state.';
comment on column public.profiles.phone_verified_at is 'Server-controlled timestamp copied from auth.users.phone_confirmed_at.';
