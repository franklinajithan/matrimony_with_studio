create index if not exists member_subscriptions_user_created_idx on public.member_subscriptions(user_id, created_at desc);
create index if not exists member_subscriptions_customer_idx on public.member_subscriptions(stripe_customer_id) where stripe_customer_id is not null;
create index if not exists subscription_events_created_idx on public.subscription_events(created_at desc);
create index if not exists subscription_events_user_idx on public.subscription_events(user_id, created_at desc) where user_id is not null;
