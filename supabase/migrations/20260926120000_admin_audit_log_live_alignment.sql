-- Align the live CupidMatch audit log with the deployed is_admin() authorization RPC.
-- Administrative mutations must use trusted server-side transactions; clients get read-only access.
create table if not exists public.admin_audit_log (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,
 target_type text not null,
 target_id text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;
drop policy if exists "admins read audit log" on public.admin_audit_log;
create policy "admins read audit log" on public.admin_audit_log
 for select to authenticated using (public.is_admin());
create index if not exists admin_audit_log_created_at_idx
 on public.admin_audit_log (created_at desc);
