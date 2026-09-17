-- Older foundation used is_active; keep it synchronized for compatibility.
alter table public.subscription_plans add column if not exists is_active boolean not null default true;
update public.subscription_plans set is_active = active;
