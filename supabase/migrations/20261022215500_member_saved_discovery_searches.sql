create table if not exists public.member_saved_searches (
 user_id uuid primary key references auth.users(id) on delete cascade,
 path_and_query text not null check (length(path_and_query) <= 2048 and (path_and_query = '/discover' or path_and_query like '/discover?%')),
 updated_at timestamptz not null default now()
);
alter table public.member_saved_searches enable row level security;
revoke all on public.member_saved_searches from anon, public;
grant select,insert,update,delete on public.member_saved_searches to authenticated;
drop policy if exists "saved_search_owner_select" on public.member_saved_searches;
create policy "saved_search_owner_select" on public.member_saved_searches for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "saved_search_owner_insert" on public.member_saved_searches;
create policy "saved_search_owner_insert" on public.member_saved_searches for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "saved_search_owner_update" on public.member_saved_searches;
create policy "saved_search_owner_update" on public.member_saved_searches for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));