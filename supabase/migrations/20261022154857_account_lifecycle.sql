-- Lifecycle fields are server-managed; deletion is irreversible once requested.
alter table public.profiles add column deactivated_at timestamptz;
alter table public.profiles add column deletion_requested_at timestamptz;
create table public.account_deletions (
 user_id uuid primary key, actor_id uuid, requested_at timestamptz not null default now(),
 completed_at timestamptz, state text not null default 'pending' check(state in ('pending','processing','failed','completed')),
 attempts integer not null default 0, lease_until timestamptz, error_code text
);
alter table public.account_deletions enable row level security;
revoke all on public.account_deletions from public,anon,authenticated;
grant all on public.account_deletions to service_role;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
-- Restricted helper checks the caller only. No arbitrary session lookup is exposed.
create function private.account_session_active() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions s join public.profiles p on p.id=s.user_id
 where s.id=nullif(auth.jwt()->>'session_id','')::uuid and s.user_id=auth.uid()
 and p.deletion_requested_at is null)
$$;
revoke all on function private.account_session_active() from public,anon;
grant execute on function private.account_session_active() to authenticated;
-- Restrictive policies combine with existing ownership policies, never replace them.
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename<>'account_deletions' loop
 execute format('create policy account_live_session on public.%I as restrictive for all to authenticated using ((select private.account_session_active())) with check ((select private.account_session_active()))',t.tablename);
 end loop;
end $$;
create policy account_live_session on storage.objects as restrictive for all to authenticated
 using ((select private.account_session_active())) with check ((select private.account_session_active()));
create function public.protect_account_lifecycle() returns trigger language plpgsql set search_path='' as $$
begin
 if current_user not in ('postgres','service_role','supabase_admin') then
  if tg_op='INSERT' then
   if new.deactivated_at is not null or new.deletion_requested_at is not null then raise exception 'Server-managed lifecycle'; end if;
  elsif new.deactivated_at is distinct from old.deactivated_at or new.deletion_requested_at is distinct from old.deletion_requested_at
   or old.deletion_requested_at is not null then raise exception 'Server-managed lifecycle'; end if;
 end if;
 return new;
end $$;
create trigger protect_account_lifecycle before insert or update on public.profiles for each row execute function public.protect_account_lifecycle();
create or replace function public.member_is_active(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=p_id and suspended_at is null and deactivated_at is null and deletion_requested_at is null)
$$;
-- Preserve the curated discovery projection, applying lifecycle and live-session filters.
do $$ declare v text; begin
 select pg_get_viewdef('public.discovery_profiles'::regclass,true) into v;
 v:=regexp_replace(v,';\s*$','');
 execute 'create or replace view public.discovery_profiles as select * from ('||v||') d where public.member_is_active(d.id) and private.account_session_active()';
end $$;
alter table public.promo_codes alter column created_by drop not null;
-- Shared chat history survives; the erased participant becomes NULL.
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.chats'::regclass and contype='f' and confrelid='public.profiles'::regclass loop
 execute format('alter table public.chats drop constraint %I',c.conname);
 end loop;
end $$;
alter table public.chats alter column participant_1 drop not null;
alter table public.chats alter column participant_2 drop not null;
alter table public.chats add foreign key(participant_1) references public.profiles(id) on delete set null;
alter table public.chats add foreign key(participant_2) references public.profiles(id) on delete set null;
-- Existing social triggers also run on trusted cleanup updates. Only the service
-- role / migration owner may bypass the active-member check.
do $$ declare v text; begin
 select pg_get_functiondef('public.reject_suspended_social_writes()'::regprocedure) into v;
 v:=replace(v,'begin', E'begin\n if current_setting(''role'',true) in (''service_role'',''postgres'',''none'',''supabase_auth_admin'') then return new; end if;\n if tg_table_name=''chats'' and tg_op=''UPDATE'' and (old.participant_1 is null or old.participant_2 is null) and (to_jsonb(new)-''unread_by'')=(to_jsonb(old)-''unread_by'') then return new; end if;');
 execute v;
end $$;
-- Auth tables are not writable by service_role. Keep the narrow session
-- revocation capability in an unexposed schema with service-only execution.
grant usage on schema private to service_role;
create function private.account_revoke_sessions(p_user uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if current_setting('role',true) not in ('service_role','postgres','none') then raise exception 'Forbidden'; end if;
 delete from auth.sessions where user_id=p_user;
end $$;
revoke all on function private.account_revoke_sessions(uuid) from public,anon,authenticated;
grant execute on function private.account_revoke_sessions(uuid) to service_role;
create function public.account_begin_deletion(p_user uuid,p_actor uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.profiles where id=p_user and not coalesce(is_admin,false) for update;
 if not found then raise exception 'Member unavailable'; end if;
 insert into public.account_deletions(user_id,actor_id) values(p_user,p_actor) on conflict(user_id) do nothing;
 update public.profiles set deletion_requested_at=coalesce(deletion_requested_at,now()),is_published=false where id=p_user;
 delete from public.profile_share_links where owner_id=p_user or profile_id=p_user;
 delete from public.biodata_share_links where owner_id=p_user;
 perform private.account_revoke_sessions(p_user);
end $$;
create function public.account_storage_objects(p_user uuid) returns table(bucket_id text,name text) language sql security invoker set search_path='' as $$
 select o.bucket_id,o.name from storage.objects o where o.owner_id=p_user::text
 or (o.bucket_id='media' and starts_with(o.name,'users/'||p_user::text||'/'))
 or (o.bucket_id='horoscope-private' and starts_with(o.name,p_user::text||'/'))
 or (o.bucket_id='media' and o.name in(select photo_storage_path from public.success_stories where submitted_by_uid=p_user))
 order by o.bucket_id,o.name limit 100
$$;
-- Atomic relational cleanup; FK cascades handle owned profiles/biodata/horoscope
-- at Auth deletion. This function deliberately never deletes storage metadata.
create function public.account_erase_residuals(p_user uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.account_deletions where user_id=p_user and state='processing') then raise exception 'Deletion not claimed'; end if;
 delete from public.messages where sender_id=p_user;
 update public.chats set participant_details=coalesce(participant_details,'{}'::jsonb)-p_user::text,
 unread_by=coalesce(unread_by,'{}'::jsonb)-p_user::text,
 last_message_text=case when last_message_sender_id=p_user then 'Member deleted' else last_message_text end,
 last_message_sender_id=case when last_message_sender_id=p_user then null else last_message_sender_id end
 where participant_1=p_user or participant_2=p_user;
 update public.posts set liked_by=array_remove(liked_by,p_user),likes_count=cardinality(array_remove(liked_by,p_user)),
 comment_list=coalesce((select jsonb_agg(e) from jsonb_array_elements(coalesce(comment_list,'[]')) e where coalesce(e->>'userId',e->>'user_id','')<>p_user::text),'[]'),
 comments_count=(select count(*) from jsonb_array_elements(coalesce(comment_list,'[]')) e where coalesce(e->>'userId',e->>'user_id','')<>p_user::text),
 comment_notifications=coalesce(comment_notifications,'{}')-p_user::text
 where user_id<>p_user;
 update public.profiles set comment_notifications=coalesce(comment_notifications,'{}')-p_user::text where id<>p_user;
 delete from public.success_stories where submitted_by_uid=p_user;
 delete from public.member_admin_notes where member_id=p_user or author_id=p_user;
 delete from public.promo_redemptions where user_id=p_user;
 update public.promo_codes set created_by=null where created_by=p_user;
 update public.verification_requests set reviewer_id=null,reviewer_note=null where reviewer_id=p_user;
 update public.admin_audit_log set actor_id=case when actor_id=p_user then null else actor_id end,metadata='{}',target_id=null
 where target_id=p_user::text or actor_id=p_user;
 -- These newer billing tables are optional in older deployments.
 if to_regclass('public.subscription_events') is not null then execute 'delete from public.subscription_events where user_id=$1' using p_user; end if;
end $$;
create function public.account_billing_active(p_user uuid) returns boolean language plpgsql security invoker set search_path='' as $$
declare v boolean; begin
 select exists(select 1 from public.user_subscriptions where user_id=p_user and provider_subscription_id is not null and status not in ('canceled','cancelled','expired','refunded')) into v;
 if v then return true; end if;
 if to_regclass('public.member_subscriptions') is not null then
 execute 'select exists(select 1 from public.member_subscriptions where user_id=$1 and stripe_subscription_id is not null and status not in (''canceled'',''cancelled'',''expired'',''refunded''))' into v using p_user;
 end if;
 return coalesce(v,false);
end $$;
create function public.account_set_deactivated(p_user uuid,p_deactivate boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
 update public.profiles set deactivated_at=case when p_deactivate then now() else null end,is_published=false
 where id=p_user and deletion_requested_at is null and not coalesce(is_admin,false);
 if not found then raise exception 'Member unavailable'; end if;
 if p_deactivate then
 delete from public.profile_share_links where owner_id=p_user;
 delete from public.biodata_share_links where owner_id=p_user;
 end if;
end $$;
-- All privileged operations require a server-side service key.
revoke all on function public.account_begin_deletion(uuid,uuid),public.account_storage_objects(uuid),public.account_erase_residuals(uuid),public.account_billing_active(uuid),public.account_set_deactivated(uuid,boolean) from public,anon,authenticated;
grant execute on function public.account_begin_deletion(uuid,uuid),public.account_storage_objects(uuid),public.account_erase_residuals(uuid),public.account_billing_active(uuid),public.account_set_deactivated(uuid,boolean) to service_role;

create function public.account_session_is_live() returns boolean language sql stable security invoker set search_path='' as $$
 select private.account_session_active()
$$;
revoke all on function public.account_session_is_live() from public,anon;
grant execute on function public.account_session_is_live() to authenticated;

create function private.account_remove_empty_chat() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.participant_1 is null and new.participant_2 is null then delete from public.chats where id=new.id; end if;
 return new;
end $$;
create trigger account_remove_empty_chat after update of participant_1,participant_2 on public.chats
 for each row execute function private.account_remove_empty_chat();

revoke all on function private.account_remove_empty_chat() from public,anon,authenticated;
