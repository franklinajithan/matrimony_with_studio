-- Prepare an explicit, audited Stripe activation path. This migration does NOT
-- turn billing on. Checkout also requires Vercel activation flags, and a
-- currently verified administrator session with an explicit confirmation.
create or replace function private.enable_stripe_payments()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.account_session_active()
     or not public.member_is_active(auth.uid()) or not public.is_admin()
  then raise exception 'Forbidden' using errcode='42501'; end if;
  update private.payment_configuration set enabled=true where singleton;
  if not found then raise exception 'Missing payment configuration'; end if;
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
  values(auth.uid(),'stripe_payments_enabled','payment_configuration','stripe',
         '{"provider":"stripe","verified":"admin_explicit_activation"}'::jsonb);
end $$;

create or replace function public.enable_stripe_payments()
returns void language sql security invoker set search_path = ''
as $$ select private.enable_stripe_payments() $$;
revoke all on function private.enable_stripe_payments() from public,anon,authenticated;
grant execute on function private.enable_stripe_payments() to authenticated,service_role;
revoke all on function public.enable_stripe_payments() from public,anon,authenticated;
grant execute on function public.enable_stripe_payments() to authenticated;
