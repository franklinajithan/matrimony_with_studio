-- Consolidate the legacy Free/Plus/Premium foundation into the launch
-- Free/Premium/Premium+ model without deleting existing member billing history.

alter table public.subscription_plans drop constraint if exists subscription_plans_code_check;
alter table public.subscription_plans add column if not exists three_month_price_pence integer not null default 0 check (three_month_price_pence >= 0);
alter table public.subscription_plans add column if not exists six_month_price_pence integer not null default 0 check (six_month_price_pence >= 0);
alter table public.subscription_plans add column if not exists active boolean not null default true;

-- Convert any old Plus subscription before removing the old plan code.
update public.user_subscriptions set plan_code = 'premium' where plan_code = 'plus';
update public.member_subscriptions set plan_code = 'premium' where plan_code = 'plus';
delete from public.subscription_plans where code = 'plus';

insert into public.subscription_plans(code,name,monthly_price_pence,three_month_price_pence,six_month_price_pence,currency,entitlements,active)
values
('free','Free',0,0,0,'GBP','{"interestsPerMonth":10,"profileSharesPerMonth":3,"biodataTemplates":3,"profileBoostsPerMonth":0,"advancedFilters":false,"fullCompatibility":false,"seeWhoLikesYou":false,"seeProfileVisitors":false,"messagingAfterMatch":true,"readReceipts":false,"familyIntroduction":false,"incognitoMode":false,"priorityVisibility":false,"premiumBadge":false,"prioritySupport":false}'::jsonb,true),
('premium','Premium',799,1999,3499,'GBP','{"interestsPerMonth":null,"profileSharesPerMonth":20,"biodataTemplates":null,"profileBoostsPerMonth":0,"advancedFilters":true,"fullCompatibility":true,"seeWhoLikesYou":true,"seeProfileVisitors":true,"messagingAfterMatch":true,"readReceipts":true,"familyIntroduction":true,"incognitoMode":false,"priorityVisibility":false,"premiumBadge":false,"prioritySupport":false}'::jsonb,true),
('premium_plus','Premium+',1499,3499,5999,'GBP','{"interestsPerMonth":null,"profileSharesPerMonth":null,"biodataTemplates":null,"profileBoostsPerMonth":4,"advancedFilters":true,"fullCompatibility":true,"seeWhoLikesYou":true,"seeProfileVisitors":true,"messagingAfterMatch":true,"readReceipts":true,"familyIntroduction":true,"incognitoMode":true,"priorityVisibility":true,"premiumBadge":true,"prioritySupport":true}'::jsonb,true)
on conflict (code) do update set name=excluded.name, monthly_price_pence=excluded.monthly_price_pence, three_month_price_pence=excluded.three_month_price_pence, six_month_price_pence=excluded.six_month_price_pence, currency=excluded.currency, entitlements=excluded.entitlements, active=excluded.active, updated_at=now();

alter table public.subscription_plans add constraint subscription_plans_code_check check (code in ('free','premium','premium_plus'));

-- Clients can read active plans and their own subscription/usage only. Billing mutation stays server-only.
drop policy if exists "plans readable" on public.subscription_plans;
drop policy if exists "active plans are readable" on public.subscription_plans;
create policy "active plans are readable" on public.subscription_plans for select using (active = true);
