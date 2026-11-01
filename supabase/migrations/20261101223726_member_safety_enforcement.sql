-- Staging/review only. Uses existing blocks/reports names, not parallel tables.
-- Requires the lifecycle session helpers and consolidated interest migration.
create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reported_id uuid not null references public.profiles(id) on delete cascade,
 reason text not null check(reason in ('inappropriate_content','fake_profile','harassment','spam','safety_concern','other')),
 description text check(length(description)<=1000),
 status text not null default 'pending' check(status in ('pending','reviewing','resolved','dismissed')),
 reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(reporter_id<>reported_id)
);
create index if not exists reports_status_created_idx on public.reports(status,created_at desc);
create index if not exists reports_reporter_created_idx on public.reports(reporter_id,created_at desc);
alter table public.reports enable row level security;
revoke all on public.reports from anon,authenticated;
grant select,insert,update on public.reports to authenticated;
drop policy if exists reports_insert_authenticated on public.reports;
create policy reports_insert_authenticated on public.reports for insert to authenticated
with check(reporter_id=(select auth.uid()) and reporter_id<>reported_id and status='pending' and reviewed_by is null and reviewed_at is null);
drop policy if exists reports_select_admin on public.reports;
create policy reports_select_admin on public.reports for select to authenticated using(public.is_admin());
drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports for update to authenticated using(public.is_admin()) with check(public.is_admin());
-- Restrictive gates protect privacy even if older permissive policies coexist.
drop policy if exists reports_admin_read_guard on public.reports;
create policy reports_admin_read_guard on public.reports as restrictive for select to authenticated using(public.is_admin());
drop policy if exists reports_admin_update_guard on public.reports;
create policy reports_admin_update_guard on public.reports as restrictive for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists reports_sender_insert_guard on public.reports;
create policy reports_sender_insert_guard on public.reports as restrictive for insert to authenticated
with check(reporter_id=(select auth.uid()) and reporter_id<>reported_id and status='pending' and reviewed_by is null and reviewed_at is null);
drop policy if exists account_live_session on public.reports;
create policy account_live_session on public.reports as restrictive for all to authenticated
using(private.account_session_active()) with check(private.account_session_active());

create or replace function public.guard_member_report_update() returns trigger
language plpgsql security invoker set search_path='' as $$begin
 if current_user in ('postgres','supabase_admin','service_role','supabase_auth_admin') then return new;end if;
 if not coalesce(public.is_admin(),false) then raise exception 'Forbidden' using errcode='42501';end if;
 if (to_jsonb(new)-array['status','reviewed_by','reviewed_at','updated_at']) is distinct from
    (to_jsonb(old)-array['status','reviewed_by','reviewed_at','updated_at']) then
   raise exception 'Report evidence cannot be edited' using errcode='42501';end if;
 if new.status is distinct from old.status then new.reviewed_by:=auth.uid();new.reviewed_at:=now();new.updated_at:=now();
 else new.reviewed_by:=old.reviewed_by;new.reviewed_at:=old.reviewed_at;new.updated_at:=old.updated_at;end if;
 return new;
end $$;
revoke all on function public.guard_member_report_update() from public,anon,authenticated;
drop trigger if exists guard_member_report_update on public.reports;
create trigger guard_member_report_update before update on public.reports for each row execute function public.guard_member_report_update();
create or replace function public.audit_member_report_review() returns trigger
language plpgsql security definer set search_path='' as $$begin
 if new.status is distinct from old.status then
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
  values(auth.uid(),'member_report_reviewed','report',new.id::text,jsonb_build_object('previousStatus',old.status,'status',new.status));
 end if;return new;
end $$;
revoke all on function public.audit_member_report_review() from public,anon,authenticated;
drop trigger if exists audit_member_report_review on public.reports;
create trigger audit_member_report_review after update on public.reports for each row execute function public.audit_member_report_review();

-- Hide who blocked a member; the boolean RPC only answers about the caller's pair.
drop policy if exists blocks_owner_read_guard on public.blocks;
create policy blocks_owner_read_guard on public.blocks as restrictive for select to authenticated using(blocker_id=(select auth.uid()));
drop policy if exists blocks_sender_insert_guard on public.blocks;
create policy blocks_sender_insert_guard on public.blocks as restrictive for insert to authenticated with check(blocker_id=(select auth.uid()) and blocker_id<>blocked_id);
create or replace function public.are_blocked(user_a uuid,user_b uuid) returns boolean
language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or auth.uid() not in(user_a,user_b) or not coalesce(private.account_session_active(),false) then
  raise exception 'Interaction unavailable' using errcode='42501';end if;
 return exists(select 1 from public.blocks where (blocker_id=user_a and blocked_id=user_b)or(blocker_id=user_b and blocked_id=user_a));
end $$;
revoke all on function public.are_blocked(uuid,uuid) from public,anon;
grant execute on function public.are_blocked(uuid,uuid) to authenticated;
create or replace function public.guard_member_block_update() returns trigger
language plpgsql security invoker set search_path='' as $$begin
 if current_user not in ('postgres','supabase_admin','service_role','supabase_auth_admin') and
  (new.id is distinct from old.id or new.blocker_id is distinct from old.blocker_id or new.blocked_id is distinct from old.blocked_id or new.created_at is distinct from old.created_at) then
  raise exception 'Block identity cannot change' using errcode='42501';end if;return new;
end $$;
revoke all on function public.guard_member_block_update() from public,anon,authenticated;
drop trigger if exists guard_member_block_update on public.blocks;
create trigger guard_member_block_update before update on public.blocks for each row execute function public.guard_member_block_update();

create or replace function public.reject_blocked_member_write() returns trigger
language plpgsql security definer set search_path='' as $$declare v_a uuid;v_b uuid;v_cleanup boolean:=false;begin
 if current_setting('role',true) in ('postgres','service_role','none','supabase_auth_admin') then return new;end if;
 if tg_table_name='messages' then
  select participant_1,participant_2 into v_a,v_b from public.chats where id=new.chat_id;
 elsif tg_table_name='chats' then
  -- Reading history may acknowledge unread state without reopening messaging.
  if tg_op='UPDATE' and (to_jsonb(new)-array['unread_by','updated_at'])=(to_jsonb(old)-array['unread_by','updated_at']) then v_cleanup:=true;end if;
  v_a:=new.participant_1;v_b:=new.participant_2;
 elsif tg_table_name='connections' then v_a:=new.member_a_id;v_b:=new.member_b_id;
 else
  if tg_op='UPDATE' and new.sender_id=old.sender_id and new.receiver_id=old.receiver_id and new.status in ('withdrawn','declined') then v_cleanup:=true;end if;
  v_a:=new.sender_id;v_b:=new.receiver_id;
 end if;
 if auth.uid() is null or v_a is null or v_b is null then raise exception 'Interaction unavailable' using errcode='42501';end if;
 if v_cleanup and (auth.uid() in(v_a,v_b) or coalesce(public.is_admin(),false)) then return new;end if;
 if auth.uid() not in(v_a,v_b) or exists(
  select 1 from public.blocks where(blocker_id=v_a and blocked_id=v_b)or(blocker_id=v_b and blocked_id=v_a)) then
  raise exception 'Interaction unavailable' using errcode='42501';end if;return new;
end $$;
revoke all on function public.reject_blocked_member_write() from public,anon,authenticated;
drop trigger if exists reject_blocked_member_write on public.match_requests;
create trigger reject_blocked_member_write before insert or update on public.match_requests for each row execute function public.reject_blocked_member_write();
drop trigger if exists reject_blocked_member_write on public.connections;
create trigger reject_blocked_member_write before insert or update on public.connections for each row execute function public.reject_blocked_member_write();
drop trigger if exists reject_blocked_member_write on public.chats;
create trigger reject_blocked_member_write before insert or update on public.chats for each row execute function public.reject_blocked_member_write();
drop trigger if exists reject_blocked_member_write on public.messages;
create trigger reject_blocked_member_write before insert or update on public.messages for each row execute function public.reject_blocked_member_write();
create or replace function public.disconnect_blocked_members() returns trigger
language plpgsql security definer set search_path='' as $$begin
 delete from public.connections where member_a_id=least(new.blocker_id,new.blocked_id) and member_b_id=greatest(new.blocker_id,new.blocked_id);
 return new;end $$;
revoke all on function public.disconnect_blocked_members() from public,anon,authenticated;
drop trigger if exists disconnect_blocked_members on public.blocks;
create trigger disconnect_blocked_members after insert on public.blocks for each row execute function public.disconnect_blocked_members();
-- Data-changing release gate: remove connections for PRE-EXISTING blocks too.
-- Keep all historical chats/messages; unblock does not restore the connection.
delete from public.connections c using public.blocks b
where c.member_a_id=least(b.blocker_id,b.blocked_id) and c.member_b_id=greatest(b.blocker_id,b.blocked_id);

create or replace function public.own_blocked_members(p_limit integer default 50)
returns table(id uuid,blocker_id uuid,blocked_id uuid,reason text,created_at timestamptz,reference text)
language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or not coalesce(private.account_session_active(),false) then
  raise exception 'Sign in to manage blocked members' using errcode='42501';end if;
 return query select b.id,b.blocker_id,b.blocked_id,b.reason,b.created_at,
  coalesce('CM-'||lpad(r.number::text,6,'0'),'Unavailable member')
 from public.blocks b left join public.member_public_references r on r.member_id=b.blocked_id
 where b.blocker_id=auth.uid() order by b.created_at desc,b.id limit least(greatest(coalesce(p_limit,50),1),500);
end $$;
revoke all on function public.own_blocked_members(integer) from public,anon;
grant execute on function public.own_blocked_members(integer) to authenticated;

-- Preserve the current discovery projection, privacy and lifecycle predicates.
-- Do not replace it with SELECT * FROM profiles or change invoker semantics.
do $$declare v text;begin
 select pg_get_viewdef('public.discovery_profiles'::regclass,true) into v;
 if position('member_safety_profile' in v)=0 then
  v:=regexp_replace(v,';\s*$','');
  execute 'create or replace view public.discovery_profiles as select * from ('||v||') member_safety_profile where not exists (select 1 from public.blocks member_safety_block where (member_safety_block.blocker_id=auth.uid() and member_safety_block.blocked_id=member_safety_profile.id) or (member_safety_block.blocked_id=auth.uid() and member_safety_block.blocker_id=member_safety_profile.id))';
 end if;
end $$;

create or replace function public.guard_member_report_insert() returns trigger
language plpgsql security definer set search_path='' as $$begin
 if current_setting('role',true) in ('postgres','service_role','none','supabase_auth_admin') then return new;end if;
 if auth.uid() is null or new.reporter_id<>auth.uid() or not coalesce(private.account_session_active(),false) then
  raise exception 'Forbidden' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,0));
 if (select count(*) from public.reports where reporter_id=auth.uid() and created_at>now()-interval '15 minutes')>=5 then
  raise exception 'You have submitted several reports recently. Please try again later.' using errcode='P0001';end if;
 new.created_at:=now();new.updated_at:=now();return new;
end $$;
revoke all on function public.guard_member_report_insert() from public,anon,authenticated;
drop trigger if exists guard_member_report_insert on public.reports;
create trigger guard_member_report_insert before insert on public.reports for each row execute function public.guard_member_report_insert();
