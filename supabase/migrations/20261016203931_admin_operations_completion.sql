-- Scoped staff roles are separate from the legacy, full-access is_admin flag.
create table public.admin_staff (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 role text not null check(role in ('support','moderator')),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
alter table public.admin_staff enable row level security;
revoke all on public.admin_staff from anon,authenticated;
grant select on public.admin_staff to authenticated;
create policy staff_read on public.admin_staff for select to authenticated
 using (user_id=auth.uid() or public.is_admin());

create or replace function public.admin_has_permission(p_permission text)
returns boolean language sql stable security definer set search_path=''
as $$
 select auth.uid() is not null and (
  public.is_admin() or exists(select 1 from public.admin_staff s where s.user_id=auth.uid() and exists(select 1 from public.profiles p where p.id=s.user_id and p.suspended_at is null)
   and ((p_permission='workspace')
    or (s.role='support' and p_permission in ('members','notifications','member_read','notes'))
    or (s.role='moderator' and p_permission in ('moderation','content','member_read','notes'))))
 );
$$;
revoke all on function public.admin_has_permission(text) from public,anon;
grant execute on function public.admin_has_permission(text) to authenticated;

create or replace function public.admin_set_staff(p_member_id uuid,p_role text,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_before text;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_member_id is null or p_role is null or p_role not in ('support','moderator','none') or p_reason is null or length(trim(p_reason)) not between 10 and 1000 then raise exception 'Invalid staff change' using errcode='22023'; end if;
 perform 1 from public.profiles where id=p_member_id and is_admin is not true and (p_role='none' or suspended_at is null) for update;
 if not found then raise exception 'Choose an active, non-administrator member' using errcode='22023'; end if;
 select role into v_before from public.admin_staff where user_id=p_member_id;
 if p_role='none' then delete from public.admin_staff where user_id=p_member_id;
 else insert into public.admin_staff(user_id,role,created_by) values(p_member_id,p_role,auth.uid()) on conflict(user_id) do update set role=excluded.role; end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),'staff_role_changed','profile',p_member_id::text,jsonb_build_object('before',v_before,'after',p_role,'reason',trim(p_reason)));
 return jsonb_build_object('updated',true);
end $$;
revoke all on function public.admin_set_staff(uuid,text,text) from public,anon;
grant execute on function public.admin_set_staff(uuid,text,text) to authenticated;

-- Scoped reads; existing administrator-only write policies stay intact.
create policy staff_profile_read on public.profiles for select to authenticated
 using(public.admin_has_permission('members') or public.admin_has_permission('moderation'));
create policy staff_notes_read on public.member_admin_notes for select to authenticated
 using(public.admin_has_permission('members') or public.admin_has_permission('moderation'));
create policy staff_notes_insert on public.member_admin_notes for insert to authenticated
 with check(author_id=auth.uid() and (public.admin_has_permission('members') or public.admin_has_permission('moderation')));
create policy staff_reports_read on public.member_reports for select to authenticated using(public.admin_has_permission('moderation'));

-- Change only these existing, audited operations to accept their explicit scope.
-- Their field validation, row locks and audit writes are preserved verbatim.
do $$
declare f record; v_permission text;
begin
 for f in select p.oid,p.proname,pg_get_functiondef(p.oid) as definition from pg_proc p
 where p.pronamespace='public'::regnamespace and p.proname in
 ('admin_edit_member','admin_edit_member_extended','admin_remove_member_connection','admin_set_member_suspension','review_profile_verification_request','admin_update_report_status') loop
 v_permission:=case when f.proname in ('admin_set_member_suspension','review_profile_verification_request','admin_update_report_status') then 'moderation' else 'members' end;
 execute replace(f.definition,'public.is_admin()',format('public.admin_has_permission(%L)',v_permission));
 end loop;
end $$;

-- Report integrity: a member cannot forge a reviewed report through direct REST inserts.
drop policy if exists members_create_reports on public.member_reports;
create policy members_create_reports on public.member_reports for insert to authenticated
 with check(reporter_id=auth.uid() and reported_member_id<>auth.uid() and status='open'
 and reviewed_by_admin_id is null and reviewed_at is null and moderation_note is null);
revoke update on public.member_reports from authenticated;
create or replace function public.count_member_reports(p_member_id uuid)
returns integer language plpgsql stable security definer set search_path=''
as $$ begin
 if auth.uid() is null or not public.admin_has_permission('moderation') then raise exception 'Forbidden' using errcode='42501'; end if;
 return (select count(*)::integer from public.member_reports where reported_member_id=p_member_id);
end $$;
-- Block state must not be inspectable for arbitrary pairs of other members.
create or replace function public.is_blocked_between(p_user_a uuid,p_user_b uuid)
returns boolean language plpgsql stable security definer set search_path=''
as $$ begin
 if auth.uid() is null or (auth.uid() not in (p_user_a,p_user_b) and not public.is_admin()) then raise exception 'Forbidden' using errcode='42501'; end if;
 return exists(select 1 from public.member_blocks where (blocker_id=p_user_a and blocked_id=p_user_b) or (blocker_id=p_user_b and blocked_id=p_user_a));
end $$;

create table public.member_notices (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 120),
 body text not null check(length(trim(body)) between 1 and 2000),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 read_at timestamptz
);
create index member_notices_member_created on public.member_notices(member_id,created_at desc);
alter table public.member_notices enable row level security;
revoke all on public.member_notices from anon,authenticated;
grant select on public.member_notices to authenticated;
create policy notices_read on public.member_notices for select to authenticated
 using(member_id=auth.uid() or public.admin_has_permission('notifications'));
create or replace function public.admin_send_member_notice(p_member_id uuid,p_title text,p_body text)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_id uuid; begin
 if auth.uid() is null or not public.admin_has_permission('notifications') then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_title is null or length(trim(p_title)) not between 1 and 120 or p_body is null or length(trim(p_body)) not between 1 and 2000 then raise exception 'Invalid notification' using errcode='22023'; end if;
 perform 1 from public.profiles where id=p_member_id;
 if not found then raise exception 'Member not found' using errcode='P0002'; end if;
 insert into public.member_notices(member_id,title,body,created_by) values(p_member_id,trim(p_title),trim(p_body),auth.uid()) returning id into v_id;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata) values(auth.uid(),'member_notice_sent','profile',p_member_id::text,jsonb_build_object('notice_id',v_id,'title',trim(p_title)));
 return v_id;
end $$;
create or replace function public.mark_member_notice_read(p_notice_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$ begin
 if auth.uid() is null then raise exception 'Forbidden' using errcode='42501'; end if;
 update public.member_notices set read_at=coalesce(read_at,now()) where id=p_notice_id and member_id=auth.uid();
 return found;
end $$;
revoke all on function public.admin_send_member_notice(uuid,text,text),public.mark_member_notice_read(uuid) from public,anon;
grant execute on function public.admin_send_member_notice(uuid,text,text),public.mark_member_notice_read(uuid) to authenticated;

-- Content decisions are atomic with their audit records. Original stories are retained.
create policy staff_stories_read on public.success_stories for select to authenticated using(public.admin_has_permission('content'));
create or replace function public.admin_review_story(p_story_id uuid,p_status text,p_note text,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_story public.success_stories%rowtype; begin
 if auth.uid() is null or not public.admin_has_permission('content') then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status is null or p_status not in ('approved','rejected','pending') or p_note is null or length(trim(p_note)) not between 10 and 1000 then raise exception 'Enter a decision and a reason (10–1000 characters)' using errcode='22023'; end if;
 select * into v_story from public.success_stories where id=p_story_id for update;
 if not found then raise exception 'Story not found' using errcode='P0002'; end if;
 if v_story.updated_at is distinct from p_expected_updated_at then raise exception 'Story changed; refresh before reviewing' using errcode='40001'; end if;
 update public.success_stories set status=p_status,admin_notes=trim(p_note),updated_at=clock_timestamp(),approved_at=case when p_status='approved' then now() else null end where id=p_story_id;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata) values(auth.uid(),'story_reviewed','success_story',p_story_id::text,jsonb_build_object('before',v_story.status,'after',p_status,'reason',trim(p_note)));
 return jsonb_build_object('updated',true);
end $$;
revoke all on function public.admin_review_story(uuid,text,text,timestamptz) from public,anon;
grant execute on function public.admin_review_story(uuid,text,text,timestamptz) to authenticated;

create table public.content_moderation_log (
 id uuid primary key default gen_random_uuid(),member_id uuid not null references public.profiles(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,kind text not null check(kind in ('photo','bio','unpublish')),
 content text,reason text not null,created_at timestamptz not null default now()
);
create index content_moderation_member_created on public.content_moderation_log(member_id,created_at desc);
alter table public.content_moderation_log enable row level security;
revoke all on public.content_moderation_log from anon,authenticated;
grant select on public.content_moderation_log to authenticated;
create policy content_log_read on public.content_moderation_log for select to authenticated using(public.admin_has_permission('content'));
create or replace function public.admin_moderate_content(p_member_id uuid,p_kind text,p_content text,p_reason text)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_profile public.profiles%rowtype; begin
 if auth.uid() is null or not public.admin_has_permission('content') then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_kind is null or p_kind not in ('photo','bio','unpublish') or p_reason is null or length(trim(p_reason)) not between 10 and 1000 then raise exception 'Invalid moderation input' using errcode='22023'; end if;
 select * into v_profile from public.profiles where id=p_member_id and is_admin is not true for update;
 if not found then raise exception 'Member not found' using errcode='P0002'; end if;
 if p_kind='photo' then
  if p_content is null or (v_profile.photo_url is distinct from p_content and not coalesce(v_profile.additional_photo_urls,'[]'::jsonb) @> jsonb_build_array(p_content)) then raise exception 'Photo changed; refresh before reviewing' using errcode='40001'; end if;
  update public.profiles set photo_url=case when photo_url=p_content then null else photo_url end,
  additional_photo_urls=coalesce((select jsonb_agg(value) from jsonb_array_elements(coalesce(additional_photo_urls,'[]'::jsonb)) where value<>to_jsonb(p_content)),'[]'::jsonb) where id=p_member_id;
 elsif p_kind='bio' then
  if v_profile.bio is distinct from p_content then raise exception 'Biography changed; refresh before reviewing' using errcode='40001'; end if;
  update public.profiles set bio=null where id=p_member_id;
 else
  if not coalesce(v_profile.is_published,false) then raise exception 'Profile is already unpublished' using errcode='40001'; end if;
  update public.profiles set is_published=false where id=p_member_id;
 end if;
 insert into public.content_moderation_log(member_id,actor_id,kind,content,reason) values(p_member_id,auth.uid(),p_kind,case when p_kind='unpublish' then null else p_content end,trim(p_reason));
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata) values(auth.uid(),'content_'||p_kind||'_removed','profile',p_member_id::text,jsonb_build_object('reason',trim(p_reason),'kind',p_kind));
 return jsonb_build_object('updated',true);
end $$;
revoke all on function public.admin_moderate_content(uuid,text,text,text) from public,anon;
grant execute on function public.admin_moderate_content(uuid,text,text,text) to authenticated;

-- Content reviewers need a bounded, safe directory, without private member fields.
create or replace function public.admin_content_queue(p_search text default '',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_result jsonb; v_total bigint; begin
 if auth.uid() is null or not public.admin_has_permission('content') then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_page is null or p_page not between 1 and 100000 or p_search is null or length(p_search)>100 then raise exception 'Invalid filters' using errcode='22023'; end if;
 select count(*) into v_total from public.profiles where is_admin is not true and (display_name ilike '%'||p_search||'%' or id::text=p_search);
 select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) into v_result from (
 select id,display_name,bio,photo_url,additional_photo_urls,is_published,updated_at from public.profiles
 where is_admin is not true and (display_name ilike '%'||p_search||'%' or id::text=p_search)
 order by updated_at desc nulls last,id limit 24 offset (p_page-1)*24) q;
 return jsonb_build_object('members',v_result,'total',v_total,'page',p_page,'pageSize',24);
end $$;
revoke all on function public.admin_content_queue(text,integer) from public,anon;
grant execute on function public.admin_content_queue(text,integer) to authenticated;
notify pgrst,'reload schema';

create policy staff_verification_read on public.verification_requests for select to authenticated using(public.admin_has_permission('member_read'));
create policy staff_connections_read on public.connections for select to authenticated using(public.admin_has_permission('members'));
-- Moderators can add investigation notes, but cannot edit unrelated member fields.
create or replace function public.admin_reports_list(p_status text default 'all',p_reason text default 'all',p_search text default '',p_from timestamptz default null,p_to timestamptz default null,p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_reports jsonb; v_total bigint; begin
 if auth.uid() is null or not public.admin_has_permission('moderation') then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status is null or p_status not in ('all','open','under_review','resolved','dismissed') or p_reason is null or p_reason not in ('all','fake_profile','harassment','scam','inappropriate_content','misleading_status','impersonation','spam','underage','other') or p_page is null or p_page not between 1 and 100000 or p_search is null or length(p_search)>100 then raise exception 'Invalid filters' using errcode='22023'; end if;
 select count(*) into v_total from public.member_reports r join public.profiles p on p.id=r.reported_member_id
 where (p_status='all' or r.status=p_status) and (p_reason='all' or r.reason=p_reason) and (p_from is null or r.created_at>=p_from) and (p_to is null or r.created_at<p_to)
 and (p_search='' or p.display_name ilike '%'||p_search||'%' or p.email ilike '%'||p_search||'%');
 select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) into v_reports from (
 select r.*,jsonb_build_object('display_name',p.display_name,'email',p.email,'suspended_at',p.suspended_at) as reported_member,
 jsonb_build_object('display_name',reporter.display_name,'email',reporter.email) as reporter,
 (select count(*) from public.member_reports history where history.reported_member_id=r.reported_member_id) as "totalReportsAgainstMember"
 from public.member_reports r join public.profiles p on p.id=r.reported_member_id join public.profiles reporter on reporter.id=r.reporter_id
 where (p_status='all' or r.status=p_status) and (p_reason='all' or r.reason=p_reason) and (p_from is null or r.created_at>=p_from) and (p_to is null or r.created_at<p_to)
 and (p_search='' or p.display_name ilike '%'||p_search||'%' or p.email ilike '%'||p_search||'%')
 order by r.created_at desc,r.id limit 20 offset (p_page-1)*20) q;
 return jsonb_build_object('reports',v_reports,'total',v_total,'page',p_page,'pageSize',20);
end $$;
revoke all on function public.admin_reports_list(text,text,text,timestamptz,timestamptz,integer) from public,anon;
grant execute on function public.admin_reports_list(text,text,text,timestamptz,timestamptz,integer) to authenticated;
notify pgrst,'reload schema';

-- Direct story updates must use the audited review function.
revoke update,delete on public.success_stories from authenticated;
-- Validate moderation-note bounds at the database boundary as well as the API.
alter table public.member_reports add constraint moderation_note_length check(length(coalesce(moderation_note,''))<=2000);

-- Only aggregate community metrics are shared with delegated staff.
do $$ declare v_definition text; begin
 select pg_get_functiondef(p.oid) into v_definition from pg_proc p
 where p.pronamespace='cupidmatch_admin'::regnamespace and p.proname='dashboard_counts';
 if v_definition is not null then execute replace(v_definition,'public.is_admin()','public.admin_has_permission(''workspace'')'); end if;
end $$;

-- Submitted stories always start pending. Reviewer notes never become public data.
create policy story_submission_integrity on public.success_stories as restrictive for insert to authenticated
 with check(status='pending' and approved_at is null and admin_notes is null and (submitted_by_uid=auth.uid() or submitted_by_uid is null));
revoke select on public.success_stories from public,anon,authenticated;
grant select(id,couple_names,story_text,photo_url,status,submitted_at,updated_at,approved_at) on public.success_stories to anon,authenticated;
create or replace function public.admin_stories_list(p_status text default 'pending',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_rows jsonb; v_total bigint; begin
 if auth.uid() is null or not public.admin_has_permission('content') then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_status is null or p_status not in ('all','pending','approved','rejected') or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filters' using errcode='22023'; end if;
 select count(*) into v_total from public.success_stories where p_status='all' or status=p_status;
 select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) into v_rows from (
 select id,couple_names,story_text,photo_url,status,admin_notes,submitted_at,updated_at,approved_at
 from public.success_stories where p_status='all' or status=p_status order by submitted_at desc,id limit 24 offset(p_page-1)*24) q;
 return jsonb_build_object('stories',v_rows,'total',v_total,'page',p_page,'pageSize',24);
end $$;
revoke all on function public.admin_stories_list(text,integer) from public,anon;
grant execute on function public.admin_stories_list(text,integer) to authenticated;
create or replace function public.published_success_stories()
returns table(id uuid,couple_names text,story_text text,photo_url text,approved_at timestamptz)
language sql stable security definer set search_path=''
as $$ select s.id,s.couple_names,s.story_text,s.photo_url,s.approved_at from public.success_stories s where s.status='approved' order by s.approved_at desc,s.id limit 100 $$;
revoke all on function public.published_success_stories() from public;
grant execute on function public.published_success_stories() to anon,authenticated;
notify pgrst,'reload schema';

-- Keep privileged implementations in the existing non-exposed admin schema.
-- Public RPC signatures remain invoker wrappers so clients need no service key.
grant usage on schema cupidmatch_admin to authenticated,anon;
do $$
declare f record; v_names text; v_role text;
begin
 for f in select p.*,pg_get_functiondef(p.oid) as definition,
 pg_get_function_arguments(p.oid) as arguments,pg_get_function_result(p.oid) as result
 from pg_proc p where p.pronamespace='public'::regnamespace and p.proname in
 ('admin_has_permission','admin_set_staff','admin_edit_member','admin_edit_member_extended','admin_remove_member_connection','admin_set_member_suspension','review_profile_verification_request','admin_update_report_status','count_member_reports','is_blocked_between','admin_send_member_notice','mark_member_notice_read','admin_review_story','admin_moderate_content','admin_content_queue','admin_reports_list','admin_stories_list','published_success_stories') loop
 -- proargnames may also contain output columns for RETURNS TABLE functions.
 select coalesce(string_agg(quote_ident(name),',' order by ordinal),'') into v_names
 from unnest(f.proargnames) with ordinality as args(name,ordinal) where ordinal<=f.pronargs;
 execute replace(f.definition,'FUNCTION public.'||f.proname||'(', 'FUNCTION cupidmatch_admin.'||f.proname||'(');
 execute format('revoke all on function cupidmatch_admin.%I(%s) from public,anon,authenticated',f.proname,pg_get_function_identity_arguments(f.oid));
 v_role:=case when f.proname='published_success_stories' then 'anon,authenticated' else 'authenticated' end;
 execute format('grant execute on function cupidmatch_admin.%I(%s) to %s',f.proname,pg_get_function_identity_arguments(f.oid),v_role);
 execute format('create or replace function public.%I(%s) returns %s language sql %s security invoker set search_path='''' as %L',f.proname,f.arguments,f.result,case when f.provolatile='s' then 'stable' else 'volatile' end,'select * from cupidmatch_admin.'||quote_ident(f.proname)||'('||v_names||');');
 end loop;
end $$;
notify pgrst,'reload schema';

create or replace function cupidmatch_admin.members_list(p_filter text default 'all',p_search text default '',p_sort text default 'newest',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_rows jsonb;v_total bigint;v_counts jsonb;v_where text;v_order text;
begin
 if auth.uid() is null or not public.admin_has_permission('members') then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_filter is null or p_filter not in ('all','verified','unverified','admins','published','unpublished','suspended') or p_search is null or length(p_search)>100 or p_sort is null or p_sort not in ('newest','oldest','name') or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filters' using errcode='22023'; end if;
 v_where:=' where ($1=''all'' or ($1=''verified'' and is_verified is true) or ($1=''unverified'' and is_verified is not true) or ($1=''admins'' and is_admin is true) or ($1=''published'' and is_published is true) or ($1=''unpublished'' and is_published is not true) or ($1=''suspended'' and suspended_at is not null)) and ($2='''' or display_name ilike ''%''||$2||''%'' or email ilike ''%''||$2||''%'' or id::text=$2)';
 v_order:=case p_sort when 'oldest' then 'created_at asc nulls last,id' when 'name' then 'display_name asc nulls last,id' else 'created_at desc nulls last,id' end;
 execute 'select count(*) from public.profiles'||v_where into v_total using p_filter,p_search;
 execute 'select coalesce(jsonb_agg(jsonb_build_object(''id'',q.id,''displayName'',q.display_name,''email'',q.email,''isAdmin'',q.is_admin,''isVerified'',q.is_verified,''isPublished'',q.is_published,''suspendedAt'',q.suspended_at,''createdAt'',q.created_at,''photoURL'',q.photo_url)),''[]''::jsonb) from (select id,display_name,email,is_admin,is_verified,is_published,suspended_at,created_at,photo_url from public.profiles'||v_where||' order by '||v_order||' limit 12 offset $3) q' into v_rows using p_filter,p_search,(p_page-1)*12;
 select jsonb_build_object('all',count(*),'verified',count(*) filter(where is_verified is true),'unverified',count(*) filter(where is_verified is not true),'admins',count(*) filter(where is_admin is true),'published',count(*) filter(where is_published is true),'unpublished',count(*) filter(where is_published is not true),'suspended',count(*) filter(where suspended_at is not null)) into v_counts from public.profiles;
 return jsonb_build_object('members',v_rows,'total',v_total,'counts',v_counts,'page',p_page,'pageSize',12);
end $$;
revoke all on function cupidmatch_admin.members_list(text,text,text,integer) from public,anon;
grant execute on function cupidmatch_admin.members_list(text,text,text,integer) to authenticated;
create or replace function public.admin_members_list(p_filter text default 'all',p_search text default '',p_sort text default 'newest',p_page integer default 1)
returns jsonb language sql stable security invoker set search_path=''
as $$ select cupidmatch_admin.members_list(p_filter,p_search,p_sort,p_page) $$;
revoke all on function public.admin_members_list(text,text,text,integer) from public,anon;
grant execute on function public.admin_members_list(text,text,text,integer) to authenticated;
notify pgrst,'reload schema';
