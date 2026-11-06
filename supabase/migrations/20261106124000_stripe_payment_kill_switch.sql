-- Preserve the existing audited admin "Pause payments" control as a server-side
-- kill switch for Stripe. Only a service_role backend may read this value.
create or replace function public.stripe_checkout_allowed()
returns boolean language sql security invoker set search_path='' as $$
 select coalesce((select enabled from private.payment_configuration where singleton),false)
$$;
revoke all on function public.stripe_checkout_allowed() from public,anon,authenticated;
grant execute on function public.stripe_checkout_allowed() to service_role;
-- The singleton is intentionally left disabled. A reviewed/approved launch must
-- explicitly enable private.payment_configuration in a controlled migration.
