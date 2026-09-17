-- Ensure the launch subscription table supports all advertised terms.
alter table public.member_subscriptions drop constraint if exists member_subscriptions_billing_term_check;
alter table public.member_subscriptions add constraint member_subscriptions_billing_term_check check (billing_term in ('monthly','three_months','six_months'));
