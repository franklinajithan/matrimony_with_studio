alter table public.subscription_plans drop constraint if exists subscription_plans_code_check;
alter table public.subscription_plans add constraint subscription_plans_code_check check (code in ('free','premium','premium_plus'));
