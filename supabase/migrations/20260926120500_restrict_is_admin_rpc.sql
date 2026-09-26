-- The admin role lookup uses auth.uid(); anonymous callers do not need EXECUTE.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
