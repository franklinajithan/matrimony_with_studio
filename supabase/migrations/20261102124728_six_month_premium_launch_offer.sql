-- A free launch grant, independent of Stripe, phone OTP and paid memberships.
create schema if not exists private;
create table public.premium_launch_offers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 starts_at timestamptz not null default now(),
 ends_at timestamptz not null,
 duration_months integer not null default 6 check (duration_months=6),
 check (ends_at=starts_at+interval '6 months')
);
alter table public.premium_launch_offers enable row level security;
revoke all on public.premium_launch_offers from public,anon,authenticated;
grant select on public.premium_launch_offers to authenticated;
create policy own_active_launch_offer on public.premium_launch_offers for select to authenticated
 using(user_id=(select auth.uid()) and private.account_session_active() and public.member_is_active(user_id));

create function private.claim_premium_launch_offer() returns jsonb
language plpgsql security definer set search_path='' set timezone='UTC' as $$
declare
 v_user uuid := auth.uid(); v_offer public.premium_launch_offers%rowtype;
begin
 if v_user is null or not private.account_session_active() or not public.member_is_active(v_user) then
  raise exception 'Sign in with an active account' using errcode='42501';
 end if;
 if not exists(select 1 from auth.users where id=v_user and email_confirmed_at is not null) then
  raise exception 'Confirm your email before starting Premium' using errcode='42501';
 end if;
 -- Repeated/concurrent selections always return the first window, even if expired.
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,7162));
 select * into v_offer from public.premium_launch_offers where user_id=v_user;
 if not found then
  insert into public.premium_launch_offers(user_id,starts_at,ends_at)
   values(v_user,now(),now()+interval '6 months') returning * into v_offer;
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
   values(v_user,'premium_launch_claimed','premium_launch_offer',v_user::text,
    jsonb_build_object('durationMonths',6,'startsAt',v_offer.starts_at,'endsAt',v_offer.ends_at));
 end if;
 return jsonb_build_object('plan','premium','durationMonths',6,'startsAt',v_offer.starts_at,'endsAt',v_offer.ends_at);
end;
$$;
revoke all on function private.claim_premium_launch_offer() from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.claim_premium_launch_offer() to authenticated;
create function public.claim_premium_launch_offer() returns jsonb
language sql security invoker set search_path='' as $$select private.claim_premium_launch_offer()$$;
revoke all on function public.claim_premium_launch_offer() from public,anon;
grant execute on function public.claim_premium_launch_offer() to authenticated;
