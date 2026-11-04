-- Standalone follow-up to #80. Never edit or replay the historical six-month migration.
-- Requires production account_lifecycle guards and member_trials (already present).
create schema if not exists private;
create table if not exists public.premium_launch_offers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 starts_at timestamptz not null default now(), ends_at timestamptz not null,
 duration_months integer not null default 2
);
-- #80 used anonymous CHECK names: remove only its two duration checks, not FKs/PKs.
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.premium_launch_offers'::regclass and contype='c'
 and (pg_get_constraintdef(oid) like '%duration_months%' or pg_get_constraintdef(oid) like '%ends_at%') loop
 execute format('alter table public.premium_launch_offers drop constraint %I',c.conname);
 end loop;
end $$;
alter table public.premium_launch_offers alter column duration_months set default 2;
alter table public.premium_launch_offers add constraint launch_duration_v2 check(duration_months in (2,6));
-- UTC calendar arithmetic clamps month ends; persisted six-month promises remain valid.
alter table public.premium_launch_offers add constraint launch_window_v2 check(
 ends_at=((starts_at at time zone 'UTC')+make_interval(months=>duration_months)) at time zone 'UTC');
alter table public.premium_launch_offers enable row level security;
revoke all on public.premium_launch_offers from public,anon,authenticated;
grant select on public.premium_launch_offers to authenticated;
drop policy if exists own_active_launch_offer on public.premium_launch_offers;
create policy own_active_launch_offer on public.premium_launch_offers for select to authenticated
 using(private.account_session_active() and public.member_is_active(auth.uid()) and (user_id=(select auth.uid()) or public.is_admin()));
create or replace function private.preserve_launch_offer() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Trial grants are immutable; preserve the original promise' using errcode='42501'; end $$;
revoke all on function private.preserve_launch_offer() from public,anon,authenticated;
create trigger preserve_launch_offer before update on public.premium_launch_offers for each row execute function private.preserve_launch_offer();
create or replace function private.claim_premium_launch_offer() returns jsonb
language plpgsql security definer set search_path='' set timezone='UTC' as $$
declare v_user uuid:=auth.uid(); v_start timestamptz; v_end timestamptz; v_months integer; begin
 if v_user is null or not private.account_session_active() or not public.member_is_active(v_user) then
 raise exception 'Sign in with an active account' using errcode='42501'; end if;
 if not exists(select 1 from auth.users where id=v_user and email_confirmed_at is not null) then
 raise exception 'Confirm your email before starting Premium' using errcode='42501'; end if;
 -- Same lock as the former phone-trial route; existing and expired claims are never restarted.
 perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
 select starts_at,ends_at,duration_months into v_start,v_end,v_months from public.premium_launch_offers where user_id=v_user;
 if not found then
  select starts_at,ends_at,duration_months into v_start,v_end,v_months from public.member_trials where user_id=v_user;
  if not found then
   v_start:=now();v_months:=2;v_end:=v_start+interval '2 months';
   insert into public.premium_launch_offers(user_id,starts_at,ends_at,duration_months) values(v_user,v_start,v_end,2);
   insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
    values(v_user,'premium_launch_claimed','premium_launch_offer',v_user::text,
    jsonb_build_object('durationMonths',2,'startsAt',v_start,'endsAt',v_end,'policy','two-calendar-months-v2'));
  end if;
 end if;
 return jsonb_build_object('plan','premium','durationMonths',v_months,'startsAt',v_start,'endsAt',v_end);
end $$;
revoke all on function private.claim_premium_launch_offer() from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.claim_premium_launch_offer() to authenticated;
create or replace function public.claim_premium_launch_offer() returns jsonb language sql security invoker set search_path='' as $$select private.claim_premium_launch_offer()$$;
revoke all on function public.claim_premium_launch_offer() from public,anon;
grant execute on function public.claim_premium_launch_offer() to authenticated;
-- Close the alternative three-month claim path without modifying historical trial rows.
create or replace function public.activate_member_trial(p_code_hash text default null)
returns table(duration_months integer,trial_ends_at timestamptz,offer_applied boolean)
language plpgsql security invoker set search_path='' as $$
declare r jsonb;begin
 if p_code_hash is not null then raise exception 'New invitation-code trials are unavailable; existing offers are preserved' using errcode='22023';end if;
 r:=public.claim_premium_launch_offer();return query select (r->>'durationMonths')::integer,(r->>'endsAt')::timestamptz,false;
end $$;
revoke all on function public.activate_member_trial(text) from public,anon;
grant execute on function public.activate_member_trial(text) to authenticated;
