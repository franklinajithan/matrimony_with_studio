revoke insert, update, delete on public.subscription_events from anon, authenticated;
revoke insert, update, delete on public.member_subscriptions from anon, authenticated;
-- Service-role/server operations bypass RLS. Browser sessions cannot self-upgrade.
