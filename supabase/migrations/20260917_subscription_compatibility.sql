-- Compatibility layer for repositories where either of the earlier subscription
-- foundations may already have been applied. Keep one launch plan catalogue.

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='user_subscriptions') then
    update public.user_subscriptions set plan_code='premium' where plan_code='plus';
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='member_subscriptions') then
    update public.member_subscriptions set plan_code='premium' where plan_code='plus';
  end if;
end $$;

-- The authoritative launch catalogue is subscription_plans; server access resolves
-- paid state from member_subscriptions. Legacy user_subscriptions remains readable
-- for migration/audit but must not be used to grant paid features.
