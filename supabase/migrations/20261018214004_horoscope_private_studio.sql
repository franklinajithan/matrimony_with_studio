-- Private-first horoscope studio. No legacy/public horoscope data is imported.
create table public.horoscope_settings (
 singleton boolean primary key default true check(singleton),
 horoscope_enabled boolean not null default false,
 horoscope_upload_enabled boolean not null default false,
 ai_horoscope_matching_enabled boolean not null default false,
 matching_rule_sets text[] not null default '{}',
 retention_days integer not null default 30 check(retention_days between 1 and 90),
 daily_ai_limit integer not null default 5 check(daily_ai_limit between 1 and 20)
);
insert into public.horoscope_settings(singleton) values(true);
alter table public.horoscope_settings enable row level security;
create policy horoscope_settings_read on public.horoscope_settings for select to authenticated using(true);
grant select on public.horoscope_settings to authenticated;
revoke insert,update,delete on public.horoscope_settings from anon,authenticated;

-- The repository block API references a table that did not exist in production.
create table public.blocks (
 id uuid primary key default gen_random_uuid(), blocker_id uuid not null references auth.users on delete cascade,
 blocked_id uuid not null references auth.users on delete cascade, reason text check(length(reason)<=1000),
 created_at timestamptz not null default now(), unique(blocker_id,blocked_id), check(blocker_id<>blocked_id)
);
alter table public.blocks enable row level security;
create policy blocks_read on public.blocks for select to authenticated using(auth.uid() in (blocker_id,blocked_id));
create policy blocks_insert on public.blocks for insert to authenticated with check(auth.uid()=blocker_id);
create policy blocks_update on public.blocks for update to authenticated using(auth.uid()=blocker_id) with check(auth.uid()=blocker_id);
create policy blocks_delete on public.blocks for delete to authenticated using(auth.uid()=blocker_id);
grant select,insert,update,delete on public.blocks to authenticated;

create table public.horoscope_profiles (
 user_id uuid primary key references auth.users on delete cascade,
 tradition text not null check(tradition in ('tamil','vedic','western','other')),
 visibility text not null default 'private' check(visibility in ('private','connections','members')),
 fields jsonb not null default '{}' check(jsonb_typeof(fields)='object' and octet_length(fields::text)<=40000),
 shared_fields text[] not null default '{}',
 provenance jsonb not null default '{}' check(jsonb_typeof(provenance)='object' and octet_length(provenance::text)<=60000),
 comparison_consent boolean not null default false, ai_consent boolean not null default false,
 revision integer not null default 1, verified_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table public.horoscope_documents (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade,
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'), unique(owner_id,sha256),
 storage_path text not null unique, mime_type text not null check(mime_type in ('image/jpeg','image/png','application/pdf')),
 processing_state text not null default 'uploaded' check(processing_state in ('uploaded','processing','needs_review','error','deleted')),
 expires_at timestamptz not null, created_at timestamptz not null default now(),
 check(storage_path like owner_id::text || '/%')
);
create table public.horoscope_extractions (
 id uuid primary key default gen_random_uuid(), document_id uuid not null references public.horoscope_documents on delete cascade,
 owner_id uuid not null references auth.users on delete cascade,
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=60000),
 version text not null, confirmed_at timestamptz, created_at timestamptz not null default now()
);
create table public.horoscope_match_reports (
 id uuid primary key default gen_random_uuid(), requester_id uuid not null references auth.users on delete cascade,
 other_id uuid not null references auth.users on delete cascade,
 requester_revision integer not null, other_revision integer not null,
 report jsonb not null check(octet_length(report::text)<=60000),
 expires_at timestamptz not null default now()+interval '1 day', created_at timestamptz not null default now()
);
create table public.horoscope_audit_events (
 id bigint generated always as identity primary key, actor_id uuid references auth.users on delete cascade,
 action text not null check(action in ('save','view','compare','upload','extract','confirm','delete','ai_explanation')),
 created_at timestamptz not null default now()
);
create index horoscope_audit_rate on public.horoscope_audit_events(actor_id,action,created_at);
create index horoscope_documents_expiry on public.horoscope_documents(expires_at);
create table public.horoscope_consents (
 id bigint generated always as identity primary key, user_id uuid not null references auth.users on delete cascade,
 purpose text not null check(purpose in ('sharing','comparison','ai_explanation','document_extraction')),
 granted boolean not null, notice_version text not null default 'horoscope-v1', created_at timestamptz not null default now()
);
alter table public.horoscope_consents enable row level security;
create policy horoscope_consent_owner_read on public.horoscope_consents for select to authenticated using(user_id=auth.uid());
revoke all on public.horoscope_consents from anon,authenticated;
grant select on public.horoscope_consents to authenticated;
create table public.horoscope_restrictions(user_id uuid primary key references auth.users on delete cascade, restricted boolean not null default true);

create function public.horoscope_member_allowed(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=p_id and suspended_at is null)
 and not exists(select 1 from public.horoscope_restrictions where user_id=p_id and restricted)
 and exists(select 1 from public.horoscope_settings where horoscope_enabled)
$$;
create function public.horoscope_can_view(p_owner uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and public.horoscope_member_allowed(auth.uid()) and public.horoscope_member_allowed(p_owner)
 and (auth.uid()=p_owner or (
 not exists(select 1 from public.blocks where (blocker_id=auth.uid() and blocked_id=p_owner) or (blocked_id=auth.uid() and blocker_id=p_owner))
 and exists(select 1 from public.profiles where id=auth.uid() and is_published=true)
 and exists(select 1 from public.profiles where id=p_owner and is_published=true)
 and exists(select 1 from public.horoscope_profiles h where h.user_id=p_owner and (h.visibility='members' or (h.visibility='connections' and exists(
 select 1 from public.connections c where (c.member_a_id=auth.uid() and c.member_b_id=p_owner) or (c.member_b_id=auth.uid() and c.member_a_id=p_owner)))))))
$$;
create function public.horoscope_can_compare(p_other uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_other<>auth.uid() and public.horoscope_can_view(p_other)
 and exists(select 1 from public.horoscope_profiles where user_id=auth.uid() and comparison_consent and visibility<>'private')
 and exists(select 1 from public.horoscope_profiles where user_id=p_other and comparison_consent)
 -- Reciprocal eligibility: the other member must also be allowed to see the requester.
 and exists(select 1 from public.horoscope_profiles h where h.user_id=auth.uid() and (h.visibility='members' or (h.visibility='connections' and exists(
 select 1 from public.connections c where (c.member_a_id=auth.uid() and c.member_b_id=p_other) or (c.member_b_id=auth.uid() and c.member_a_id=p_other)))))
$$;

alter table public.horoscope_profiles enable row level security;
alter table public.horoscope_documents enable row level security;
alter table public.horoscope_extractions enable row level security;
alter table public.horoscope_match_reports enable row level security;
alter table public.horoscope_audit_events enable row level security;
alter table public.horoscope_restrictions enable row level security;
create policy horoscope_owner_read on public.horoscope_profiles for select to authenticated using(user_id=auth.uid());
create policy horoscope_document_read on public.horoscope_documents for select to authenticated using(owner_id=auth.uid());
create policy horoscope_extraction_read on public.horoscope_extractions for select to authenticated using(owner_id=auth.uid());
create function public.horoscope_view(p_owner uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare h public.horoscope_profiles; result jsonb;
begin
 if not public.horoscope_can_view(p_owner) then raise exception 'Horoscope unavailable' using errcode='42501'; end if;
 select * into h from public.horoscope_profiles where user_id=p_owner;
 if not found then return null; end if;
 if p_owner=auth.uid() then return to_jsonb(h); end if;
 select coalesce(jsonb_object_agg(key,value),'{}') into result from jsonb_each(h.fields) where key=any(h.shared_fields);
 insert into public.horoscope_audit_events(actor_id,action) values(auth.uid(),'view');
 return jsonb_build_object('user_id',h.user_id,'tradition',h.tradition,'fields',result,'revision',h.revision,'comparison_consent',h.comparison_consent,'ai_consent',h.ai_consent,'updated_at',h.updated_at);
end $$;
create function public.horoscope_report_current(p_other uuid,p_own_revision integer,p_other_revision integer) returns boolean language sql stable security definer set search_path='' as $$
 select public.horoscope_can_compare(p_other)
 and exists(select 1 from public.horoscope_profiles where user_id=auth.uid() and revision=p_own_revision)
 and exists(select 1 from public.horoscope_profiles where user_id=p_other and revision=p_other_revision)
$$;
create policy horoscope_report_read on public.horoscope_match_reports for select to authenticated using(requester_id=auth.uid() and expires_at>now() and public.horoscope_report_current(other_id,requester_revision,other_revision));

create function public.horoscope_save(p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare h public.horoscope_profiles; v_revision integer; v_fields jsonb; v_provenance jsonb; v_extraction public.horoscope_extractions; v_key text;
begin
 if not public.horoscope_member_allowed(auth.uid()) then raise exception 'Horoscope unavailable' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into h from public.horoscope_profiles where user_id=auth.uid() for update;
 if coalesce(h.revision,0)<>(p_payload->>'revision')::integer then raise exception 'Record changed; reload before saving' using errcode='40001'; end if;
 if jsonb_typeof(p_payload->'revision') is distinct from 'number' or (p_payload->>'revision')::integer<0 or jsonb_typeof(p_payload->'comparison_consent') is distinct from 'boolean' or jsonb_typeof(p_payload->'ai_consent') is distinct from 'boolean' or jsonb_typeof(p_payload->'shared_fields') is distinct from 'array' then raise exception 'Invalid payload'; end if;
 if h.comparison_consent is distinct from (p_payload->>'comparison_consent')::boolean then
 insert into public.horoscope_consents(user_id,purpose,granted) values(auth.uid(),'comparison',(p_payload->>'comparison_consent')::boolean); end if;
 if h.ai_consent is distinct from (p_payload->>'ai_consent')::boolean then
 insert into public.horoscope_consents(user_id,purpose,granted) values(auth.uid(),'ai_explanation',(p_payload->>'ai_consent')::boolean); end if;
 if h.visibility is distinct from p_payload->>'visibility' or h.shared_fields is distinct from array(select jsonb_array_elements_text(p_payload->'shared_fields')) then
 insert into public.horoscope_consents(user_id,purpose,granted) values(auth.uid(),'sharing',p_payload->>'visibility'<>'private'); end if;
 v_fields:=p_payload->'fields';
 if jsonb_typeof(v_fields) is distinct from 'object' or coalesce(v_fields->>'dateOfBirth','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or coalesce(v_fields->>'timeQuality','') not in ('exact','approximate','unknown') or coalesce(v_fields->>'birthCity','')='' or coalesce(v_fields->>'birthCountry','')='' then raise exception 'Invalid birth details'; end if;
 if exists(select 1 from jsonb_each(v_fields) where jsonb_typeof(value)<>'string' or length(value#>>'{}')>2000 or key not in ('dateOfBirth','timeOfBirth','timeQuality','birthCity','birthCountry','timezone','language','chartName','rasi','nakshatra','pada','lagna','ayanamsa','calculationSource','tithi','yoga','karana','dosha','dasha','notes')) then raise exception 'Invalid fields'; end if;
 if (v_fields->>'dateOfBirth')::date::text<>v_fields->>'dateOfBirth' or (v_fields->>'dateOfBirth')::date>current_date or (v_fields->>'dateOfBirth')::date<date '1900-01-01' or not exists(select 1 from pg_timezone_names where name=v_fields->>'timezone') or coalesce(v_fields->>'language','')='' then raise exception 'Invalid date, timezone or language'; end if;
 if v_fields->>'timeQuality'='unknown' and (coalesce(v_fields->>'timeOfBirth','')<>'' or coalesce(v_fields->>'lagna','')<>'') then raise exception 'Unknown time cannot include time or lagna'; end if;
 if v_fields->>'timeQuality'<>'unknown' and coalesce(v_fields->>'timeOfBirth','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid time'; end if;
 if coalesce(v_fields->>'pada','')<>'' and v_fields->>'pada' !~ '^[1-4]$' then raise exception 'Invalid pada'; end if;
 if jsonb_typeof(coalesce(p_payload->'planets','[]'))<>'array' or jsonb_array_length(coalesce(p_payload->'planets','[]'))>18 then raise exception 'Invalid planets'; end if;
 if exists(select 1 from jsonb_array_elements(coalesce(p_payload->'planets','[]')) p where jsonb_typeof(p)<>'object' or coalesce(p->>'planet','') not in ('Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu') or coalesce(p->>'chart','') not in ('D1','D9') or coalesce((p->>'sign')::integer,0) not between 1 and 12 or (p ? 'degrees' and not ((p->>'degrees')::numeric>=0 and (p->>'degrees')::numeric<30)) or p ? 'house') then raise exception 'Invalid planetary data'; end if;
 v_provenance:=coalesce(h.provenance,'{}');
 v_provenance:=jsonb_set(v_provenance,array['original_fields'],coalesce(v_provenance->'original_fields',v_fields));
 for v_key in select jsonb_object_keys(v_fields) loop
 if h.fields->v_key is distinct from v_fields->v_key then v_provenance:=jsonb_set(v_provenance,array[v_key],jsonb_build_object('method','manual','value',v_fields->v_key,'confirmed_at',now())); end if;
 end loop;
 if p_payload->>'extraction_id' is not null then
 select e.* into v_extraction from public.horoscope_extractions e join public.horoscope_documents d on d.id=e.document_id where e.id=(p_payload->>'extraction_id')::uuid and e.owner_id=auth.uid() and d.processing_state='needs_review' and d.expires_at>now();
 if not found then raise exception 'Extraction unavailable'; end if;
 v_provenance:=v_provenance || jsonb_build_object('last_review',jsonb_build_object('extraction_id',v_extraction.id,'candidates',v_extraction.payload,'confirmed_at',now()));
 update public.horoscope_extractions set confirmed_at=now() where id=v_extraction.id;
 insert into public.horoscope_audit_events(actor_id,action) values(auth.uid(),'confirm');
 end if;
 v_provenance:=v_provenance || jsonb_build_object('planets',coalesce(p_payload->'planets','[]'));
 insert into public.horoscope_profiles(user_id,tradition,visibility,fields,shared_fields,provenance,comparison_consent,ai_consent,revision)
 values(auth.uid(),p_payload->>'tradition',p_payload->>'visibility',v_fields,array(select jsonb_array_elements_text(p_payload->'shared_fields')),v_provenance,(p_payload->>'comparison_consent')::boolean,(p_payload->>'ai_consent')::boolean,1)
 on conflict(user_id) do update set tradition=excluded.tradition,visibility=excluded.visibility,fields=excluded.fields,shared_fields=excluded.shared_fields,provenance=excluded.provenance,comparison_consent=excluded.comparison_consent,ai_consent=excluded.ai_consent,revision=horoscope_profiles.revision+1,updated_at=now(),verified_at=now()
 returning * into h;
 delete from public.horoscope_match_reports where requester_id=auth.uid() or other_id=auth.uid();
 insert into public.horoscope_audit_events(actor_id,action) values(auth.uid(),'save');
 return to_jsonb(h);
end $$;

create function public.horoscope_delete() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 delete from public.horoscope_match_reports where requester_id=auth.uid() or other_id=auth.uid();
 delete from public.horoscope_profiles where user_id=auth.uid();
 delete from public.horoscope_consents where user_id=auth.uid();
 delete from public.horoscope_documents where owner_id=auth.uid();
 insert into public.horoscope_audit_events(actor_id,action) values(auth.uid(),'delete');
end $$;

-- Persistent, atomic rate budget; no birth data is written into the audit log.
create function public.horoscope_claim_action(p_action text) returns void language plpgsql security definer set search_path='' as $$
declare v_limit integer;
begin
 if not public.horoscope_member_allowed(auth.uid()) or p_action not in ('upload','extract','compare','ai_explanation') then raise exception 'Unavailable' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
 select case when p_action in ('extract','ai_explanation') then daily_ai_limit else 30 end into v_limit from public.horoscope_settings;
 if (select count(*) from public.horoscope_audit_events where actor_id=auth.uid() and (action=p_action or (p_action in ('extract','ai_explanation') and action in ('extract','ai_explanation'))) and created_at>now()-interval '1 day')>=v_limit then raise exception 'Daily limit reached' using errcode='54000'; end if;
 if p_action='extract' then insert into public.horoscope_consents(user_id,purpose,granted) values(auth.uid(),'document_extraction',true); end if;
 insert into public.horoscope_audit_events(actor_id,action) values(auth.uid(),p_action);
end $$;

create function public.horoscope_register_document(p_id uuid,p_mime text,p_sha256 text) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.horoscope_documents;
begin
 if not public.horoscope_member_allowed(auth.uid()) or not exists(select 1 from public.horoscope_settings where horoscope_upload_enabled) then raise exception 'Uploads unavailable' using errcode='42501'; end if;
 insert into public.horoscope_documents(id,owner_id,storage_path,mime_type,sha256,expires_at)
 select p_id,auth.uid(),auth.uid()::text||'/'||p_id::text,p_mime,p_sha256,now()+retention_days*interval '1 day' from public.horoscope_settings on conflict(owner_id,sha256) do nothing returning * into d;
 if d.id is null then select * into d from public.horoscope_documents where owner_id=auth.uid() and sha256=p_sha256; end if;
 return to_jsonb(d);
end $$;
create function public.horoscope_record_extraction(p_document uuid,p_payload jsonb,p_version text) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.horoscope_extractions;
begin
 if not public.horoscope_member_allowed(auth.uid()) or not exists(select 1 from public.horoscope_settings where horoscope_upload_enabled) or not exists(select 1 from public.horoscope_documents where id=p_document and owner_id=auth.uid() and expires_at>now() and processing_state<>'deleted') then raise exception 'Unavailable' using errcode='42501'; end if;
 insert into public.horoscope_extractions(document_id,owner_id,payload,version) values(p_document,auth.uid(),p_payload,p_version) returning * into e;
 update public.horoscope_documents set processing_state='needs_review' where id=p_document;
 return to_jsonb(e);
end $$;
create function public.horoscope_remove_document(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin delete from public.horoscope_documents where id=p_id and owner_id=auth.uid(); end $$;

create function public.horoscope_admin_settings(p_settings jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 -- No traditional scoring rule set is approved yet. Never enable an unvalidated score.
 if jsonb_array_length(coalesce(p_settings->'matching_rule_sets','[]'))>0 then raise exception 'No validated rule sets installed'; end if;
 update public.horoscope_settings set horoscope_enabled=(p_settings->>'horoscope_enabled')::boolean,horoscope_upload_enabled=(p_settings->>'horoscope_upload_enabled')::boolean,ai_horoscope_matching_enabled=(p_settings->>'ai_horoscope_matching_enabled')::boolean,retention_days=(p_settings->>'retention_days')::integer,daily_ai_limit=(p_settings->>'daily_ai_limit')::integer;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata) values(auth.uid(),'horoscope_settings','settings','horoscope',p_settings);
end $$;

-- Private source files: peers and administrators cannot read these through storage RLS.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('horoscope-private','horoscope-private',false,5242880,array['image/jpeg','image/png','application/pdf']);
create policy horoscope_storage_read on storage.objects for select to authenticated using(bucket_id='horoscope-private' and owner_id=auth.uid()::text and exists(select 1 from public.horoscope_documents d where d.storage_path=name and d.owner_id=auth.uid() and d.expires_at>now()));
create policy horoscope_storage_write on storage.objects for insert to authenticated with check(bucket_id='horoscope-private' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.horoscope_documents d where d.storage_path=name and d.owner_id=auth.uid() and d.expires_at>now()) and public.horoscope_member_allowed(auth.uid()));
create policy horoscope_storage_delete on storage.objects for delete to authenticated using(bucket_id='horoscope-private' and owner_id=auth.uid()::text);

-- No direct writes to raw horoscope tables, even for authenticated clients.
revoke all on public.horoscope_profiles,public.horoscope_documents,public.horoscope_extractions,public.horoscope_match_reports,public.horoscope_audit_events,public.horoscope_restrictions from anon,authenticated;
grant select on public.horoscope_profiles,public.horoscope_documents,public.horoscope_extractions,public.horoscope_match_reports to authenticated;
-- Explicitly restrict each exposed security-definer function to signed-in callers.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'horoscope_%' loop
 execute format('revoke all on function %s from public,anon',f.signature);
 execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
create function public.horoscope_admin_metrics() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 return jsonb_build_object('profiles',(select count(*) from public.horoscope_profiles),'comparison_opt_ins',(select count(*) from public.horoscope_profiles where comparison_consent),'ai_opt_ins',(select count(*) from public.horoscope_profiles where ai_consent),'documents',(select count(*) from public.horoscope_documents),'extractions',(select count(*) from public.horoscope_extractions),'confirmed_reviews',(select count(*) from public.horoscope_extractions where confirmed_at is not null),'ai_requests_24h',(select count(*) from public.horoscope_audit_events where action in ('extract','ai_explanation') and created_at>now()-interval '1 day'));
end $$;
create function public.horoscope_admin_restrict(p_user uuid,p_restricted boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 insert into public.horoscope_restrictions(user_id,restricted) values(p_user,p_restricted) on conflict(user_id) do update set restricted=excluded.restricted;
 delete from public.horoscope_match_reports where requester_id=p_user or other_id=p_user;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata) values(auth.uid(),'horoscope_restriction','profile',p_user::text,jsonb_build_object('restricted',p_restricted));
end $$;
revoke all on function public.horoscope_admin_metrics(),public.horoscope_admin_restrict(uuid,boolean) from public,anon;
grant execute on function public.horoscope_admin_metrics(),public.horoscope_admin_restrict(uuid,boolean) to authenticated;
create function public.horoscope_store_report(p_other uuid,p_own_revision integer,p_other_revision integer,p_report jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.horoscope_report_current(p_other,p_own_revision,p_other_revision) then raise exception 'Permissions changed' using errcode='42501'; end if;
 if p_report->'aiExplanation' is distinct from 'null'::jsonb and (not exists(select 1 from public.horoscope_settings where ai_horoscope_matching_enabled) or (select count(*) from public.horoscope_profiles where user_id in (auth.uid(),p_other) and ai_consent)<>2) then raise exception 'AI consent unavailable' using errcode='42501'; end if;
 insert into public.horoscope_match_reports(requester_id,other_id,requester_revision,other_revision,report) values(auth.uid(),p_other,p_own_revision,p_other_revision,p_report) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.horoscope_store_report(uuid,integer,integer,jsonb) from public,anon;
grant execute on function public.horoscope_store_report(uuid,integer,integer,jsonb) to authenticated;

-- Only the scheduled backend can enumerate expired/orphan source objects.
create function public.horoscope_cleanup_candidates() returns table(storage_path text) language sql security definer set search_path='' as $$
 select o.name from storage.objects o left join public.horoscope_documents d on d.storage_path=o.name
 where o.bucket_id='horoscope-private' and (d.id is null or d.expires_at<=now()) limit 100
$$;
create function public.horoscope_cleanup_metadata() returns void language plpgsql security definer set search_path='' as $$
begin
 delete from public.horoscope_documents d where d.expires_at<=now() and not exists(select 1 from storage.objects o where o.bucket_id='horoscope-private' and o.name=d.storage_path);
 delete from public.horoscope_match_reports where expires_at<=now();
 delete from public.horoscope_audit_events where created_at<now()-interval '90 days';
end $$;
revoke all on function public.horoscope_cleanup_candidates(),public.horoscope_cleanup_metadata() from public,anon,authenticated;
grant execute on function public.horoscope_cleanup_candidates(),public.horoscope_cleanup_metadata() to service_role;
