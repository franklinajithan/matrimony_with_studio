-- Preparation only. No remote requests, card data, scheduler or automatic renewal.
create schema if not exists private;
-- Production has monthly prices only. Add optional term prices without replacing custom prices.
alter table public.subscription_plans add column if not exists three_month_price_pence integer check(three_month_price_pence>=0);
alter table public.subscription_plans add column if not exists six_month_price_pence integer check(six_month_price_pence>=0);
update public.subscription_plans set
 three_month_price_pence=coalesce(three_month_price_pence,case when code='premium' and monthly_price_pence=799 then 1999 when code='premium_plus' and monthly_price_pence=1499 then 3499 end),
 six_month_price_pence=coalesce(six_month_price_pence,case when code='premium' and monthly_price_pence=799 then 3499 when code='premium_plus' and monthly_price_pence=1499 then 5999 end)
 where code in ('premium','premium_plus') and (three_month_price_pence is null or six_month_price_pence is null);
create table private.payment_configuration (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false, provider text not null default 'tide' check(provider='tide')
);
insert into private.payment_configuration default values;
alter table private.payment_configuration enable row level security;
revoke all on private.payment_configuration from public,anon,authenticated;
create table public.payment_intents (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 provider text not null check(provider in ('tide','stripe')), plan_code text not null check(plan_code in ('premium','premium_plus')),
 billing_term text not null check(billing_term in ('monthly','three_months','six_months')),
 amount_pence integer not null check(amount_pence>0), currency text not null default 'GBP' check(currency='GBP'),
 idempotency_key uuid not null, status text not null default 'pending' check(status in ('pending','paid','failed','cancelled','refunded')),
 provider_reference text, verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,idempotency_key), unique(provider,provider_reference),
 check(status not in ('paid','refunded') or (verified_at is not null and provider_reference is not null))
);
alter table public.user_subscriptions add column if not exists payment_intent_id uuid unique references public.payment_intents(id);
create index payment_intents_member_time on public.payment_intents(user_id,created_at desc);
create index payment_intents_status_time on public.payment_intents(status,created_at desc);
create table public.payment_events (
 id uuid primary key default gen_random_uuid(), intent_id uuid not null references public.payment_intents(id),
 provider text not null, provider_event_id text not null, previous_status text not null, status text not null, created_at timestamptz not null default now(),
 unique(provider,provider_event_id)
);
alter table public.payment_intents enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.payment_intents,public.payment_events from public,anon,authenticated,service_role;
grant select on public.payment_intents,public.payment_events to authenticated;
create policy payment_history_read on public.payment_intents for select to authenticated using(
 private.account_session_active() and public.member_is_active(auth.uid()) and (user_id=auth.uid() or public.is_admin()));
create policy payment_event_admin_read on public.payment_events for select to authenticated using(
 private.account_session_active() and public.member_is_active(auth.uid()) and public.is_admin());
-- No authenticated insert/update grants. Only a future trusted server adapter may invoke these service-only routines.
create function private.prepare_payment_intent(p_user uuid,p_plan text,p_term text,p_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.payment_intents%rowtype; v_price integer; v_expected integer; begin
 if not (select enabled from private.payment_configuration where singleton) then raise exception 'Payments disabled' using errcode='42501';end if;
 if p_user is null or not public.member_is_active(p_user) or not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'Ineligible member' using errcode='42501';end if;
 select case p_term when 'monthly' then monthly_price_pence when 'three_months' then three_month_price_pence when 'six_months' then six_month_price_pence end
 into v_price from public.subscription_plans where code=p_plan and coalesce((to_jsonb(subscription_plans)->>'active')::boolean,(to_jsonb(subscription_plans)->>'is_active')::boolean,false) and currency='GBP';
 v_expected:=case p_plan when 'premium' then case p_term when 'monthly' then 799 when 'three_months' then 1999 when 'six_months' then 3499 end when 'premium_plus' then case p_term when 'monthly' then 1499 when 'three_months' then 3499 when 'six_months' then 5999 end end;
 if v_expected is null or v_price is distinct from v_expected then raise exception 'Membership catalogue requires reconciliation before checkout' using errcode='22023';end if;
 insert into public.payment_intents(user_id,provider,plan_code,billing_term,amount_pence,idempotency_key)
 values(p_user,'tide',p_plan,p_term,v_price,p_key) on conflict(user_id,idempotency_key) do nothing;
 select * into r from public.payment_intents where user_id=p_user and idempotency_key=p_key for update;
 if r.plan_code<>p_plan or r.billing_term<>p_term then raise exception 'Idempotency conflict' using errcode='22023';end if;
 return to_jsonb(r);
end $$;
-- Confirmation recorder is intentionally not connected to HTTP. Only independently verified
-- service-side receipts can create a linked subscription, atomically with the ledger.
-- A future adapter must independently verify the provider's response before calling it.
create function private.record_verified_payment(p_id uuid,p_event text,p_status text,p_reference text,p_amount integer,p_currency text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.payment_intents%rowtype; prior public.payment_events%rowtype; v_months integer; begin
 if not (select enabled from private.payment_configuration where singleton) then raise exception 'Payments disabled' using errcode='42501';end if;
 if p_event is null or length(p_event) not between 1 and 200 or p_reference is null or length(p_reference) not between 1 and 200 or p_status is null then raise exception 'Invalid receipt';end if;
 select * into r from public.payment_intents where id=p_id for update;
 if not found then raise exception 'Unknown intent';end if;
 if p_amount is distinct from r.amount_pence or p_currency is distinct from r.currency or (r.provider_reference is not null and p_reference<>r.provider_reference) then raise exception 'Receipt mismatch';end if;
 select * into prior from public.payment_events where intent_id=p_id and provider_event_id=p_event;
 if found then
  if prior.status<>p_status then raise exception 'Conflicting event';end if;
  return to_jsonb(r);
 end if;
 if not ((r.status='pending' and p_status in ('paid','failed','cancelled')) or (r.status='paid' and p_status='refunded')) then raise exception 'Invalid payment transition';end if;
 insert into public.payment_events(intent_id,provider,provider_event_id,previous_status,status) values(p_id,r.provider,p_event,r.status,p_status);
 update public.payment_intents set status=p_status,provider_reference=p_reference,verified_at=case when p_status='paid' then now() else verified_at end,updated_at=now() where id=p_id returning * into r;
 if p_status='paid' then
  if not public.member_is_active(r.user_id) then raise exception 'Inactive member';end if;
  v_months:=case r.billing_term when 'monthly' then 1 when 'three_months' then 3 when 'six_months' then 6 end;
  insert into public.user_subscriptions(user_id,plan_code,status,provider,provider_subscription_id,current_period_start,current_period_end,cancel_at_period_end,payment_intent_id)
   values(r.user_id,r.plan_code,'active',r.provider,p_reference,now(),((now() at time zone 'UTC')+make_interval(months=>v_months)) at time zone 'UTC',true,r.id);
 elsif p_status='refunded' then
  -- End only the access purchased by this receipt; independent trials/plans survive.
  update public.user_subscriptions set status='cancelled',current_period_end=least(current_period_end,now()) where payment_intent_id=r.id;
 end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(null,'payment_'||p_status,'payment_intent',p_id::text,jsonb_build_object('provider',r.provider,'event',p_event));
 return to_jsonb(r);
end $$;
revoke all on function private.prepare_payment_intent(uuid,text,text,uuid),private.record_verified_payment(uuid,text,text,text,integer,text) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.prepare_payment_intent(uuid,text,text,uuid),private.record_verified_payment(uuid,text,text,text,integer,text) to service_role;
-- Admins can disable, but cannot enable a provider or grant paid access from the dashboard.
create function private.disable_payments() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.account_session_active() or not public.member_is_active(auth.uid()) or not public.is_admin() then raise exception 'Forbidden' using errcode='42501';end if;
 update private.payment_configuration set enabled=false where singleton;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(auth.uid(),'payments_disabled','payment_configuration','tide','{}');
end $$;
revoke all on function private.disable_payments() from public,anon;
grant execute on function private.disable_payments() to authenticated;
create function public.disable_payments() returns void language sql security invoker set search_path='' as $$select private.disable_payments()$$;
revoke all on function public.disable_payments() from public,anon;
grant execute on function public.disable_payments() to authenticated;
create function private.payment_summary() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.account_session_active() or not public.member_is_active(auth.uid()) or not public.is_admin() then raise exception 'Forbidden' using errcode='42501';end if;
 return jsonb_build_object('enabled',(select enabled from private.payment_configuration where singleton),
 'verifiedRevenuePence',(select coalesce(sum(amount_pence),0) from public.payment_intents where status='paid' and verified_at is not null),
 'refundedPence',(select coalesce(sum(amount_pence),0) from public.payment_intents where status='refunded' and verified_at is not null),
 'pending',(select count(*) from public.payment_intents where status='pending'),
 'failed',(select count(*) from public.payment_intents where status='failed'),
 'cancelled',(select count(*) from public.payment_intents where status='cancelled'),
 'activeTrials',(select count(*) from public.premium_launch_offers where starts_at<=now() and ends_at>now()),
 'legacyActiveTrials',(select count(*) from public.member_trials where starts_at<=now() and ends_at>now()),
 'paidSubscriptions',(select count(*) from public.user_subscriptions where status='active' and current_period_end>now()));
end $$;
revoke all on function private.payment_summary() from public,anon;
grant execute on function private.payment_summary() to authenticated;
create function public.payment_summary() returns jsonb language sql security invoker set search_path='' as $$select private.payment_summary()$$;
revoke all on function public.payment_summary() from public,anon;
grant execute on function public.payment_summary() to authenticated;

-- Public service-only wrappers let a future server adapter use supabase.rpc without exposing private schema.
create function public.prepare_payment_intent(p_user uuid,p_plan text,p_term text,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.prepare_payment_intent(p_user,p_plan,p_term,p_key)$$;
create function public.record_verified_payment(p_id uuid,p_event text,p_status text,p_reference text,p_amount integer,p_currency text) returns jsonb language sql security invoker set search_path='' as $$select private.record_verified_payment(p_id,p_event,p_status,p_reference,p_amount,p_currency)$$;
revoke all on function public.prepare_payment_intent(uuid,text,text,uuid),public.record_verified_payment(uuid,text,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.prepare_payment_intent(uuid,text,text,uuid),public.record_verified_payment(uuid,text,text,text,integer,text) to service_role;
-- Legacy subscription/trial tables are owner-readable; admin history uses a narrow guarded projection.
create function private.payment_memberships(p_page integer default 0) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_subscriptions jsonb;v_trials jsonb;begin
 if auth.uid() is null or not private.account_session_active() or not public.member_is_active(auth.uid()) or not public.is_admin() then raise exception 'Forbidden' using errcode='42501';end if;
 if p_page is null or p_page<0 or p_page>10000 then raise exception 'Invalid page';end if;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_subscriptions from
  (select id,user_id,plan_code,status,current_period_end from public.user_subscriptions where status in ('active','trialing') order by created_at desc,id desc offset p_page*25 limit 26)r;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_trials from
  (select user_id,starts_at,ends_at,duration_months from public.member_trials order by ends_at desc,user_id desc offset p_page*25 limit 26)r;
 return jsonb_build_object('subscriptions',v_subscriptions,'legacyTrials',v_trials);
end $$;
revoke all on function private.payment_memberships(integer) from public,anon;
grant execute on function private.payment_memberships(integer) to authenticated;
create function public.payment_memberships(p_page integer default 0)returns jsonb language sql security invoker set search_path='' as $$select private.payment_memberships(p_page)$$;
revoke all on function public.payment_memberships(integer) from public,anon;
grant execute on function public.payment_memberships(integer) to authenticated;
