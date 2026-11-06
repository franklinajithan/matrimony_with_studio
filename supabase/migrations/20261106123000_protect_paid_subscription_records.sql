-- Members must never be able to create or edit their own paid entitlements.
-- Production database audit 2026-11-06 found anon/authenticated DML privileges and
-- a broad session-only ALL policy on public.user_subscriptions.
alter table public.user_subscriptions enable row level security;
revoke all on table public.user_subscriptions from public,anon,authenticated;
grant select on public.user_subscriptions to authenticated;
drop policy if exists account_live_session on public.user_subscriptions;
drop policy if exists "own subscription readable" on public.user_subscriptions;
drop policy if exists verified_member_subscription_read on public.user_subscriptions;
create policy verified_member_subscription_read on public.user_subscriptions
 for select to authenticated using (
  private.account_session_active()
  and public.member_is_active((select auth.uid()))
  and (user_id=(select auth.uid()) or public.is_admin())
 );
-- service_role remains a privileged server-only identity. Never use from the client.
