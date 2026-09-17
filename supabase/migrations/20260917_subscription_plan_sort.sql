alter table public.subscription_plans add column if not exists sort_order integer not null default 0;
update public.subscription_plans set sort_order=case code when 'free' then 1 when 'premium' then 2 when 'premium_plus' then 3 else 99 end;
