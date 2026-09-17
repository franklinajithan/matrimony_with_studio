-- Recreate status constraint to include trialing for launch promotions.
alter table public.member_subscriptions drop constraint if exists member_subscriptions_status_check;
alter table public.member_subscriptions add constraint member_subscriptions_status_check check (status in ('pending','active','trialing','past_due','canceled','expired','refunded'));
