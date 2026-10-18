-- Text mutations, private attachments and call signaling share the same pair authorization.
create table cupidmatch_admin.feature_flags(name text primary key,enabled boolean not null default false);
alter table cupidmatch_admin.feature_flags enable row level security;
revoke all on cupidmatch_admin.feature_flags from public,anon,authenticated;
insert into cupidmatch_admin.feature_flags(name,enabled)values('calling',false);

create table public.message_attachments (
 id uuid primary key default gen_random_uuid(),chat_id text not null references public.chats(id) on delete cascade,
 uploader_id uuid not null references public.profiles(id),file_name text not null,mime_type text not null,
 byte_size integer not null check(byte_size between 1 and 5242880),object_path text unique not null,
 status text not null default 'pending' check(status in('pending','ready','removed')),created_at timestamptz not null default now()
);
create index message_attachments_chat on public.message_attachments(chat_id,created_at desc);
alter table public.messages add column attachment_id uuid references public.message_attachments(id),add column request_id uuid;
create unique index messages_retry_id on public.messages(sender_id,request_id)where request_id is not null;
create table public.member_calls(
 id uuid primary key default gen_random_uuid(),chat_id text not null references public.chats(id),caller_id uuid not null references public.profiles(id),callee_id uuid not null references public.profiles(id),
 kind text not null check(kind in('voice','video')),status text not null default 'ringing'check(status in('ringing','accepted','rejected','ended','unavailable','missed')),
 offer jsonb,answer jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),ended_at timestamptz
);
create index member_calls_callee on public.member_calls(callee_id,status,created_at desc);
create table public.call_signals(id bigint generated always as identity primary key,call_id uuid not null references public.member_calls(id)on delete cascade,sender_id uuid not null references public.profiles(id),candidate jsonb not null,created_at timestamptz not null default now());
create index call_signals_call on public.call_signals(call_id,id);
alter table public.message_attachments enable row level security;alter table public.member_calls enable row level security;alter table public.call_signals enable row level security;
revoke all on public.message_attachments,public.member_calls,public.call_signals from public,anon,authenticated;
-- Mutable unread totals and message receipts must be changed atomically, never client read/modify/write.
revoke update on public.chats from authenticated;
revoke insert,update,delete,select on public.messages from authenticated;
grant select(id,chat_id,sender_id,text,created_at,attachment_id)on public.messages to authenticated;
create function cupidmatch_admin.can_communicate(p_chat text)returns boolean language sql stable security definer set search_path=''as $$
 select auth.uid()is not null and exists(select 1 from public.chats c where c.id=p_chat and auth.uid()in(c.participant_1,c.participant_2)
 and cupidmatch_admin.planning_pair_allowed(c.participant_1,c.participant_2)and exists(select 1 from public.connections x where(x.member_a_id=c.participant_1 and x.member_b_id=c.participant_2)or(x.member_b_id=c.participant_1 and x.member_a_id=c.participant_2)))
$$;
revoke all on function cupidmatch_admin.can_communicate(text)from public,anon;
grant execute on function cupidmatch_admin.can_communicate(text)to authenticated;
-- Restrictive policies also cover any pre-existing permissive policies.
create policy current_connection_messages on public.messages as restrictive for select to authenticated using(cupidmatch_admin.can_communicate(chat_id));
create policy current_connection_chats on public.chats as restrictive for select to authenticated using(cupidmatch_admin.can_communicate(id));

create function cupidmatch_admin.communication(p_action text,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare v_me uuid:=auth.uid();v_chat text:=p_payload->>'chatId';v_id uuid;v_other uuid;v_attachment uuid;v_call public.member_calls%rowtype;v_rows jsonb;v_message uuid;v_path text;v_count integer;
begin
 if v_me is null or not public.member_is_active(v_me)then raise exception 'Active account required'using errcode='42501';end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object'or octet_length(p_payload::text)>40000 then raise exception 'Invalid input'using errcode='22023';end if;
 if p_action='incoming'then
  update public.member_calls set status='missed',ended_at=now(),updated_at=now()where(caller_id=v_me or callee_id=v_me)and status='ringing'and created_at<now()-interval '45 seconds';
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'chat_id',chat_id,'kind',kind,'caller_id',caller_id,'status',status,'offer',offer)),'[]')into v_rows from public.member_calls where callee_id=v_me and status='ringing'and cupidmatch_admin.can_communicate(chat_id);return jsonb_build_object('calls',v_rows);
 end if;
 if p_action in('call_read','call_accept','call_reject','call_end','call_unavailable','call_signal','call_answer')then
  v_id:=(p_payload->>'id')::uuid;select * into v_call from public.member_calls where id=v_id and v_me in(caller_id,callee_id)for update;
  if not found then raise exception 'Call unavailable'using errcode='P0002';end if;v_chat:=v_call.chat_id;
  if p_action in('call_end','call_unavailable')then
   update public.member_calls set status=case when p_action='call_unavailable'then'unavailable'else'ended'end,ended_at=now(),updated_at=now()where id=v_id and status in('ringing','accepted');return jsonb_build_object('saved',true);
  end if;
 end if;
 if p_action like'call_%'and p_action<>'call_start'and not cupidmatch_admin.planning_membership(v_call.caller_id)then raise exception 'Caller membership expired'using errcode='42501';end if;
 if not cupidmatch_admin.can_communicate(v_chat)then raise exception 'Active unblocked connection required'using errcode='42501';end if;
 if p_action='calling_config'then
  return jsonb_build_object('allowed',exists(select 1 from cupidmatch_admin.feature_flags where name='calling'and enabled)and(cupidmatch_admin.planning_membership(v_me)or exists(select 1 from public.member_calls where chat_id=v_chat and callee_id=v_me and status in('ringing','accepted')and created_at>now()-interval '45 seconds')));
 elsif p_action='messages'then
  select coalesce(jsonb_agg(to_jsonb(q)order by q.created_at,q.id),'[]')into v_rows from(select m.id,m.chat_id,m.sender_id,m.text,case when cupidmatch_admin.planning_membership(v_me)then m.is_read else false end as is_read,m.created_at,m.attachment_id,a.file_name as attachment_name from public.messages m left join public.message_attachments a on a.id=m.attachment_id and a.status='ready'where m.chat_id=v_chat and(p_payload->>'before'is null or (m.created_at,m.id)<((p_payload->>'before')::timestamptz,coalesce((p_payload->>'beforeId')::uuid,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))order by m.created_at desc,m.id desc limit 100)q;return jsonb_build_object('messages',v_rows);
 elsif p_action='send'then
  if p_payload->>'requestId'is null or length(coalesce(p_payload->>'text',''))>4000 then raise exception 'Invalid message'using errcode='22023';end if;
  v_id:=(p_payload->>'requestId')::uuid;v_attachment:=(p_payload->>'attachmentId')::uuid;
  perform pg_advisory_xact_lock(hashtextextended(v_me::text,810));
  select id into v_message from public.messages where sender_id=v_me and request_id=v_id and chat_id=v_chat;if v_message is not null then return jsonb_build_object('id',v_message);end if;
  if length(trim(coalesce(p_payload->>'text','')))=0 and v_attachment is null then raise exception 'Enter a message'using errcode='22023';end if;
  if(select count(*)from public.messages where sender_id=v_me and created_at>now()-interval '1 minute')>=30 then raise exception 'Message limit reached'using errcode='22023';end if;
  if v_attachment is not null and not exists(select 1 from public.message_attachments where id=v_attachment and chat_id=v_chat and uploader_id=v_me and status='ready')then raise exception 'Attachment unavailable'using errcode='42501';end if;
  insert into public.messages(id,chat_id,sender_id,text,is_read,request_id,attachment_id)values(gen_random_uuid(),v_chat,v_me,trim(coalesce(p_payload->>'text','')),false,v_id,v_attachment)returning id into v_message;
  select case when participant_1=v_me then participant_2 else participant_1 end into v_other from public.chats where id=v_chat for update;
  update public.chats set last_message_text=case when v_attachment is null then left(trim(p_payload->>'text'),200)else'Attachment'end,last_message_sender_id=v_me,last_message_at=now(),unread_by=jsonb_set(jsonb_set(coalesce(unread_by,'{}'),array[v_other::text],to_jsonb(coalesce((unread_by->>v_other::text)::int,0)+1)),array[v_me::text],'0')where id=v_chat;return jsonb_build_object('id',v_message);
 elsif p_action='read'then
  update public.messages set is_read=true where chat_id=v_chat and sender_id<>v_me and is_read=false;
  update public.chats set unread_by=jsonb_set(coalesce(unread_by,'{}'),array[v_me::text],'0')where id=v_chat and coalesce((unread_by->>v_me::text)::int,0)<>0;return jsonb_build_object('saved',true);
 elsif p_action='attachment_reserve'then
  if p_payload->>'mimeType'is null or p_payload->>'mimeType'not in('image/jpeg','image/png','image/webp','application/pdf')or(p_payload->>'size')::integer not between 1 and 5242880 or p_payload->>'name'is null or p_payload->>'size'is null or length(p_payload->>'name')not between 1 and 150 then raise exception 'Invalid attachment'using errcode='22023';end if;
  perform pg_advisory_xact_lock(hashtextextended(v_me::text,811));
  if(select count(*)from public.message_attachments where uploader_id=v_me and created_at>now()-interval '1 hour')>=20 then raise exception 'Hourly attachment limit reached'using errcode='22023';end if;
  v_id:=gen_random_uuid();v_path:=v_me::text||'/'||v_id::text;
  insert into public.message_attachments(id,chat_id,uploader_id,file_name,mime_type,byte_size,object_path)values(v_id,v_chat,v_me,p_payload->>'name',p_payload->>'mimeType',(p_payload->>'size')::integer,v_path);return jsonb_build_object('id',v_id,'path',v_path);
 elsif p_action='attachment_ready'then
  v_id:=(p_payload->>'id')::uuid;
  update public.message_attachments a set status='ready'where id=v_id and uploader_id=v_me and chat_id=v_chat and status='pending'and exists(select 1 from storage.objects o where o.bucket_id='message-attachments'and o.name=a.object_path and(o.metadata->>'size')::bigint=a.byte_size and o.metadata->>'mimetype'=a.mime_type);
  if not found then raise exception 'Upload not found'using errcode='22023';end if;return jsonb_build_object('saved',true);
 elsif p_action='attachment_get'then
  select jsonb_build_object('path',a.object_path,'name',a.file_name,'mimeType',a.mime_type)into v_rows from public.message_attachments a where a.id=(p_payload->>'id')::uuid and a.chat_id=v_chat and a.status='ready'and exists(select 1 from public.messages m where m.attachment_id=a.id);if v_rows is null then raise exception 'Attachment unavailable'using errcode='P0002';end if;return v_rows;
 elsif p_action='call_start'then
  if not exists(select 1 from cupidmatch_admin.feature_flags where name='calling'and enabled)then raise exception 'Calling unavailable'using errcode='42501';end if;
  if p_payload->>'kind'is null or p_payload->>'kind'not in('voice','video')or jsonb_typeof(p_payload->'offer')is distinct from'object'or octet_length((p_payload->'offer')::text)>30000 then raise exception 'Invalid call'using errcode='22023';end if;
  -- The caller needs an active Premium/trial plan; a free connected member can receive.
  if not cupidmatch_admin.planning_membership(v_me)then raise exception 'Premium required to start calls'using errcode='42501';end if;
  select case when participant_1=v_me then participant_2 else participant_1 end into v_other from public.chats where id=v_chat;
  perform pg_advisory_xact_lock(hashtextextended(least(v_me,v_other)::text,812));perform pg_advisory_xact_lock(hashtextextended(greatest(v_me,v_other)::text,812));
  update public.member_calls set status='unavailable',ended_at=now(),updated_at=now()where status in('ringing','accepted')and updated_at<now()-interval '2 minutes';
  if exists(select 1 from public.member_calls where status in('ringing','accepted')and(v_me in(caller_id,callee_id)or v_other in(caller_id,callee_id)))then raise exception 'A member is busy'using errcode='40001';end if;
  if(select count(*)from public.member_calls where caller_id=v_me and created_at>now()-interval '1 hour')>=20 then raise exception 'Call limit reached'using errcode='22023';end if;
  insert into public.member_calls(chat_id,caller_id,callee_id,kind,offer)values(v_chat,v_me,v_other,p_payload->>'kind',p_payload->'offer')returning id into v_id;return jsonb_build_object('id',v_id);
 elsif p_action='call_accept'then
  if v_call.callee_id<>v_me or v_call.status<>'ringing'or v_call.created_at<now()-interval '45 seconds'then raise exception 'Call expired'using errcode='40001';end if;
  update public.member_calls set status='accepted',updated_at=now()where id=v_id;return jsonb_build_object('saved',true);
 elsif p_action='call_reject'then
  if v_call.callee_id<>v_me or v_call.status<>'ringing'then raise exception 'Call unavailable'using errcode='40001';end if;
  update public.member_calls set status='rejected',ended_at=now(),updated_at=now()where id=v_id;return jsonb_build_object('saved',true);
 elsif p_action='call_answer'then
  if v_call.callee_id<>v_me or v_call.status<>'accepted'or jsonb_typeof(p_payload->'answer')is distinct from'object'or octet_length((p_payload->'answer')::text)>30000 then raise exception 'Invalid answer'using errcode='22023';end if;
  update public.member_calls set answer=p_payload->'answer',updated_at=now()where id=v_id;return jsonb_build_object('saved',true);
 elsif p_action='call_signal'then
  if v_call.status not in('ringing','accepted')or jsonb_typeof(p_payload->'candidate')is distinct from'object'or octet_length((p_payload->'candidate')::text)>3000 then raise exception 'Invalid signal'using errcode='22023';end if;
  if(select count(*)from public.call_signals where call_id=v_id)>=200 then raise exception 'Signal limit reached'using errcode='22023';end if;
  insert into public.call_signals(call_id,sender_id,candidate)values(v_id,v_me,p_payload->'candidate');return jsonb_build_object('saved',true);
 elsif p_action='call_read'then
  if v_call.status='ringing'and v_call.created_at<now()-interval '45 seconds'then update public.member_calls set status='missed',ended_at=now(),updated_at=now()where id=v_id;v_call.status:='missed';end if;
  update public.member_calls set updated_at=now()where id=v_id and status='accepted';
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'candidate',candidate)order by id),'[]')into v_rows from public.call_signals where call_id=v_id and sender_id<>v_me and id>coalesce((p_payload->>'after')::bigint,0);
  return jsonb_build_object('call',to_jsonb(v_call),'signals',v_rows);
 end if;
 raise exception 'Unknown action'using errcode='22023';
end $$;
revoke all on function cupidmatch_admin.communication(text,jsonb)from public,anon;
grant execute on function cupidmatch_admin.communication(text,jsonb)to authenticated;
create function public.communication(p_action text,p_payload jsonb default '{}')returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.communication(p_action,p_payload)$$;
revoke all on function public.communication(text,jsonb)from public,anon;
grant execute on function public.communication(text,jsonb)to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('message-attachments','message-attachments',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])on conflict(id)do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create function cupidmatch_admin.attachment_storage_allowed(p_path text,p_write boolean)returns boolean language sql stable security definer set search_path=''as $$
 select auth.uid()is not null and exists(select 1 from public.message_attachments a where a.object_path=p_path and cupidmatch_admin.can_communicate(a.chat_id)and(case when p_write then a.uploader_id=auth.uid()and a.status='pending'else a.status='ready'and exists(select 1 from public.messages m where m.attachment_id=a.id)end))
$$;
revoke all on function cupidmatch_admin.attachment_storage_allowed(text,boolean)from public,anon;
grant execute on function cupidmatch_admin.attachment_storage_allowed(text,boolean)to authenticated;
create policy attachment_insert on storage.objects for insert to authenticated with check(bucket_id='message-attachments'and cupidmatch_admin.attachment_storage_allowed(name,true));
create policy attachment_select on storage.objects for select to authenticated using(bucket_id='message-attachments'and cupidmatch_admin.attachment_storage_allowed(name,false));
