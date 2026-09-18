-- Aggregate-only access to auth activity. No auth rows are exposed to clients.
create schema if not exists cupidmatch_admin;
revoke all on schema cupidmatch_admin from public;
grant usage on schema cupidmatch_admin to authenticated;

create or replace function cupidmatch_admin.dashboard_counts()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return (
    select jsonb_build_object(
      'members', count(*),
      'activeUsers', count(*) filter (
        where u.last_sign_in_at >= now() - interval '30 days'
      ),
      'pendingVerification', count(*) filter (
        where p.is_published is true and p.is_verified is not true
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

-- Public entrypoint is invoker-only; authorization is enforced in the private function.
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
