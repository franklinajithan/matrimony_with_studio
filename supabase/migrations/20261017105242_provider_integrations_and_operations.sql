-- Retain legacy Plus records; add the new plan code without rewriting member subscriptions.
alter table public.subscription_plans drop constraint if exists subscription_plans_code_check;
alter table public.subscription_plans add constraint subscription_plans_code_check check(code in('free','plus','premium','premium_plus'));
alter table public.subscription_plans add column if not exists three_month_price_pence integer not null default 0,add column if not exists six_month_price_pence integer not null default 0;
insert into public.subscription_plans(code,name,monthly_price_pence,three_month_price_pence,six_month_price_pence,currency,entitlements,is_active,sort_order)values
('premium','Premium',799,1999,3499,'GBP','{"messagingAfterMatch":true,"familyIntroduction":true,"seeProfileVisitors":true,"readReceipts":true,"incognitoMode":false}',true,2),
('premium_plus','Premium+',1499,3499,5999,'GBP','{"messagingAfterMatch":true,"familyIntroduction":true,"seeProfileVisitors":true,"readReceipts":true,"incognitoMode":true}',true,3)
on conflict(code)do update set name=excluded.name,monthly_price_pence=excluded.monthly_price_pence,three_month_price_pence=excluded.three_month_price_pence,six_month_price_pence=excluded.six_month_price_pence,currency=excluded.currency,entitlements=excluded.entitlements,is_active=true,sort_order=excluded.sort_order;
create unique index if not exists user_subscriptions_provider_reference on public.user_subscriptions(provider_subscription_id)where provider_subscription_id is not null;

-- Server-only provider writes. No browser can grant paid access or identity evidence.
create table cupidmatch_admin.provider_event_receipts(
 event_id text primary key,provider text not null,event_type text not null,created_at timestamptz not null default now()
);
alter table cupidmatch_admin.provider_event_receipts enable row level security;
create table public.identity_sessions(
 id uuid primary key default gen_random_uuid(),member_id uuid not null references public.profiles(id)on delete cascade,
 provider_session_id text not null unique,status text not null check(status in('requires_input','processing','verified','canceled')),
 livemode boolean not null default false,error_code text,verified_at timestamptz,provider_event_id text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index identity_sessions_member on public.identity_sessions(member_id,created_at desc);
alter table public.identity_sessions enable row level security;
revoke all on public.identity_sessions from public,anon,authenticated;
create table public.provider_operations(
 id uuid primary key default gen_random_uuid(),actor_id uuid references auth.users(id),member_id uuid references public.profiles(id),
 action text not null,reason text not null,status text not null default 'prepared',provider_reference text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.provider_operations enable row level security;
revoke all on public.provider_operations from public,anon,authenticated;
create table public.integration_attempts(
 member_id uuid references public.profiles(id)on delete cascade,kind text not null,attempted_at timestamptz not null default now()
);
create index integration_attempts_rate on public.integration_attempts(member_id,kind,attempted_at desc);
alter table public.integration_attempts enable row level security;
revoke all on public.integration_attempts from public,anon,authenticated;

create function cupidmatch_admin.reserve_integration_attempt(p_kind text)returns boolean language plpgsql security definer set search_path=''as $$
begin
 if auth.uid()is null or not public.member_is_active(auth.uid())then raise exception 'Active account required'using errcode='42501';end if;
 if p_kind is null or p_kind not in('sms_send','sms_verify','identity','checkout')then raise exception 'Invalid action'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,820));
 if(select count(*)from public.integration_attempts where member_id=auth.uid()and kind=p_kind and attempted_at>now()-interval '1 hour')>=(case when p_kind='sms_verify'then 10 else 5 end)then raise exception 'Hourly limit reached'using errcode='22023';end if;
 if p_kind='sms_send'and exists(select 1 from public.integration_attempts where member_id=auth.uid()and kind=p_kind and attempted_at>now()-interval '60 seconds')then raise exception 'Wait before requesting another code'using errcode='22023';end if;
 insert into public.integration_attempts(member_id,kind)values(auth.uid(),p_kind);return true;
end $$;
revoke all on function cupidmatch_admin.reserve_integration_attempt(text)from public,anon;
grant execute on function cupidmatch_admin.reserve_integration_attempt(text)to authenticated;
create function public.reserve_integration_attempt(p_kind text)returns boolean language sql security invoker set search_path=''as $$select cupidmatch_admin.reserve_integration_attempt(p_kind)$$;
revoke all on function public.reserve_integration_attempt(text)from public,anon;
grant execute on function public.reserve_integration_attempt(text)to authenticated;

create function cupidmatch_admin.identity_status(p_member_id uuid default null)returns jsonb language plpgsql stable security definer set search_path=''as $$
declare v_target uuid:=coalesce(p_member_id,auth.uid());v_result jsonb;
begin
 if auth.uid()is null then raise exception 'Sign in required'using errcode='42501';end if;
 if v_target<>auth.uid()and not public.admin_has_permission('moderation')and not exists(select 1 from public.discovery_profiles where id=v_target)then raise exception 'Profile unavailable'using errcode='42501';end if;
 if v_target=auth.uid()or public.admin_has_permission('moderation')then
 select jsonb_build_object('status',s.status,'testMode',not s.livemode,'verifiedAt',s.verified_at,'errorCode',s.error_code,'identityVerified',s.status='verified'and s.livemode and s.provider_event_id is not null)into v_result from public.identity_sessions s where member_id=v_target order by created_at desc limit 1;
 else select jsonb_build_object('identityVerified',exists(select 1 from public.identity_sessions where member_id=v_target and status='verified'and livemode and provider_event_id is not null))into v_result;
 end if;return coalesce(v_result,'{"status":"not_started","identityVerified":false}');
end $$;
revoke all on function cupidmatch_admin.identity_status(uuid)from public,anon;
grant execute on function cupidmatch_admin.identity_status(uuid)to authenticated;
create function public.identity_status(p_member_id uuid default null)returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.identity_status(p_member_id)$$;
revoke all on function public.identity_status(uuid)from public,anon;
grant execute on function public.identity_status(uuid)to authenticated;

alter table public.user_subscriptions add column if not exists provider_event_created bigint not null default 0;

create function public.apply_stripe_subscription(p_event_id text,p_event_type text,p_member_id uuid,p_subscription_id text,p_customer_id text,p_plan text,p_status text,p_start timestamptz,p_end timestamptz,p_cancel boolean,p_event_created bigint default 0)returns boolean language plpgsql security invoker set search_path=''as $$
declare v_id uuid;
begin
 if p_plan not in('premium','premium_plus')or p_status not in('active','trialing','past_due','cancelled','expired')or p_end is null or p_start is null or p_end<=p_start then raise exception 'Invalid provider state'using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_member_id::text,821));
 insert into cupidmatch_admin.provider_event_receipts(event_id,provider,event_type)values(p_event_id,'stripe',p_event_type)on conflict do nothing;if not found then return false;end if;
 if exists(select 1 from public.user_subscriptions where provider_subscription_id=p_subscription_id and user_id<>p_member_id)then raise exception 'Subscription owner mismatch'using errcode='42501';end if;
 select id into v_id from public.user_subscriptions where provider_subscription_id=p_subscription_id;
 if exists(select 1 from public.user_subscriptions where id=v_id and provider_event_created>p_event_created)then return false;end if;
 if p_status in('active','trialing','past_due')then update public.user_subscriptions set status='expired',updated_at=now()where user_id=p_member_id and status in('active','trialing','past_due')and id is distinct from v_id;end if;
 if v_id is null then insert into public.user_subscriptions(user_id,plan_code,status,provider,provider_customer_id,provider_subscription_id,current_period_start,current_period_end,cancel_at_period_end,provider_event_created)values(p_member_id,p_plan,p_status,'stripe',p_customer_id,p_subscription_id,p_start,p_end,p_cancel,p_event_created);
 else update public.user_subscriptions set plan_code=p_plan,status=p_status,provider_customer_id=p_customer_id,current_period_start=p_start,current_period_end=p_end,cancel_at_period_end=p_cancel,provider_event_created=p_event_created,updated_at=now()where id=v_id;end if;return true;
end $$;
revoke all on function public.apply_stripe_subscription(text,text,uuid,text,text,text,text,timestamptz,timestamptz,boolean,bigint)from public,anon,authenticated;
grant execute on function public.apply_stripe_subscription(text,text,uuid,text,text,text,text,timestamptz,timestamptz,boolean,bigint)to service_role;

create function public.apply_identity_event(p_event_id text,p_session_id text,p_status text,p_livemode boolean,p_error text default null)returns boolean language plpgsql security invoker set search_path=''as $$
begin
 if p_status is null or p_status not in('requires_input','processing','verified','canceled')then raise exception 'Invalid status'using errcode='22023';end if;
 insert into cupidmatch_admin.provider_event_receipts(event_id,provider,event_type)values(p_event_id,'stripe_identity',p_status)on conflict do nothing;if not found then return false;end if;
 update public.identity_sessions set status=p_status,livemode=p_livemode,error_code=left(p_error,100),verified_at=case when p_status='verified'then now()else null end,provider_event_id=p_event_id,updated_at=now()where provider_session_id=p_session_id;
 if not found then raise exception 'Session unavailable'using errcode='P0002';end if;return true;
end $$;
revoke all on function public.apply_identity_event(text,text,text,boolean,text)from public,anon,authenticated;
grant execute on function public.apply_identity_event(text,text,text,boolean,text)to service_role;

create function cupidmatch_admin.prepare_provider_operation(p_member_id uuid,p_action text,p_reason text,p_request_id uuid)returns uuid language plpgsql security definer set search_path=''as $$
begin
 if not public.admin_has_permission('billing')or p_member_id=auth.uid()then raise exception 'Forbidden'using errcode='42501';end if;
 if p_action not in('refund','cancel_subscription')or p_reason is null or length(trim(p_reason))not between 10 and 500 or p_request_id is null then raise exception 'Invalid action'using errcode='22023';end if;
 insert into public.provider_operations(id,actor_id,member_id,action,reason)values(p_request_id,auth.uid(),p_member_id,p_action,trim(p_reason))on conflict do nothing;
 if not exists(select 1 from public.provider_operations where id=p_request_id and actor_id=auth.uid()and member_id=p_member_id and action=p_action)then raise exception 'Request mismatch'using errcode='42501';end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(auth.uid(),'provider_operation_prepared','member',p_member_id::text,jsonb_build_object('reason',trim(p_reason),'operationId',p_request_id,'operation',p_action));return p_request_id;
end $$;
revoke all on function cupidmatch_admin.prepare_provider_operation(uuid,text,text,uuid)from public,anon;
grant execute on function cupidmatch_admin.prepare_provider_operation(uuid,text,text,uuid)to authenticated;
create function public.prepare_provider_operation(p_member_id uuid,p_action text,p_reason text,p_request_id uuid)returns uuid language sql security invoker set search_path=''as $$select cupidmatch_admin.prepare_provider_operation(p_member_id,p_action,p_reason,p_request_id)$$;
revoke all on function public.prepare_provider_operation(uuid,text,text,uuid)from public,anon;
grant execute on function public.prepare_provider_operation(uuid,text,text,uuid)to authenticated;
-- Provider helpers use service-role only after authenticating, validating signatures, or checking staff scope.
grant usage on schema cupidmatch_admin to service_role;
grant select,insert on cupidmatch_admin.provider_event_receipts to service_role;
grant select,insert,update on public.identity_sessions,public.provider_operations to service_role;
grant select,insert,update on public.user_subscriptions to service_role;
create function public.complete_provider_operation(p_id uuid,p_status text,p_reference text)returns boolean language plpgsql security invoker set search_path=''as $$
declare v_op public.provider_operations%rowtype;begin
 if p_status not in('succeeded','failed')then raise exception 'Invalid status';end if;
 update public.provider_operations set status=p_status,provider_reference=left(p_reference,200),updated_at=now()where id=p_id returning * into v_op;
 if not found then raise exception 'Operation not found';end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(v_op.actor_id,'provider_operation_'||p_status,'member',v_op.member_id::text,jsonb_build_object('operationId',p_id,'providerReference',left(p_reference,200),'operation',v_op.action));return true;
end $$;
revoke all on function public.complete_provider_operation(uuid,text,text)from public,anon,authenticated;
grant execute on function public.complete_provider_operation(uuid,text,text)to service_role;
grant insert on public.admin_audit_log to service_role;

create function cupidmatch_admin.feature_operations(p_section text,p_page integer default 1,p_search text default '')returns jsonb language plpgsql stable security definer set search_path=''as $$
declare v_rows jsonb;v_total bigint;begin
 if p_section is null or p_section not in('deletion','identity','family','plans','calls','attachments','payments')or p_page is null or p_page not between 1 and 100000 or p_search is null or length(p_search)>100 then raise exception 'Invalid filters'using errcode='22023';end if;
 if not public.admin_has_permission(case when p_section='deletion'then'support'when p_section='payments'then'billing'else'moderation'end)then raise exception 'Forbidden'using errcode='42501';end if;
 -- Only operational metadata. No private plan contents, ID images, or conversation bodies.
 with items as(
 select a.member_id::text as id,a.member_id,p.display_name as name,'deletion_requested'as status,a.deletion_requested_at as created_at,jsonb_build_object('email',p.email)as detail from public.member_account_controls a join public.profiles p on p.id=a.member_id where p_section='deletion'and a.deletion_requested_at is not null
 union all select i.id::text,i.member_id,p.display_name,i.status,i.created_at,jsonb_build_object('testMode',not i.livemode,'providerSession',i.provider_session_id,'error',i.error_code)from public.identity_sessions i join public.profiles p on p.id=i.member_id where p_section='identity'
 union all select i.id::text,i.member_id,p.display_name,i.status,i.created_at,jsonb_build_object('relationship',i.relationship,'expiresAt',i.expires_at)from public.family_invitations i join public.profiles p on p.id=i.member_id where p_section='family'
 union all select s.member_id::text||':'||s.viewer_id::text,s.member_id,p.display_name,'shared',s.created_at,jsonb_build_object('viewerId',s.viewer_id)from public.future_map_shares s join public.profiles p on p.id=s.member_id where p_section='plans'
 union all select c.id::text,c.caller_id,p.display_name,c.status,c.created_at,jsonb_build_object('kind',c.kind,'calleeId',c.callee_id)from public.member_calls c join public.profiles p on p.id=c.caller_id where p_section='calls'
 union all select a.id::text,a.uploader_id,p.display_name,a.status,a.created_at,jsonb_build_object('name',a.file_name,'size',a.byte_size,'type',a.mime_type)from public.message_attachments a join public.profiles p on p.id=a.uploader_id where p_section='attachments'
 union all select o.id::text,o.member_id,p.display_name,o.status,o.created_at,jsonb_build_object('action',o.action,'reference',o.provider_reference)from public.provider_operations o join public.profiles p on p.id=o.member_id where p_section='payments'
 ), filtered as(select * from items where p_search=''or name ilike '%'||p_search||'%'or member_id::text=p_search),paged as(select * from filtered order by created_at desc,id limit 20 offset(p_page-1)*20)
 select(select count(*)from filtered),coalesce((select jsonb_agg(to_jsonb(paged))from paged),'[]')into v_total,v_rows;
 return jsonb_build_object('items',v_rows,'total',v_total,'page',p_page,'pageSize',20);
end $$;
revoke all on function cupidmatch_admin.feature_operations(text,integer,text)from public,anon;
grant execute on function cupidmatch_admin.feature_operations(text,integer,text)to authenticated;
create function public.feature_operations(p_section text,p_page integer default 1,p_search text default '')returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.feature_operations(p_section,p_page,p_search)$$;
revoke all on function public.feature_operations(text,integer,text)from public,anon;
grant execute on function public.feature_operations(text,integer,text)to authenticated;
create function cupidmatch_admin.moderate_feature(p_section text,p_id text,p_reason text)returns boolean language plpgsql security definer set search_path=''as $$
begin
 if not public.admin_has_permission('moderation')then raise exception 'Forbidden'using errcode='42501';end if;
 if p_reason is null or length(trim(p_reason))not between 10 and 500 then raise exception 'Audit reason required'using errcode='22023';end if;
 if p_section='family'then update public.family_invitations set status='revoked',updated_at=now()where id=p_id::uuid and status in('pending','accepted');
 elsif p_section='plans'then delete from public.future_map_shares where member_id=split_part(p_id,':',1)::uuid and viewer_id=split_part(p_id,':',2)::uuid;
 elsif p_section='calls'then update public.member_calls set status='ended',ended_at=now(),updated_at=now()where id=p_id::uuid and status in('ringing','accepted');
 elsif p_section='attachments'then update public.message_attachments set status='removed'where id=p_id::uuid and status<>'removed';
 else raise exception 'Invalid action'using errcode='22023';end if;
 if not found then raise exception 'Record already changed'using errcode='40001';end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(auth.uid(),'moderate_'||p_section,p_section,p_id,jsonb_build_object('reason',trim(p_reason)));return true;
end $$;
revoke all on function cupidmatch_admin.moderate_feature(text,text,text)from public,anon;
grant execute on function cupidmatch_admin.moderate_feature(text,text,text)to authenticated;
create function public.moderate_feature(p_section text,p_id text,p_reason text)returns boolean language sql security invoker set search_path=''as $$select cupidmatch_admin.moderate_feature(p_section,p_id,p_reason)$$;
revoke all on function public.moderate_feature(text,text,text)from public,anon;
grant execute on function public.moderate_feature(text,text,text)to authenticated;

-- Public shares must require possession of an unguessable token, not an enumerable SELECT policy.
drop policy if exists biodata_share_links_public_select on public.biodata_share_links;
revoke select on public.biodata_share_links from anon;
create function cupidmatch_admin.safe_biodata_snapshot(p_snapshot jsonb)returns jsonb language plpgsql immutable set search_path=''as $$
declare v_content jsonb:=coalesce(p_snapshot->'content','{}');v_vis jsonb:=coalesce(p_snapshot->'visibility','{}');v_section jsonb;v_field jsonb;v_sections jsonb:='[]';v_fields jsonb;v_key text;v_allow boolean;v_sensitive text;
begin
 for v_section in select value from jsonb_array_elements(case when jsonb_typeof(v_content->'sections')='array'then v_content->'sections'else'[]'end)loop
  if v_section->>'visible'is distinct from'true'then continue;end if;
  v_key:=lower(coalesce(v_section->>'id',''));
  if(v_key in('religious','religion','cultural','faith')and v_vis->>'includeReligious'is distinct from'true')or(v_key in('horoscope','astrology','kundli','rasi')and v_vis->>'includeHoroscope'is distinct from'true')or(v_key in('family-contacts','family_contacts','contacts')and v_vis->>'includeFamilyContacts'is distinct from'true')then continue;end if;
  v_fields:='[]';
  for v_field in select value from jsonb_array_elements(case when jsonb_typeof(v_section->'fields')='array'then v_section->'fields'else'[]'end)loop
   if v_field->>'visible'is distinct from'true'then continue;end if;
   v_key:=lower(coalesce(v_field->>'id',''));v_allow:=true;
   for v_sensitive in select unnest(array['includeDob','includePhone','includeEmail','includeExactAddress','includeFamilyContacts','includeReligious','includeHoroscope'])loop
    if v_vis->>v_sensitive='true'then continue;end if;
    if(v_sensitive='includeDob'and v_key~'(dob|birth)')or(v_sensitive='includePhone'and v_key~'(phone|mobile)')or(v_sensitive='includeEmail'and v_key~'email')or(v_sensitive='includeExactAddress'and v_key~'address')or(v_sensitive='includeFamilyContacts'and v_key~'(fatherphone|motherphone|contactnumberfather|contactnumbermother|familyphone|familycontact|family_contact|guardianphone)')or(v_sensitive='includeReligious'and v_key~'(religion|religious|denomination|faith|caste)')or(v_sensitive='includeHoroscope'and v_key~'(horoscope|rashi|nakshatra|sunsign|moonsign|ascendant|gotra)')then v_allow:=false;end if;
   end loop;
   if v_allow then v_fields:=v_fields||jsonb_build_array(v_field);end if;
  end loop;
  v_sections:=v_sections||jsonb_build_array(jsonb_set(v_section,'{fields}',v_fields));
 end loop;
 v_content:=jsonb_set(v_content,'{sections}',v_sections);
 if v_vis->>'includePhoto'is distinct from'true'then v_content:=v_content-'photoUrl'-'photoCrop';end if;
 return jsonb_set(p_snapshot,'{content}',v_content);
end $$;
revoke all on function cupidmatch_admin.safe_biodata_snapshot(jsonb)from public,anon,authenticated;

create function cupidmatch_admin.resolve_biodata_share(p_token text)returns setof public.biodata_share_links language sql stable security definer set search_path=''as $$
 select (jsonb_populate_record(l,jsonb_build_object('snapshot',cupidmatch_admin.safe_biodata_snapshot(l.snapshot)))).* from public.biodata_share_links l where length(p_token)between 32 and 128 and l.token=p_token and l.revoked_at is null and(l.expires_at is null or l.expires_at>now())and public.member_is_active(l.owner_id)limit 1
$$;
revoke all on function cupidmatch_admin.resolve_biodata_share(text)from public;
grant execute on function cupidmatch_admin.resolve_biodata_share(text)to anon,authenticated;
grant usage on schema cupidmatch_admin to anon;
create function public.resolve_biodata_share(p_token text)returns setof public.biodata_share_links language sql security invoker set search_path=''as $$select * from cupidmatch_admin.resolve_biodata_share(p_token)$$;
revoke all on function public.resolve_biodata_share(text)from public;
grant execute on function public.resolve_biodata_share(text)to anon,authenticated;

create function cupidmatch_admin.resolve_profile_share(p_token_hash text)
returns table(link_id uuid,profile_id uuid,expires_at timestamptz,display_name text,age_years integer,location text,profession text,bio text,photo_url text,is_verified boolean)
language sql stable security definer set search_path=''as $$
 select l.id,l.profile_id,l.expires_at,coalesce(nullif(trim(p.display_name),''),'Member'),public.age_from_dob(p.dob),p.location,p.profession,left(p.bio,600),case when coalesce(p.photo_privacy,'members')='members'then p.photo_url else null end,coalesce(p.is_verified,false)
 from public.profile_share_links l join public.profiles p on p.id=l.profile_id
 where p_token_hash~'^[a-f0-9]{64}$'and l.token_hash=p_token_hash and l.revoked_at is null and l.expires_at>now()and p.is_published and public.member_is_active(p.id)and public.member_is_active(l.owner_id)
 and not exists(select 1 from public.member_blocks b where(b.blocker_id=l.owner_id and b.blocked_id=l.profile_id)or(b.blocker_id=l.profile_id and b.blocked_id=l.owner_id))limit 1
$$;
revoke all on function cupidmatch_admin.resolve_profile_share(text)from public;
grant execute on function cupidmatch_admin.resolve_profile_share(text)to anon,authenticated;
create or replace function public.resolve_profile_share(p_token_hash text)
returns table(link_id uuid,profile_id uuid,expires_at timestamptz,display_name text,age_years integer,location text,profession text,bio text,photo_url text,is_verified boolean)
language sql stable security invoker set search_path=''as $$select * from cupidmatch_admin.resolve_profile_share(p_token_hash)$$;
revoke all on function public.resolve_profile_share(text)from public;
grant execute on function public.resolve_profile_share(text)to anon,authenticated;

-- Media URLs are checked per request; stored objects are no longer publicly retrievable.
create function cupidmatch_admin.media_path(p_value text)returns text language sql immutable set search_path=''as $$
 select case when p_value like 'users/%'or p_value like 'success_stories/%'then split_part(p_value,'?',1)
 when p_value like '%/object/public/media/%'then split_part(split_part(p_value,'/object/public/media/',2),'?',1)
 when p_value like '%/api/media?path=%'or p_value like '/api/media?path=%'then replace(replace(split_part(split_part(p_value,'path=',2),'&',1),'%2F','/'),'%2f','/')
 when p_value like '%/object/sign/media/%'then split_part(split_part(p_value,'/object/sign/media/',2),'?',1)
 else null end
$$;
revoke all on function cupidmatch_admin.media_path(text)from public;
create function cupidmatch_admin.media_allowed(p_path text)returns boolean language sql stable security definer set search_path=''as $$
 select p_path is not null and(
 (auth.uid()is not null and split_part(p_path,'/',1)='users'and split_part(p_path,'/',2)=auth.uid()::text)
 or(auth.uid()is not null and public.admin_has_permission('content'))
 or exists(select 1 from public.success_stories s where s.status='approved'and cupidmatch_admin.media_path(s.photo_url)=p_path)
 or(auth.uid()is not null and public.member_is_active(auth.uid())and exists(select 1 from public.profiles p where p.is_published and p.is_admin is not true and public.member_is_active(p.id)and cupidmatch_admin.planning_pair_allowed(auth.uid(),p.id)
 and(coalesce(p.photo_privacy,'members')='members'or(p.photo_privacy='connections'and exists(select 1 from public.connections c where(c.member_a_id=auth.uid()and c.member_b_id=p.id)or(c.member_b_id=auth.uid()and c.member_a_id=p.id))))
 and(cupidmatch_admin.media_path(p.photo_url)=p_path or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(p.additional_photo_urls)='array'then p.additional_photo_urls else'[]'end)e where cupidmatch_admin.media_path(case when jsonb_typeof(e)='string'then e#>>'{}'else coalesce(e->>'storagePath',e->>'url')end)=p_path))))
 )
$$;
revoke all on function cupidmatch_admin.media_allowed(text)from public;
grant execute on function cupidmatch_admin.media_allowed(text)to anon,authenticated;
update storage.buckets set public=false where id='media';
drop policy if exists media_public_read on storage.objects;
create function cupidmatch_admin.public_story_media(p_path text)returns boolean language sql stable security definer set search_path=''as $$select exists(select 1 from public.success_stories s where s.status='approved'and cupidmatch_admin.media_path(s.photo_url)=p_path)$$;
revoke all on function cupidmatch_admin.public_story_media(text)from public;
grant execute on function cupidmatch_admin.public_story_media(text)to anon,authenticated;
-- Viewers use the gateway, so they cannot mint long-lived Storage signed URLs for another member's photo.
create policy media_scoped_read on storage.objects for select to anon,authenticated using(bucket_id='media'and((auth.uid()is not null and split_part(name,'/',1)='users'and split_part(name,'/',2)=auth.uid()::text)or cupidmatch_admin.public_story_media(name)));
create function public.media_reference_allowed(p_path text)returns boolean language sql security invoker set search_path=''as $$select cupidmatch_admin.media_allowed(p_path)$$;
revoke all on function public.media_reference_allowed(text)from public;
grant execute on function public.media_reference_allowed(text)to anon,authenticated;


-- Optional email delivery is queued; no email is sent inside a database transaction.
create table public.email_outbox(
 id uuid primary key default gen_random_uuid(),member_id uuid not null references public.profiles(id)on delete cascade,
 category text not null check(category in('messages','interests','support')),source_id text not null,
 status text not null default 'pending'check(status in('pending','sending','sent','failed','skipped')),attempts integer not null default 0,
 provider_id text,locked_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(category,source_id,member_id)
);
create index email_outbox_pending on public.email_outbox(status,created_at);
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from public,anon,authenticated;
grant select,update on public.email_outbox to service_role;
create function cupidmatch_admin.queue_member_email()returns trigger language plpgsql security definer set search_path=''as $$
declare v_target uuid;v_category text;
begin
 if tg_table_name='messages'then
  select case when c.participant_1=new.sender_id then c.participant_2 else c.participant_1 end into v_target from public.chats c where c.id=new.chat_id;v_category:='messages';
 elsif tg_table_name='match_requests'then v_target:=new.receiver_id;v_category:='interests';
 else v_target:=new.member_id;v_category:='support';end if;
 if public.member_is_active(v_target)and exists(select 1 from public.member_account_controls where member_id=v_target and notification_preferences->>'email'='true'and notification_preferences->>v_category='true')then
 insert into public.email_outbox(member_id,category,source_id)values(v_target,v_category,new.id::text)on conflict do nothing;end if;return new;
end $$;
revoke all on function cupidmatch_admin.queue_member_email()from public,anon,authenticated;
create trigger queue_message_email after insert on public.messages for each row execute function cupidmatch_admin.queue_member_email();
create trigger queue_interest_email after insert on public.match_requests for each row execute function cupidmatch_admin.queue_member_email();
create trigger queue_notice_email after insert on public.member_notices for each row execute function cupidmatch_admin.queue_member_email();
create function public.claim_email_jobs()returns jsonb language plpgsql security invoker set search_path=''as $$
declare v_result jsonb;begin
 update public.email_outbox set status='skipped',updated_at=now()where status in('pending','sending')and created_at<now()-interval '23 hours';
 with picked as(select id from public.email_outbox where(status='pending'or(status='sending'and locked_at<now()-interval '5 minutes'))and attempts<5 order by created_at for update skip locked limit 5),claimed as(update public.email_outbox j set status='sending',locked_at=now(),attempts=attempts+1,updated_at=now()from picked where j.id=picked.id returning j.*)
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'category',c.category,'email',u.email,'eligible',u.email_confirmed_at is not null and public.member_is_active(c.member_id)and a.notification_preferences->>'email'='true'and a.notification_preferences->>c.category='true')),'[]')into v_result from claimed c join auth.users u on u.id=c.member_id left join public.member_account_controls a on a.member_id=c.member_id;return v_result;
end $$;
revoke all on function public.claim_email_jobs()from public,anon,authenticated;
grant execute on function public.claim_email_jobs()to service_role;
grant select on public.member_account_controls,public.profiles,auth.users to service_role;
grant execute on function public.member_is_active(uuid)to service_role;
