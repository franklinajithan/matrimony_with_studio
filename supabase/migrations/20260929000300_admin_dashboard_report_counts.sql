-- Add report metrics to admin dashboard
-- Provides counts of open reports, under review reports, and recent activity

create or replace function cupidmatch_admin.dashboard_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_seven_days_ago timestamptz := now() - interval '7 days';
begin
  if auth.uid() is null or public.is_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return (
    select jsonb_build_object(
      'members', count(distinct p.id),
      'activeUsers', count(distinct p.id) filter (
        where u.last_sign_in_at >= now() - interval '30 days'
      ),
      'pendingVerification', count(distinct p.id) filter (
        where p.is_published is true and p.is_verified is not true
      ),
      'openReports', (
        select count(*) from public.member_reports 
        where status = 'open'
      ),
      'reportsUnderReview', (
        select count(*) from public.member_reports 
        where status = 'under_review'
      ),
      'suspendedMembers', count(distinct p.id) filter (
        where p.suspended_at is not null
      ),
      'reportsLast7Days', (
        select count(*) from public.member_reports 
        where created_at >= v_seven_days_ago
      ),
      'updatedAt', now()
    )
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.is_admin is not true
  );
end;
$$;

revoke all on function cupidmatch_admin.dashboard_counts() from public, anon;
grant execute on function cupidmatch_admin.dashboard_counts() to authenticated;

-- Update the public wrapper function (for consistency)
create or replace function public.admin_dashboard_counts()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select cupidmatch_admin.dashboard_counts(); $$;

revoke all on function public.admin_dashboard_counts() from public, anon;
grant execute on function public.admin_dashboard_counts() to authenticated;

notify pgrst, 'reload schema';
