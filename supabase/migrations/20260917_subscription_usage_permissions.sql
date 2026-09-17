revoke insert, update, delete on public.subscription_usage from anon, authenticated;
-- Authenticated members consume metered features only through consume_subscription_usage().
