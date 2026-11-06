-- Transactional, replay-safe Stripe reconciliation. Apply in staging before enabling checkout.
-- Only the backend using the service_role key may call this function, after
-- verifying the raw Stripe signature and fetching the subscription from Stripe.
-- Existing membership data and user trials are preserved.
create or replace function public.apply_verified_stripe_subscription(
 p_event_id text, p_intent_id uuid, p_plan_code text, p_subscription_id text,
 p_customer_id text, p_paid boolean, p_stripe_status text,
 p_period_start timestamptz, p_period_end timestamptz,
 p_cancel_at_period_end boolean
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare v_intent public.payment_intents%rowtype; v_old_status text; v_status text;
 v_paid_until timestamptz; v_effective_start timestamptz; v_effective_end timestamptz;
begin
 if p_event_id !~ '^evt_[A-Za-z0-9]+$'
  or p_subscription_id !~ '^sub_[A-Za-z0-9]+$'
  or p_customer_id !~ '^cus_[A-Za-z0-9]+$'
  or p_period_end is null or p_period_start is null
  or p_period_end <= p_period_start or p_period_end < now() - interval '45 days'
  or p_stripe_status not in ('active','trialing','past_due','unpaid','canceled','incomplete','incomplete_expired')
 then raise exception 'Invalid verified Stripe subscription data'; end if;
 select * into v_intent from public.payment_intents
  where id=p_intent_id and provider='stripe' and plan_code=p_plan_code
  and billing_term='monthly' and currency='GBP'
  and ((plan_code='plus' and amount_pence=499)
       or (plan_code='premium' and amount_pence=799))
  for update;
 if not found then raise exception 'No matching pending Stripe payment intent'; end if;
 if exists(select 1 from public.user_subscriptions
   where provider='stripe' and provider_subscription_id=p_subscription_id
     and payment_intent_id is distinct from p_intent_id)
 then raise exception 'Subscription is assigned to another payment intent'; end if;
 if exists(select 1 from public.payment_events
   where provider='stripe' and provider_event_id=p_event_id) then return false; end if;
 v_old_status:=v_intent.status;
 if p_paid and v_intent.status='pending' and p_stripe_status in ('active','trialing') then
  update public.payment_intents set status='paid',verified_at=now(),
   provider_reference=coalesce(provider_reference,p_subscription_id),updated_at=now()
   where id=p_intent_id;
 end if;
 select status into v_status from public.payment_intents where id=p_intent_id;
 if v_status='paid' then
  -- Only a verified PAID event may move the paid-through date forward.
  -- Subscription status events and failed invoices must never grant unpaid months.
  select current_period_end,current_period_start into v_paid_until,v_effective_start
  from public.user_subscriptions where payment_intent_id=p_intent_id for update;
  if v_paid_until is null and not p_paid then
   insert into public.payment_events(intent_id,provider,provider_event_id,previous_status,status)
   values(p_intent_id,'stripe',p_event_id,v_old_status,'paid');
   return true;
  end if;
  v_effective_end:=case when p_paid then greatest(coalesce(v_paid_until,p_period_end),p_period_end)
      else v_paid_until end;
  v_effective_start:=case when p_paid and (v_paid_until is null or p_period_end>=v_paid_until)
       then p_period_start else coalesce(v_effective_start,p_period_start) end;
  v_status:=case
   when p_stripe_status in ('canceled','incomplete_expired') then 'cancelled'
   when p_stripe_status in ('past_due','unpaid','incomplete') then 'past_due'
   when v_effective_end<=now() then 'expired'
   else 'active' end;
  insert into public.user_subscriptions(
   user_id,plan_code,status,provider,provider_customer_id,
   provider_subscription_id,current_period_start,current_period_end,
   cancel_at_period_end,payment_intent_id
  ) values (
   v_intent.user_id,v_intent.plan_code,v_status,'stripe',p_customer_id,
   p_subscription_id,v_effective_start,v_effective_end,p_cancel_at_period_end,p_intent_id
  ) on conflict (payment_intent_id) do update set
   status=excluded.status,provider_customer_id=excluded.provider_customer_id,
   current_period_start=excluded.current_period_start,
   current_period_end=excluded.current_period_end,
   cancel_at_period_end=excluded.cancel_at_period_end,updated_at=now()
  where public.user_subscriptions.provider_subscription_id=excluded.provider_subscription_id
    and public.user_subscriptions.user_id=excluded.user_id;
 end if;
 insert into public.payment_events(intent_id,provider,provider_event_id,previous_status,status)
 values(p_intent_id,'stripe',p_event_id,v_old_status,
  (select status from public.payment_intents where id=p_intent_id));
 return true;
end;
$$;
revoke all on function public.apply_verified_stripe_subscription(text,uuid,text,text,text,boolean,text,timestamptz,timestamptz,boolean)
 from public,anon,authenticated;
grant execute on function public.apply_verified_stripe_subscription(text,uuid,text,text,text,boolean,text,timestamptz,timestamptz,boolean)
 to service_role;

-- Existing payment ledgers deliberately deny client writes; grant the dedicated
-- server identity only the columns needed for verified Stripe reconciliation.
grant select,insert,update on public.payment_intents to service_role;
grant select,insert on public.payment_events to service_role;
grant select,insert,update on public.user_subscriptions to service_role;
