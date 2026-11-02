-- Adds optional prices without rewriting legacy plans, current prices or memberships.
alter table public.subscription_plans add column if not exists three_month_price_pence integer check(three_month_price_pence>=0);
alter table public.subscription_plans add column if not exists six_month_price_pence integer check(six_month_price_pence>=0);
create or replace function private.audit_plan_price_change() returns trigger
 language plpgsql security definer set search_path='' as $$
declare reason text := btrim(current_setting('request.plan_price_reason',true));
begin
 if auth.uid() is null or not public.is_admin() or not private.account_session_active() then
  raise exception 'Forbidden' using errcode='42501';
 end if;
 if reason is null or char_length(reason) not between 10 and 500 then raise exception 'Review reason required' using errcode='22023';end if;
 if (to_jsonb(new)-array['monthly_price_pence','three_month_price_pence','six_month_price_pence','updated_at']) is distinct from
    (to_jsonb(old)-array['monthly_price_pence','three_month_price_pence','six_month_price_pence','updated_at']) then
  raise exception 'Only catalogue prices may be changed' using errcode='42501';
 end if;
 if new.monthly_price_pence is null or new.monthly_price_pence<0 or new.monthly_price_pence>99999999
 or new.three_month_price_pence<0 or new.three_month_price_pence>99999999
 or new.six_month_price_pence<0 or new.six_month_price_pence>99999999 then raise exception 'Invalid price' using errcode='22023';end if;
 if new.code='free' and (new.monthly_price_pence<>0 or coalesce(new.three_month_price_pence,0)<>0 or coalesce(new.six_month_price_pence,0)<>0) then
  raise exception 'Free plan must remain free' using errcode='22023';
 end if;
 if new.code<>'free' and (new.monthly_price_pence=0 or new.three_month_price_pence=0 or new.six_month_price_pence=0) then
  raise exception 'Configured paid prices must be positive' using errcode='22023';
 end if;
 if row(new.monthly_price_pence,new.three_month_price_pence,new.six_month_price_pence) is not distinct from
 row(old.monthly_price_pence,old.three_month_price_pence,old.six_month_price_pence) then raise exception 'No price changes' using errcode='22023';end if;
 new.updated_at:=clock_timestamp();
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),'plan_prices_changed','subscription_plan',old.code,
 jsonb_build_object('reason',reason,'currency',old.currency,
 'previous',jsonb_build_object('monthly',old.monthly_price_pence,'three_months',old.three_month_price_pence,'six_months',old.six_month_price_pence),
 'prices',jsonb_build_object('monthly',new.monthly_price_pence,'three_months',new.three_month_price_pence,'six_months',new.six_month_price_pence)));
 return new;
end; $$;
revoke all on function private.audit_plan_price_change() from public,anon,authenticated;
drop trigger if exists audit_plan_price_change on public.subscription_plans;
create trigger audit_plan_price_change before update on public.subscription_plans for each row execute function private.audit_plan_price_change();
alter table public.subscription_plans enable row level security;
revoke update on public.subscription_plans from anon,authenticated;
grant update(monthly_price_pence,three_month_price_pence,six_month_price_pence) on public.subscription_plans to authenticated;
drop policy if exists "admins edit catalogue prices" on public.subscription_plans;
create policy "admins edit catalogue prices" on public.subscription_plans for update to authenticated
 using(public.is_admin() and private.account_session_active()) with check(public.is_admin() and private.account_session_active());
create or replace function public.admin_update_plan_prices(p_code text,p_expected_updated_at timestamptz,p_monthly integer,p_three_months integer,p_six_months integer,p_reason text)
 returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.is_admin() or not private.account_session_active() then raise exception 'Forbidden' using errcode='42501';end if;
 perform set_config('request.plan_price_reason',p_reason,true);
 update public.subscription_plans set monthly_price_pence=p_monthly,three_month_price_pence=p_three_months,six_month_price_pence=p_six_months
 where code=p_code and updated_at=p_expected_updated_at
 returning jsonb_build_object('code',code,'updatedAt',updated_at) into result;
 return result;
end; $$;
revoke all on function public.admin_update_plan_prices(text,timestamptz,integer,integer,integer,text) from public,anon;
grant execute on function public.admin_update_plan_prices(text,timestamptz,integer,integer,integer,text) to authenticated;
