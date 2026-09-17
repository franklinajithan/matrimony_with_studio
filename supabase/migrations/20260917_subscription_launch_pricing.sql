-- CupidMatch launch subscription foundation.
-- Stripe/webhook code should write subscription state using a trusted server role.

create table if not exists public.subscription_plans (
  code text primary key check (code in ('free','premium','premium_plus')),
  name text not null,
  active boolean not null default true,
  monthly_price_pence integer not null check (monthly_price_pence >= 0),
  three_month_price_pence integer not null check (three_month_price_pence >= 0),
  six_month_price_pence integer not null check (six_month_price_pence >= 0),
  currency text not null default 'GBP',
  entitlements jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.subscription_plans(code,name,monthly_price_pence,three_month_price_pence,six_month_price_pence,entitlements)
values
('free','Free',0,0,0,'{"interestsPerMonth":10,"profileSharesPerMonth":3,"biodataTemplates":3,"profileBoostsPerMonth":0,"advancedFilters":false,"fullCompatibility":false,"seeWhoLikesYou":false,"seeProfileVisitors":false,"messagingAfterMatch":true,"readReceipts":false,"familyIntroduction":false,"incognitoMode":false,"priorityVisibility":false,"premiumBadge":false,"prioritySupport":false}'::jsonb),
('premium','Premium',799,1999,3499,'{"interestsPerMonth":null,"profileSharesPerMonth":20,"biodataTemplates":null,"profileBoostsPerMonth":0,"advancedFilters":true,"fullCompatibility":true,"seeWhoLikesYou":true,"seeProfileVisitors":true,"messagingAfterMatch":true,"readReceipts":true,"familyIntroduction":true,"incognitoMode":false,"priorityVisibility":false,"premiumBadge":false,"prioritySupport":false}'::jsonb),
('premium_plus','Premium+',1499,3499,5999,'{"interestsPerMonth":null,"profileSharesPerMonth":null,"biodataTemplates":null,"profileBoostsPerMonth":4,"advancedFilters":true,"fullCompatibility":true,"seeWhoLikesYou":true,"seeProfileVisitors":true,"messagingAfterMatch":true,"readReceipts":true,"familyIntroduction":true,"incognitoMode":true,"priorityVisibility":true,"premiumBadge":true,"prioritySupport":true}'::jsonb)
on conflict (code) do update set name=excluded.name, monthly_price_pence=excluded.monthly_price_pence, three_month_price_pence=excluded.three_month_price_pence, six_month_price_pence=excluded.six_month_price_pence, entitlements=excluded.entitlements, updated_at=now();

create table if not exists public.member_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null references public.subscription_plans(code),
  billing_term text not null check (billing_term in ('monthly','three_months','six_months')),
  status text not null check (status in ('pending','active','past_due','canceled','expired','refunded')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_subscriptions_user_status_idx on public.member_subscriptions(user_id,status);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;
alter table public.member_subscriptions enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "active plans are readable" on public.subscription_plans;
create policy "active plans are readable" on public.subscription_plans for select using (active = true);

drop policy if exists "members read own subscription" on public.member_subscriptions;
create policy "members read own subscription" on public.member_subscriptions for select to authenticated using (user_id = (select auth.uid()));

-- No client INSERT/UPDATE/DELETE policy is intentionally created for subscriptions or billing events.
-- Paid access must only be changed by trusted server/webhook code.
