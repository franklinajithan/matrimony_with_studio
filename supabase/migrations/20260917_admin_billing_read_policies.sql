drop policy if exists "admins read subscriptions" on public.member_subscriptions;
create policy "admins read subscriptions" on public.member_subscriptions for select to authenticated using (public.is_current_user_admin());

drop policy if exists "admins read billing events" on public.subscription_events;
create policy "admins read billing events" on public.subscription_events for select to authenticated using (public.is_current_user_admin());
