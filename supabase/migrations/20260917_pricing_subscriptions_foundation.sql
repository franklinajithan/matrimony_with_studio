create table if not exists public.subscription_plans (
  code text primary key check (code in ('free','plus','premium')),
  name text not null,
  monthly_price_pence integer not null default 0 check (monthly_price_pence >= 0),
  currency text not null default 'GBP',
  entitlements jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null references public.subscription_plans(code),
  status text not null default 'active' check (status in ('active','trialing','past_due','cancelled','expired')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists user_subscriptions_one_current on public.user_subscriptions(user_id) where status in ('active','trialing','past_due');
create index if not exists user_subscriptions_plan_status on public.user_subscriptions(plan_code,status);

create table if not exists public.subscription_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null,
  period_start date not null,
  used_count integer not null default 0 check (used_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature_key, period_start)
);

insert into public.subscription_plans(code,name,monthly_price_pence,currency,sort_order,entitlements) values
('free','Free',0,'GBP',1,'{"interestsPerMonth":10,"profileSharesPerMonth":3,"biodataTemplates":3,"profileBoostsPerMonth":0,"advancedFilters":false,"seeWhoLikesYou":false,"unlimitedMessaging":false,"readReceipts":false,"familyIntroduction":false,"fullHoroscope":false,"premiumBadge":false,"prioritySupport":false}'),
('plus','Plus',999,'GBP',2,'{"interestsPerMonth":null,"profileSharesPerMonth":20,"biodataTemplates":null,"profileBoostsPerMonth":1,"advancedFilters":true,"seeWhoLikesYou":true,"unlimitedMessaging":true,"readReceipts":true,"familyIntroduction":true,"fullHoroscope":true,"premiumBadge":false,"prioritySupport":false}'),
('premium','Premium',1999,'GBP',3,'{"interestsPerMonth":null,"profileSharesPerMonth":null,"biodataTemplates":null,"profileBoostsPerMonth":4,"advancedFilters":true,"seeWhoLikesYou":true,"unlimitedMessaging":true,"readReceipts":true,"familyIntroduction":true,"fullHoroscope":true,"premiumBadge":true,"prioritySupport":true}')
on conflict (code) do update set name=excluded.name, monthly_price_pence=excluded.monthly_price_pence, currency=excluded.currency, entitlements=excluded.entitlements, sort_order=excluded.sort_order, updated_at=now();

alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.subscription_usage enable row level security;

drop policy if exists "plans readable" on public.subscription_plans;
create policy "plans readable" on public.subscription_plans for select using (is_active = true);
drop policy if exists "own subscription readable" on public.user_subscriptions;
create policy "own subscription readable" on public.user_subscriptions for select using (auth.uid() = user_id);
drop policy if exists "own usage readable" on public.subscription_usage;
create policy "own usage readable" on public.subscription_usage for select using (auth.uid() = user_id);

grant select on public.subscription_plans to anon, authenticated;
grant select on public.user_subscriptions, public.subscription_usage to authenticated;
