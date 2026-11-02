-- Stage after 20261102082805_admin_story_moderation_and_billing_reads.
-- Historical approvals do not imply consent. Existing content/status is preserved.
alter table public.success_stories
 add column if not exists publication_consent boolean not null default false,
 add column if not exists consent_version text,
 add column if not exists consented_at timestamptz,
 add column if not exists consent_withdrawn_at timestamptz;
-- RLS filters rows, not columns. Approved submissions contain private evidence.
revoke select on public.success_stories from public,anon;
do $$ declare p record; begin
 for p in select policyname from pg_policies where schemaname='public' and tablename='success_stories' and cmd='SELECT' loop
  execute format('drop policy %I on public.success_stories',p.policyname);
 end loop;
end $$;
create policy story_private_read on public.success_stories for select to authenticated
 using(private.account_session_active() and public.member_is_active(auth.uid()) and (submitted_by_uid=auth.uid() or public.is_admin()));
create policy story_private_read_boundary on public.success_stories as restrictive for select to authenticated
 using(private.account_session_active() and public.member_is_active(auth.uid()) and (submitted_by_uid=auth.uid() or public.is_admin()));
create function private.record_story_consent() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or not private.account_session_active() or not public.member_is_active(auth.uid())
 or new.submitted_by_uid is distinct from auth.uid() or new.publication_consent is not true
 or new.consent_version is distinct from '2026-11-02' then
  raise exception 'Explicit publication consent and an active account are required' using errcode='42501';end if;
 new.consented_at:=now();new.consent_withdrawn_at:=null;return new;
end $$;
revoke all on function private.record_story_consent() from public,anon,authenticated;
create trigger record_story_consent before insert on public.success_stories for each row execute function private.record_story_consent();
-- Preserve existing audited moderation, adding owner withdrawal and consent checks.
create or replace function private.guard_story_review() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.account_session_active() or not public.member_is_active(auth.uid()) then
  raise exception 'Forbidden' using errcode='42501';end if;
 if new.submitted_by_uid=auth.uid() and old.publication_consent and not new.publication_consent
 and (to_jsonb(new)-array['publication_consent','consent_withdrawn_at','status','approved_at','updated_at']) =
     (to_jsonb(old)-array['publication_consent','consent_withdrawn_at','status','approved_at','updated_at']) then
  new.status:='rejected';new.approved_at:=null;new.consent_withdrawn_at:=now();new.updated_at:=now();
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
   values(auth.uid(),'success_story_consent_withdrawn','success_story',old.id::text,'{}'::jsonb);
  return new;end if;
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501';end if;
 if (to_jsonb(new)-array['status','admin_notes','approved_at','updated_at']) is distinct from
    (to_jsonb(old)-array['status','admin_notes','approved_at','updated_at']) then
  raise exception 'Submitted evidence cannot be edited' using errcode='42501';end if;
 if new.status not in ('pending','approved','rejected') or new.status is null or new.status=old.status
 or new.admin_notes is null or char_length(btrim(new.admin_notes)) not between 10 and 1000 then
  raise exception 'Choose a new status and provide a review reason' using errcode='22023';end if;
 if new.status='approved' and (not old.publication_consent or old.consented_at is null or old.consent_withdrawn_at is not null or old.consent_version is distinct from '2026-11-02') then
  raise exception 'Publication consent is required' using errcode='42501';end if;
 new.approved_at:=case when new.status='approved' then now() else null end;new.updated_at:=now();
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),'success_story_review','success_story',old.id::text,
 jsonb_build_object('previousStatus',old.status,'status',new.status,'reason',btrim(new.admin_notes)));
 new.admin_notes:=old.admin_notes;return new;
end $$;
revoke all on function private.guard_story_review() from public,anon,authenticated;
-- The existing trigger uses this replaced function; no trigger is bypassed.
create function private.published_success_stories(p_limit integer,p_offset integer)
returns table(id uuid,couple_names text,story_text text,photo_url text,approved_at timestamptz)
language sql stable security definer set search_path='' as $$
 select s.id,s.couple_names,s.story_text,s.photo_url,s.approved_at from public.success_stories s
 where s.status='approved' and s.publication_consent and s.consented_at is not null
 and s.consent_withdrawn_at is null and s.consent_version='2026-11-02'
 order by s.approved_at desc,s.id desc limit least(greatest(coalesce(p_limit,12),1),24)
 offset least(greatest(coalesce(p_offset,0),0),1000);
$$;
revoke all on function private.published_success_stories(integer,integer) from public,anon,authenticated;
-- Intentional public RPC: exact five-field projection, no access to base rows.
-- Definer wrapper avoids granting anonymous USAGE on the private schema.
create function public.published_success_stories(p_limit integer default 12,p_offset integer default 0)
returns table(id uuid,couple_names text,story_text text,photo_url text,approved_at timestamptz)
language sql stable security definer set search_path='' as $$select * from private.published_success_stories(p_limit,p_offset);$$;
revoke all on function public.published_success_stories(integer,integer) from public;
grant execute on function public.published_success_stories(integer,integer) to anon,authenticated;
create function private.withdraw_story_consent(p_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare changed uuid;
begin
 if auth.uid() is null or not private.account_session_active() or not public.member_is_active(auth.uid()) then
  raise exception 'Forbidden' using errcode='42501';end if;
 update public.success_stories set publication_consent=false
 where id=p_id and submitted_by_uid=auth.uid() and publication_consent returning id into changed;
 return changed is not null;
end $$;
revoke all on function private.withdraw_story_consent(uuid) from public,anon;
grant execute on function private.withdraw_story_consent(uuid) to authenticated;
grant usage on schema private to authenticated;
create function public.withdraw_story_consent(p_id uuid) returns boolean
language sql security invoker set search_path='' as $$select private.withdraw_story_consent(p_id);$$;
revoke all on function public.withdraw_story_consent(uuid) from public,anon;
grant execute on function public.withdraw_story_consent(uuid) to authenticated;
