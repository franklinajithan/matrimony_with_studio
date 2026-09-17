create index if not exists member_subscriptions_status_period_idx on public.member_subscriptions(status,current_period_end);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
