-- Stage after the account-lifecycle migration. No existing story is published or deleted.
-- Keep the user's session/RLS for reads; never grant browser billing writes.
do $$
declare entry record;
begin
 for entry in select * from (values
  ('member_subscriptions','admins read subscriptions'),
  ('subscription_events','admins read billing events'),
  ('subscription_plans','admins read all plans')
 ) as entries(table_name,policy_name) loop
  if to_regclass('public.'||entry.table_name) is not null then
   execute format('drop policy if exists %I on public.%I',entry.policy_name,entry.table_name);
   execute format('create policy %I on public.%I for select to authenticated using (public.is_admin() and private.account_session_active())',entry.policy_name,entry.table_name);
   execute format('grant select on public.%I to authenticated',entry.table_name);
  end if;
 end loop;
end; $$;

-- Moderation must preserve the submission and audit every actual status change.
-- A trigger needs definer privileges solely to insert the protected audit record.
create or replace function private.guard_story_review() returns trigger
 language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not public.is_admin() or not private.account_session_active() then
   raise exception 'Forbidden' using errcode='42501';
 end if;
 if (to_jsonb(new) - array['status','admin_notes','approved_at','updated_at']) is distinct from
    (to_jsonb(old) - array['status','admin_notes','approved_at','updated_at']) then
   raise exception 'Submitted evidence cannot be edited' using errcode='42501';
 end if;
 if new.status not in ('pending','approved','rejected') or new.status is null or new.status = old.status
 or new.admin_notes is null or char_length(btrim(new.admin_notes)) not between 10 and 1000 then
   raise exception 'Choose a new status and provide a review reason' using errcode='22023';
 end if;
 new.admin_notes := btrim(new.admin_notes);
 new.approved_at := case when new.status='approved' then now() else null end;
 new.updated_at := now();
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),'success_story_review','success_story',old.id::text,
 jsonb_build_object('previousStatus',old.status,'status',new.status,'reason',new.admin_notes));
 -- Review reasons belong only in the protected audit log, never a public story row.
 new.admin_notes := old.admin_notes;
 return new;
end; $$;
revoke all on function private.guard_story_review() from public,anon,authenticated;
drop trigger if exists story_review_guard on public.success_stories;
create trigger story_review_guard before update on public.success_stories
 for each row execute function private.guard_story_review();
-- Even an old permissive insert policy cannot self-publish a story or forge a review.
drop policy if exists "story submissions start pending" on public.success_stories;
create policy "story submissions start pending" on public.success_stories as restrictive for insert to authenticated
 with check (status='pending' and admin_notes is null and approved_at is null and private.account_session_active());
drop policy if exists "success_stories_update_admin" on public.success_stories;
create policy "success_stories_update_admin" on public.success_stories for update to authenticated
 using (public.is_admin() and private.account_session_active())
 with check (public.is_admin() and private.account_session_active());
grant select,update on public.success_stories to authenticated;
alter table public.success_stories enable row level security;

-- The API calls this migration-owned entrypoint so an unmigrated backend fails
-- closed instead of updating through a legacy unaudited table policy.
create or replace function public.admin_review_success_story(p_id uuid,p_status text,p_expected_status text,p_note text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.is_admin() or not private.account_session_active() then
  raise exception 'Forbidden' using errcode='42501';
 end if;
 update public.success_stories set status=p_status,admin_notes=p_note
 where id=p_id and status=p_expected_status
 returning jsonb_build_object('id',id,'status',status,'approved_at',approved_at) into result;
 return result;
end; $$;
revoke all on function public.admin_review_success_story(uuid,text,text,text) from public,anon;
grant execute on function public.admin_review_success_story(uuid,text,text,text) to authenticated;
