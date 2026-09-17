revoke insert, update, delete on public.subscription_plans from anon, authenticated;
-- Plan editing from /admin must use a trusted server/service-role action and audit log.
