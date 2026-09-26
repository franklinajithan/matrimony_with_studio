-- Prevent members (and direct authenticated admin clients) from changing privileged profile fields.
-- Trusted SECURITY DEFINER operations must separately authorize and audit each change.
create or replace function public.protect_profile_privileged_fields()
returns trigger language plpgsql set search_path = ''
as $$
begin
 if current_user not in ('postgres','service_role','supabase_admin') and
 (new.is_admin is distinct from old.is_admin or new.is_verified is distinct from old.is_verified or
 new.subscription_plan is distinct from old.subscription_plan or new.subscription_entitlements is distinct from old.subscription_entitlements)
 then raise exception 'Privileged profile fields cannot be edited directly' using errcode='42501';
 end if;
 return new;
end;
$$;
drop trigger if exists protect_profile_privileged_fields_trigger on public.profiles;
create trigger protect_profile_privileged_fields_trigger before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();