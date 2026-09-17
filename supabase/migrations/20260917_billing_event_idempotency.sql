create unique index if not exists subscription_events_stripe_event_unique on public.subscription_events(stripe_event_id) where stripe_event_id is not null;
