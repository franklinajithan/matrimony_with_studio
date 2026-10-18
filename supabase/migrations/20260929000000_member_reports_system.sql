-- Member reporting system for CupidMatch safety moderation
-- Allows members to report others, admins to review and take action

create table if not exists public.member_reports (
  id uuid primary key default gen_random_uuid(),
  reported_member_id uuid not null references public.profiles(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in (
    'fake_profile',
    'harassment',
    'scam',
    'inappropriate_content',
    'misleading_status',
    'impersonation',
    'spam',
    'underage',
    'other'
  )),
  description text,
  status text not null default 'open' check (status in (
    'open',
    'under_review',
    'resolved',
    'dismissed'
  )),
  reviewed_by_admin_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reported_member_id <> reporter_id),
  check (length(trim(coalesce(description, ''))) <= 2000)
);

-- Indexes for efficient queries
create index if not exists member_reports_reported_member_idx 
  on public.member_reports(reported_member_id, created_at desc);

create index if not exists member_reports_reporter_idx 
  on public.member_reports(reporter_id, created_at desc);

create index if not exists member_reports_status_created_idx 
  on public.member_reports(status, created_at desc);

create index if not exists member_reports_reason_idx 
  on public.member_reports(reason);

-- Enable RLS
alter table public.member_reports enable row level security;

-- Members can view their own submitted reports (but not who reported them)
drop policy if exists "members_view_own_reports" on public.member_reports;
create policy "members_view_own_reports"
  on public.member_reports for select
  to authenticated
  using (reporter_id = auth.uid());

-- Members can insert reports (cannot report themselves)
drop policy if exists "members_create_reports" on public.member_reports;
create policy "members_create_reports"
  on public.member_reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid() 
    and reported_member_id <> auth.uid()
  );

-- Admins can view all reports
drop policy if exists "admins_view_all_reports" on public.member_reports;
create policy "admins_view_all_reports"
  on public.member_reports for select
  to authenticated
  using (public.is_admin());

-- Admins can update reports (status, notes, etc.)
drop policy if exists "admins_update_reports" on public.member_reports;
create policy "admins_update_reports"
  on public.member_reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Grant permissions
revoke all on public.member_reports from anon;
grant select, insert on public.member_reports to authenticated;
grant update on public.member_reports to authenticated;

-- Trigger to update updated_at
drop trigger if exists member_reports_set_updated_at on public.member_reports;
create trigger member_reports_set_updated_at
  before update on public.member_reports
  for each row execute function public.set_updated_at();

-- Function to count previous reports for a member
create or replace function public.count_member_reports(p_member_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.member_reports
  where reported_member_id = p_member_id;
$$;

revoke all on function public.count_member_reports(uuid) from public, anon;
grant execute on function public.count_member_reports(uuid) to authenticated;

-- Audit log trigger for report actions
create or replace function public.audit_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only log when status changes or review is performed
  if (new.status is distinct from old.status) 
     or (new.reviewed_at is distinct from old.reviewed_at) then
    insert into public.admin_audit_log(actor_id, action, target_type, target_id, metadata)
    values(
      auth.uid(),
      'report_' || new.status,
      'member_report',
      new.id::text,
      jsonb_build_object(
        'reported_member_id', new.reported_member_id,
        'reason', new.reason,
        'previous_status', old.status,
        'new_status', new.status
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_report_status_change_trigger on public.member_reports;
create trigger audit_report_status_change_trigger
  after update on public.member_reports
  for each row execute function public.audit_report_status_change();

-- RPC for admins to update report status
create or replace function public.admin_update_report_status(
  p_report_id uuid,
  p_status text,
  p_moderation_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report record;
begin
  -- Authorization check
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  -- Validate status
  if p_status not in ('open', 'under_review', 'resolved', 'dismissed') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;

  -- Get and lock the report
  select * into v_report
  from public.member_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;

  -- Update the report
  update public.member_reports
  set 
    status = p_status,
    reviewed_by_admin_id = auth.uid(),
    reviewed_at = now(),
    moderation_note = coalesce(trim(p_moderation_note), moderation_note)
  where id = p_report_id;

  return jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'new_status', p_status
  );
end;
$$;

revoke all on function public.admin_update_report_status(uuid, text, text) from public, anon;
grant execute on function public.admin_update_report_status(uuid, text, text) to authenticated;
