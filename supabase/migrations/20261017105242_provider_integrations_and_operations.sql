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
 select a.member_id::text as id,a.member_id,p.display_name as name,coalesce(j.status,'deletion_requested')as status,a.deletion_requested_at as created_at,jsonb_build_object('email',p.email,'jobId',j.id,'attempts',j.attempts,'startedAt',j.started_at,'recordsRemoved',j.records_removed)as detail from public.member_account_controls a join public.profiles p on p.id=a.member_id left join cupidmatch_admin.account_deletion_jobs j on j.member_id=a.member_id and j.requested_at=a.deletion_requested_at where p_section='deletion'and a.deletion_requested_at is not null
 union all select j.id::text,j.member_id,'Erasure job',j.status,j.requested_at,jsonb_build_object('jobId',j.id,'attempts',j.attempts,'startedAt',j.started_at,'completedAt',j.completed_at,'recordsRemoved',j.records_removed)from cupidmatch_admin.account_deletion_jobs j where p_section='deletion'and j.status<>'cancelled'and not exists(select 1 from public.member_account_controls a where a.member_id=j.member_id and a.deletion_requested_at=j.requested_at)
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
 status text not null default 'pending'check(status in('pending','sending','sent','failed','skipped','delivered','bounced','complained')),attempts integer not null default 0,
 provider_id text,provider_updated_at timestamptz,locked_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(category,source_id,member_id)
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
 update public.email_outbox set status='failed',updated_at=now()where attempts>=5 and(status='pending'or(status='sending'and locked_at<now()-interval '5 minutes'));
 with picked as(select id from public.email_outbox where(status='pending'or(status='sending'and locked_at<now()-interval '5 minutes'))and attempts<5 order by created_at for update skip locked limit 5),claimed as(update public.email_outbox j set status='sending',locked_at=now(),attempts=attempts+1,updated_at=now()from picked where j.id=picked.id returning j.*)
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'category',c.category,'email',u.email,'eligible',u.email_confirmed_at is not null and public.member_is_active(c.member_id)and a.notification_preferences->>'email'='true'and a.notification_preferences->>c.category='true'and cupidmatch_admin.email_source_allowed(c.member_id,c.category,c.source_id))),'[]')into v_result from claimed c join auth.users u on u.id=c.member_id left join public.member_account_controls a on a.member_id=c.member_id;return v_result;
end $$;
revoke all on function public.claim_email_jobs()from public,anon,authenticated;
grant execute on function public.claim_email_jobs()to service_role;
grant select on public.member_account_controls,public.profiles,auth.users to service_role;
grant execute on function public.member_is_active(uuid)to service_role;

-- Owner-only account export pages. This migration is still pending, not applied live.
create function cupidmatch_admin.account_export_page(p_dataset text,p_after uuid default null)
returns jsonb language plpgsql security definer set search_path=''as $$
declare v_me uuid:=auth.uid();v_query text;v_rows jsonb;v_next uuid;
begin
 if v_me is null then raise exception 'Sign in required'using errcode='42501';end if;
 v_query:=case p_dataset
 when 'profile' then 'select id,to_jsonb(p)-''is_admin''-''suspension_reason'' as record from public.profiles p where id=$1'
 when 'settings' then 'select member_id as id,to_jsonb(a) as record from public.member_account_controls a where member_id=$1'
 when 'future_map' then 'select member_id as id,to_jsonb(f) as record from public.future_maps f where member_id=$1'
 when 'plan_shares' then 'select viewer_id as id,to_jsonb(s) as record from public.future_map_shares s where member_id=$1'
 when 'family_invitations' then 'select id,to_jsonb(i) as record from public.family_invitations i where member_id=$1 or helper_id=$1'
 when 'family_activity' then 'select id,to_jsonb(a) as record from public.family_activity a where author_id=$1'
 when 'support_tickets' then 'select id,to_jsonb(t)-''assigned_to'' as record from public.support_tickets t where member_id=$1'
 when 'support_messages' then 'select m.id,to_jsonb(m) as record from public.support_messages m join public.support_tickets t on t.id=m.ticket_id where t.member_id=$1'
 when 'sent_messages' then 'select id,to_jsonb(m)-''is_read'' as record from public.messages m where sender_id=$1'
 when 'sent_interests' then 'select id,to_jsonb(m) as record from public.match_requests m where sender_id=$1'
 when 'notices' then 'select id,to_jsonb(n)-''created_by'' as record from public.member_notices n where member_id=$1'
 when 'subscriptions' then 'select id,to_jsonb(s) as record from public.user_subscriptions s where user_id=$1'
 when 'trials' then 'select user_id as id,to_jsonb(t)-''granted_by'' as record from public.member_trials t where user_id=$1'
 when 'calls' then 'select id,to_jsonb(c)-''offer''-''answer'' as record from public.member_calls c where $1 in(caller_id,callee_id)'
 when 'attachments' then 'select id,to_jsonb(a) as record from public.message_attachments a where uploader_id=$1'
 when 'files' then 'select o.id,jsonb_build_object(''id'',o.id,''bucket'',o.bucket_id,''path'',o.name,''size'',o.metadata->''size'') as record from storage.objects o where (o.bucket_id=''media'' and o.name like ''users/''||$1::text||''/%'')or(o.bucket_id=''message-attachments''and exists(select 1 from public.message_attachments a where a.uploader_id=$1 and a.object_path=o.name and a.status=''ready''))'
 when 'biodata_documents' then case when to_regclass('public.biodata_documents')is not null then 'select id,to_jsonb(b) as record from public.biodata_documents b where owner_id=$1'else 'select null::uuid as id,null::jsonb as record where false'end
 when 'biodata_shares' then 'select id,to_jsonb(b) as record from public.biodata_share_links b where owner_id=$1'
 when 'profile_shares' then 'select id,to_jsonb(p)-''token_hash'' as record from public.profile_share_links p where owner_id=$1'
 when 'shortlist' then case when to_regclass('public.shortlist')is not null then 'select id,to_jsonb(s) as record from public.shortlist s where user_id=$1'else 'select null::uuid as id,null::jsonb as record where false'end
 else null end;
 if v_query is null then raise exception 'Unknown dataset'using errcode='22023';end if;
 execute 'select coalesce(jsonb_agg(record order by id),''[]''::jsonb),(array_agg(id order by id desc))[1] from(select * from('||v_query||')owned where($2 is null or id>$2)order by id limit 100)page'into v_rows,v_next using v_me,p_after;
 return jsonb_build_object('rows',v_rows,'next',case when jsonb_array_length(v_rows)=100 then v_next else null end);
end $$;
revoke all on function cupidmatch_admin.account_export_page(text,uuid)from public,anon;
grant execute on function cupidmatch_admin.account_export_page(text,uuid)to authenticated;
create function public.account_export_page(p_dataset text,p_after uuid default null)returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.account_export_page(p_dataset,p_after)$$;
revoke all on function public.account_export_page(text,uuid)from public,anon;
grant execute on function public.account_export_page(text,uuid)to authenticated;
create function cupidmatch_admin.reserve_account_export()returns boolean language plpgsql security definer set search_path=''as $$
begin
 if auth.uid()is null then raise exception 'Sign in required'using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,821));
 if(select count(*)from public.integration_attempts where member_id=auth.uid()and kind='account_export'and attempted_at>now()-interval '1 hour')>=3 then raise exception 'Try again in an hour'using errcode='22023';end if;
 insert into public.integration_attempts(member_id,kind)values(auth.uid(),'account_export');return true;
end $$;
revoke all on function cupidmatch_admin.reserve_account_export()from public,anon;
grant execute on function cupidmatch_admin.reserve_account_export()to authenticated;
create function public.reserve_account_export()returns boolean language sql security invoker set search_path=''as $$select cupidmatch_admin.reserve_account_export()$$;
revoke all on function public.reserve_account_export()from public,anon;
grant execute on function public.reserve_account_export()to authenticated;

-- Stable customer binding and short server-only checkout leases prevent duplicate subscriptions.
create table cupidmatch_admin.billing_customers(member_id uuid primary key references public.profiles(id) on delete cascade,customer_id text not null unique);
create table cupidmatch_admin.billing_checkout_locks(member_id uuid primary key references public.profiles(id) on delete cascade,request_id uuid not null,locked_until timestamptz not null);
alter table cupidmatch_admin.billing_customers enable row level security;
alter table cupidmatch_admin.billing_checkout_locks enable row level security;
revoke all on cupidmatch_admin.billing_customers,cupidmatch_admin.billing_checkout_locks from public,anon,authenticated;
create function cupidmatch_admin.billing_customer(p_member uuid,p_customer text default null)returns text language plpgsql security definer set search_path=''as $$
declare v_customer text;begin
 if not public.member_is_active(p_member)then raise exception 'Active member required'using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_member::text,827));
 select customer_id into v_customer from cupidmatch_admin.billing_customers where member_id=p_member;
 if v_customer is null then select provider_customer_id into v_customer from public.user_subscriptions where user_id=p_member and provider='stripe'and provider_customer_id is not null order by created_at desc limit 1;end if;
 v_customer:=coalesce(v_customer,p_customer);
 if v_customer is not null then
  if v_customer !~ '^cus_[a-zA-Z0-9]+$'then raise exception 'Invalid customer'using errcode='22023';end if;
  insert into cupidmatch_admin.billing_customers values(p_member,v_customer)on conflict(member_id)do nothing;
 end if;return v_customer;
end $$;
create function public.billing_customer(p_member uuid,p_customer text default null)returns text language sql security invoker set search_path=''as $$select cupidmatch_admin.billing_customer(p_member,p_customer)$$;
revoke all on function cupidmatch_admin.billing_customer(uuid,text),public.billing_customer(uuid,text)from public,anon,authenticated;
grant execute on function cupidmatch_admin.billing_customer(uuid,text),public.billing_customer(uuid,text)to service_role;
create function cupidmatch_admin.billing_checkout_lock(p_member uuid,p_request uuid,p_release boolean default false)returns boolean language plpgsql security definer set search_path=''as $$
begin
 if p_member is null or p_request is null then raise exception 'Missing checkout reference'using errcode='22023';end if;
 if p_release then delete from cupidmatch_admin.billing_checkout_locks where member_id=p_member and request_id=p_request;return true;end if;
 if not public.member_is_active(p_member)then raise exception 'Active member required'using errcode='42501';end if;
 insert into cupidmatch_admin.billing_checkout_locks values(p_member,p_request,now()+interval '2 minutes')on conflict(member_id)do update set request_id=excluded.request_id,locked_until=excluded.locked_until where billing_checkout_locks.locked_until<now();
 return found;
end $$;
create function public.billing_checkout_lock(p_member uuid,p_request uuid,p_release boolean default false)returns boolean language sql security invoker set search_path=''as $$select cupidmatch_admin.billing_checkout_lock(p_member,p_request,p_release)$$;
revoke all on function cupidmatch_admin.billing_checkout_lock(uuid,uuid,boolean),public.billing_checkout_lock(uuid,uuid,boolean)from public,anon,authenticated;
grant execute on function cupidmatch_admin.billing_checkout_lock(uuid,uuid,boolean),public.billing_checkout_lock(uuid,uuid,boolean)to service_role;
create function cupidmatch_admin.audit_billing_read(p_member uuid)returns boolean language plpgsql security definer set search_path=''as $$
begin
 if not public.admin_has_permission('billing')then raise exception 'Forbidden'using errcode='42501';end if;
 if not exists(select 1 from public.profiles where id=p_member)then raise exception 'Member not found'using errcode='22023';end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(auth.uid(),'provider_billing_viewed','member',p_member::text,'{}');return true;
end $$;
create function public.audit_billing_read(p_member uuid)returns boolean language sql security invoker set search_path=''as $$select cupidmatch_admin.audit_billing_read(p_member)$$;
revoke all on function cupidmatch_admin.audit_billing_read(uuid),public.audit_billing_read(uuid)from public,anon;
grant execute on function cupidmatch_admin.audit_billing_read(uuid),public.audit_billing_read(uuid)to authenticated;

-- Delivery receipts contain provider references and state, never message bodies or addresses.
create function cupidmatch_admin.record_email_delivery(p_event text,p_provider text,p_status text,p_created timestamptz)returns boolean language plpgsql security definer set search_path=''as $$
declare v_job public.email_outbox%rowtype;begin
 if p_event is null or length(p_event)>220 or p_provider is null or p_created is null or p_status not in('delivered','bounced','complained','failed')then raise exception 'Invalid delivery event'using errcode='22023';end if;
 select * into v_job from public.email_outbox where provider_id=p_provider for update;
 if not found then raise exception 'Provider acceptance not yet recorded; retry'using errcode='40001';end if;
 insert into cupidmatch_admin.provider_event_receipts values('resend:'||p_event,'resend',p_status,now())on conflict do nothing;
 if not found then return false;end if;
 if v_job.provider_updated_at>p_created or(v_job.status in('bounced','complained')and p_status='delivered')then return false;end if;
 update public.email_outbox set status=p_status,provider_updated_at=p_created,updated_at=now()where id=v_job.id;
 if p_status in('bounced','complained')then update public.member_account_controls set notification_preferences=jsonb_set(notification_preferences,'{email}','false'),updated_at=now()where member_id=v_job.member_id;end if;
 return true;
end $$;
create function public.record_email_delivery(p_event text,p_provider text,p_status text,p_created timestamptz)returns boolean language sql security invoker set search_path=''as $$select cupidmatch_admin.record_email_delivery(p_event,p_provider,p_status,p_created)$$;
revoke all on function cupidmatch_admin.record_email_delivery(text,text,text,timestamptz),public.record_email_delivery(text,text,text,timestamptz)from public,anon,authenticated;
grant execute on function cupidmatch_admin.record_email_delivery(text,text,text,timestamptz),public.record_email_delivery(text,text,text,timestamptz)to service_role;
create function cupidmatch_admin.email_delivery_admin(p_page integer default 1)returns jsonb language plpgsql security definer set search_path=''as $$
declare v_rows jsonb;v_counts jsonb;v_total bigint;begin
 if not public.admin_has_permission('notifications')then raise exception 'Forbidden'using errcode='42501';end if;
 if p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid page'using errcode='22023';end if;
 select count(*)into v_total from public.email_outbox;
 select coalesce(jsonb_object_agg(status,n),'{}')into v_counts from(select status,count(*)n from public.email_outbox group by status)c;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]')into v_rows from(select id,member_id,category,status,attempts,created_at,updated_at from public.email_outbox order by created_at desc,id limit 20 offset(p_page-1)*20)t;
 return jsonb_build_object('items',v_rows,'counts',v_counts,'total',v_total);
end $$;
create function public.email_delivery_admin(p_page integer default 1)returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.email_delivery_admin(p_page)$$;
revoke all on function cupidmatch_admin.email_delivery_admin(integer),public.email_delivery_admin(integer)from public,anon;
grant execute on function cupidmatch_admin.email_delivery_admin(integer),public.email_delivery_admin(integer)to authenticated;

-- Recheck current blocking, connection and interest state at send time.
create function cupidmatch_admin.email_source_allowed(p_member uuid,p_category text,p_source text)returns boolean language plpgsql security definer set search_path=''as $$
declare v_sender uuid;v_one uuid;v_two uuid;begin
 if p_category='support'then return exists(select 1 from public.member_notices where id::text=p_source and member_id=p_member);end if;
 if p_category='messages'then
  select m.sender_id,c.participant_1,c.participant_2 into v_sender,v_one,v_two from public.messages m join public.chats c on c.id=m.chat_id where m.id::text=p_source;
  return coalesce(p_member in(v_one,v_two)and v_sender<>p_member and cupidmatch_admin.planning_pair_allowed(v_one,v_two)and exists(select 1 from public.connections where(member_a_id=v_one and member_b_id=v_two)or(member_a_id=v_two and member_b_id=v_one)),false);
 end if;
 select m.sender_id into v_sender from public.match_requests m where m.id::text=p_source and m.receiver_id=p_member and m.status='pending'and to_jsonb(m)->>'withdrawn_at' is null;
 return v_sender is not null and cupidmatch_admin.planning_pair_allowed(v_sender,p_member);
end $$;
revoke all on function cupidmatch_admin.email_source_allowed(uuid,text,text)from public,anon,authenticated;
grant execute on function cupidmatch_admin.email_source_allowed(uuid,text,text)to service_role;

-- Erasure stays disabled until the operator approves retention and configures the worker.
-- No member/staff client can execute erasure stages directly.
create table cupidmatch_admin.account_deletion_jobs(
 id uuid primary key default gen_random_uuid(),member_id uuid not null,requested_at timestamptz not null,
 approved_by uuid references auth.users(id)on delete set null,reason text not null check(length(trim(reason))between 20 and 500),
 status text not null default 'approved'check(status in('approved','processing','failed','cancelled','complete')),
 lease uuid,locked_until timestamptz,started_at timestamptz,completed_at timestamptz,records_removed boolean not null default false,
 attempts integer not null default 0,created_at timestamptz not null default now(),unique(member_id,requested_at)
);
alter table cupidmatch_admin.account_deletion_jobs enable row level security;
revoke all on cupidmatch_admin.account_deletion_jobs from public,anon,authenticated;
create index account_deletion_jobs_pending on cupidmatch_admin.account_deletion_jobs(status,created_at);
create function cupidmatch_admin.guard_deletion_cancellation()returns trigger language plpgsql security definer set search_path=''as $$
begin
 if old.deletion_requested_at is not null and new.deletion_requested_at is distinct from old.deletion_requested_at then
  if exists(select 1 from cupidmatch_admin.account_deletion_jobs where member_id=old.member_id and requested_at=old.deletion_requested_at and started_at is not null and status in('processing','failed'))then raise exception 'Erasure processing has started; contact support'using errcode='42501';end if;
  update cupidmatch_admin.account_deletion_jobs set status='cancelled'where member_id=old.member_id and requested_at=old.deletion_requested_at and status='approved';
 end if;return new;
end $$;
revoke all on function cupidmatch_admin.guard_deletion_cancellation()from public,anon,authenticated;
create trigger guard_deletion_cancellation before update on public.member_account_controls for each row execute function cupidmatch_admin.guard_deletion_cancellation();
create function cupidmatch_admin.deletion_hold(p_member uuid)returns boolean language sql security definer set search_path=''as $$
 select exists(select 1 from public.profiles where id=p_member and is_admin)
 or exists(select 1 from public.admin_staff where user_id=p_member)
 or exists(select 1 from public.member_reports where(reporter_id=p_member or reported_member_id=p_member)and status in('open','under_review'))
 or exists(select 1 from public.member_admin_notes where author_id=p_member)
 or exists(select 1 from public.provider_operations where actor_id=p_member)
$$;
revoke all on function cupidmatch_admin.deletion_hold(uuid)from public,anon,authenticated;
create function cupidmatch_admin.approve_account_deletion(p_member uuid,p_requested_at timestamptz,p_reason text)returns jsonb language plpgsql security definer set search_path=''as $$
declare v_id uuid;begin
 if not public.is_admin()or not public.member_is_active(auth.uid())or p_member=auth.uid()then raise exception 'Active Super Admin required'using errcode='42501';end if;
 if p_reason is null or length(trim(p_reason))not between 20 and 500 then raise exception 'Review reason required'using errcode='22023';end if;
 perform 1 from public.member_account_controls where member_id=p_member and deletion_requested_at=p_requested_at for update;
 if not found then raise exception 'Deletion request changed; refresh'using errcode='40001';end if;
 if cupidmatch_admin.deletion_hold(p_member)then raise exception 'Staff account or unresolved safety hold requires manual review'using errcode='42501';end if;
 insert into cupidmatch_admin.account_deletion_jobs(member_id,requested_at,approved_by,reason)values(p_member,p_requested_at,auth.uid(),trim(p_reason))on conflict(member_id,requested_at)do nothing returning id into v_id;
 if v_id is null then select id into v_id from cupidmatch_admin.account_deletion_jobs where member_id=p_member and requested_at=p_requested_at;end if;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(auth.uid(),'account_erasure_approved','member',p_member::text,jsonb_build_object('job',v_id,'reason',trim(p_reason)));
 return jsonb_build_object('approved',true,'jobId',v_id);
end $$;
create function public.approve_account_deletion(p_member uuid,p_requested_at timestamptz,p_reason text)returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.approve_account_deletion(p_member,p_requested_at,p_reason)$$;
revoke all on function cupidmatch_admin.approve_account_deletion(uuid,timestamptz,text),public.approve_account_deletion(uuid,timestamptz,text)from public,anon;
grant execute on function cupidmatch_admin.approve_account_deletion(uuid,timestamptz,text),public.approve_account_deletion(uuid,timestamptz,text)to authenticated;
create function cupidmatch_admin.claim_account_deletion()returns jsonb language plpgsql security definer set search_path=''as $$
declare v_job cupidmatch_admin.account_deletion_jobs%rowtype;begin
 select * into v_job from cupidmatch_admin.account_deletion_jobs where status in('approved','processing','failed')and attempts<10 and(locked_until is null or locked_until<now())order by created_at for update skip locked limit 1;
 if not found then return null;end if;
 perform 1 from public.member_account_controls where member_id=v_job.member_id and deletion_requested_at=v_job.requested_at for update;
 if not found and not v_job.records_removed then update cupidmatch_admin.account_deletion_jobs set status='cancelled'where id=v_job.id;return null;end if;
 if cupidmatch_admin.deletion_hold(v_job.member_id)then raise exception 'Erasure held for review'using errcode='42501';end if;
 update cupidmatch_admin.account_deletion_jobs set status='processing',lease=gen_random_uuid(),locked_until=now()+interval '10 minutes',started_at=coalesce(started_at,now()),attempts=attempts+1 where id=v_job.id returning * into v_job;
 return jsonb_build_object('id',v_job.id,'member_id',v_job.member_id,'lease',v_job.lease);
end $$;
create function public.claim_account_deletion()returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.claim_account_deletion()$$;
revoke all on function cupidmatch_admin.claim_account_deletion(),public.claim_account_deletion()from public,anon,authenticated;
grant execute on function cupidmatch_admin.claim_account_deletion(),public.claim_account_deletion()to service_role;
create function cupidmatch_admin.account_deletion_step(p_id uuid,p_lease uuid,p_stage text)returns jsonb language plpgsql security definer set search_path=''as $$
declare v_job cupidmatch_admin.account_deletion_jobs%rowtype;v_files jsonb;v_pair text[];begin
 select * into v_job from cupidmatch_admin.account_deletion_jobs where id=p_id and lease=p_lease and status='processing'and locked_until>now()for update;
 if not found then raise exception 'Invalid or expired erasure lease'using errcode='42501';end if;
 if p_stage='failed'then update cupidmatch_admin.account_deletion_jobs set status='failed',locked_until=now()+interval '15 minutes'where id=p_id;return jsonb_build_object('retry',true);end if;
 if p_stage='complete'then
  if not v_job.records_removed then raise exception 'Application cleanup not recorded'using errcode='22023';end if;
  if exists(select 1 from auth.users where id=v_job.member_id)or exists(select 1 from public.profiles where id=v_job.member_id)then raise exception 'Account still exists'using errcode='22023';end if;
  update cupidmatch_admin.account_deletion_jobs set status='complete',completed_at=now(),lease=null,locked_until=null where id=p_id;
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(v_job.approved_by,'account_erasure_complete','deletion_job',p_id::text,'{"applicationDataRemoved":true}');return jsonb_build_object('complete',true);
 end if;
 if cupidmatch_admin.deletion_hold(v_job.member_id)then raise exception 'Erasure held for review'using errcode='42501';end if;
 if p_stage='inventory'then return jsonb_build_object(
  'customers',(select coalesce(jsonb_agg(customer),'[]')from(select provider_customer_id as customer from public.user_subscriptions where user_id=v_job.member_id and provider='stripe'and provider_customer_id is not null union select customer_id from cupidmatch_admin.billing_customers where member_id=v_job.member_id)t),
  'identities',(select coalesce(jsonb_agg(provider_session_id),'[]')from public.identity_sessions where member_id=v_job.member_id));end if;
 select coalesce(jsonb_agg(jsonb_build_object('bucket',bucket_id,'path',name)),'[]')into v_files from(select o.bucket_id,o.name from storage.objects o where coalesce(to_jsonb(o)->>'owner_id',to_jsonb(o)->>'owner')=v_job.member_id::text or(o.bucket_id='media'and starts_with(o.name,'users/'||v_job.member_id::text||'/'))or(o.bucket_id='message-attachments'and exists(select 1 from public.message_attachments a left join public.chats c on c.id=a.chat_id where a.object_path=o.name and(a.uploader_id=v_job.member_id or v_job.member_id in(c.participant_1,c.participant_2))))order by o.id limit 100)t;
 if p_stage='files'then return v_files;end if;
 if p_stage<>'records'then raise exception 'Unknown erasure stage'using errcode='22023';end if;
 if jsonb_array_length(v_files)>0 then raise exception 'Storage cleanup incomplete'using errcode='22023';end if;
 -- Remove conversations on both sides; other unrelated members and their files are untouched.
 delete from public.call_signals where sender_id=v_job.member_id;
 delete from public.member_calls where v_job.member_id in(caller_id,callee_id);
 delete from public.messages where sender_id=v_job.member_id or chat_id in(select id from public.chats where v_job.member_id in(participant_1,participant_2));
 delete from public.message_attachments where uploader_id=v_job.member_id or chat_id in(select id from public.chats where v_job.member_id in(participant_1,participant_2));
 delete from public.chats where v_job.member_id in(participant_1,participant_2);
 delete from public.family_activity where author_id=v_job.member_id;
 delete from public.support_messages where author_id=v_job.member_id;
 delete from public.match_requests where sender_id=v_job.member_id or receiver_id=v_job.member_id;
 -- Restrict dynamic identifiers to this fixed, schema-reviewed allowlist.
 foreach v_pair slice 1 in array array[['promo_redemptions','user_id'],['success_stories','submitted_by_uid'],['connections','member_a_id'],['connections','member_b_id'],['shortlist','user_id'],['shortlist','shortlisted_id'],['biodata_share_links','owner_id'],['biodata_documents','owner_id'],['biodata_template_favourites','owner_id'],['profile_share_links','owner_id'],['member_trials','user_id'],['subscription_usage','user_id'],['user_subscriptions','user_id']]loop
  if to_regclass('public.'||v_pair[1])is not null then execute format('delete from public.%I where %I=$1',v_pair[1],v_pair[2])using v_job.member_id;end if;
 end loop;
 update public.provider_operations set member_id=null where member_id=v_job.member_id;
 delete from public.profiles where id=v_job.member_id;
 update cupidmatch_admin.account_deletion_jobs set records_removed=true where id=p_id;
 return jsonb_build_object('recordsRemoved',true);
end $$;
create function public.account_deletion_step(p_id uuid,p_lease uuid,p_stage text)returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.account_deletion_step(p_id,p_lease,p_stage)$$;
revoke all on function cupidmatch_admin.account_deletion_step(uuid,uuid,text),public.account_deletion_step(uuid,uuid,text)from public,anon,authenticated;
grant execute on function cupidmatch_admin.account_deletion_step(uuid,uuid,text),public.account_deletion_step(uuid,uuid,text)to service_role;
