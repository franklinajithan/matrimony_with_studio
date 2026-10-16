-- Member support is private, authenticated and delivered inside CupidMatch.
create table public.support_tickets(
 id uuid primary key default gen_random_uuid(),member_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null,category text not null check(category in ('account','profile','billing','safety','feedback','other')),
 subject text not null check(length(trim(subject)) between 5 and 150),
 status text not null default 'open' check(status in ('open','in_progress','waiting_on_member','resolved')),
 assigned_to uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(member_id,request_id)
);
create index support_tickets_member_created on public.support_tickets(member_id,created_at desc);
create index support_tickets_status_updated on public.support_tickets(status,updated_at desc);
create table public.support_messages(
 id uuid primary key default gen_random_uuid(),ticket_id uuid not null references public.support_tickets(id) on delete cascade,
 author_id uuid not null references public.profiles(id),request_id uuid not null,
 is_staff boolean not null default false,body text not null check(length(trim(body)) between 1 and 4000),
 created_at timestamptz not null default now(),unique(author_id,request_id)
);
create index support_messages_ticket_created on public.support_messages(ticket_id,created_at);
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.support_tickets,public.support_messages from public,anon,authenticated;

-- Support receives the support scope; moderators keep their moderation-only scope.
create or replace function cupidmatch_admin.admin_has_permission(p_permission text)
returns boolean language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and (public.is_admin() or exists(
 select 1 from public.admin_staff s join public.profiles p on p.id=s.user_id
 where s.user_id=auth.uid() and p.suspended_at is null and
 (p_permission='workspace' or (s.role='support' and p_permission in ('members','notifications','member_read','notes','support')) or (s.role='moderator' and p_permission in ('moderation','content','member_read','notes'))))) $$;

create or replace function cupidmatch_admin.create_support_ticket(p_category text,p_subject text,p_body text,p_request_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_id uuid;begin
 if auth.uid() is null then raise exception 'Forbidden' using errcode='42501';end if;
 if p_category is null or p_category not in ('account','profile','billing','safety','feedback','other') or p_subject is null or length(trim(p_subject)) not between 5 and 150 or p_body is null or length(trim(p_body)) not between 10 and 4000 or p_request_id is null then raise exception 'Invalid support request' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,731));
 select id into v_id from public.support_tickets where member_id=auth.uid() and request_id=p_request_id;
 if v_id is not null then return v_id;end if;
 if (select count(*) from public.support_tickets where member_id=auth.uid() and created_at>now()-interval '24 hours')>=3 then raise exception 'Daily support limit reached' using errcode='P0001';end if;
 insert into public.support_tickets(member_id,request_id,category,subject)values(auth.uid(),p_request_id,p_category,trim(p_subject))returning id into v_id;
 insert into public.support_messages(ticket_id,author_id,request_id,body)values(v_id,auth.uid(),p_request_id,trim(p_body));
 return v_id;
end $$;

create or replace function cupidmatch_admin.support_tickets_list(p_staff boolean default false,p_status text default 'all',p_search text default '',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_rows jsonb;v_total bigint;begin
 if auth.uid() is null or p_staff is null or (p_staff and not public.admin_has_permission('support')) then raise exception 'Forbidden' using errcode='42501';end if;
 if p_status is null or p_status not in ('all','open','in_progress','waiting_on_member','resolved') or p_search is null or length(p_search)>100 or p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid filters' using errcode='22023';end if;
 select count(*) into v_total from public.support_tickets t join public.profiles p on p.id=t.member_id
 where (p_staff or t.member_id=auth.uid()) and (p_status='all' or t.status=p_status)
 and (p_search='' or t.subject ilike '%'||p_search||'%' or (p_staff and (p.display_name ilike '%'||p_search||'%' or p.email ilike '%'||p_search||'%')));
 select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb)into v_rows from(
 select t.id,t.subject,t.category,t.status,t.created_at,t.updated_at,t.assigned_to,
 case when p_staff then p.display_name else null end as member_name,
 (select count(*) from public.support_messages m where m.ticket_id=t.id)as message_count
 from public.support_tickets t join public.profiles p on p.id=t.member_id
 where (p_staff or t.member_id=auth.uid()) and (p_status='all' or t.status=p_status)
 and (p_search='' or t.subject ilike '%'||p_search||'%' or (p_staff and (p.display_name ilike '%'||p_search||'%' or p.email ilike '%'||p_search||'%')))
 order by t.updated_at desc,t.id limit 20 offset(p_page-1)*20)q;
 return jsonb_build_object('tickets',v_rows,'total',v_total,'page',p_page,'pageSize',20);
end $$;

create or replace function cupidmatch_admin.support_ticket_thread(p_ticket_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_ticket public.support_tickets%rowtype;v_staff boolean;v_messages jsonb;begin
 if auth.uid() is null then raise exception 'Forbidden' using errcode='42501';end if;
 v_staff:=public.admin_has_permission('support');
 select * into v_ticket from public.support_tickets where id=p_ticket_id and (member_id=auth.uid() or v_staff);
 if not found then raise exception 'Ticket not found' using errcode='P0002';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'body',body,'is_staff',is_staff,'created_at',created_at)order by created_at,id),'[]'::jsonb)into v_messages
 from (select id,body,is_staff,created_at from public.support_messages where ticket_id=p_ticket_id order by created_at desc,id desc limit 200)m;
 return jsonb_build_object('ticket',jsonb_build_object('id',v_ticket.id,'member_id',case when v_staff then v_ticket.member_id else null end,'subject',v_ticket.subject,'category',v_ticket.category,'status',v_ticket.status,'assigned_to',case when v_staff then v_ticket.assigned_to else null end,'updated_at',v_ticket.updated_at,'created_at',v_ticket.created_at),'messages',v_messages,'messageLimit',200);
end $$;

create or replace function cupidmatch_admin.reply_support_ticket(p_ticket_id uuid,p_body text,p_request_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$ declare v_ticket public.support_tickets%rowtype;v_id uuid;v_staff boolean;begin
 if auth.uid() is null then raise exception 'Forbidden' using errcode='42501';end if;
 if p_body is null or length(trim(p_body)) not between 1 and 4000 or p_request_id is null then raise exception 'Invalid reply' using errcode='22023';end if;
 select * into v_ticket from public.support_tickets where id=p_ticket_id and (member_id=auth.uid() or public.admin_has_permission('support')) for update;
 if not found then raise exception 'Ticket not found' using errcode='P0002';end if;
 select id into v_id from public.support_messages where ticket_id=p_ticket_id and author_id=auth.uid() and request_id=p_request_id;
 if v_id is not null then return v_id;end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,732));
 if (select count(*) from public.support_messages where author_id=auth.uid() and created_at>now()-interval '1 hour')>=30 then raise exception 'Reply limit reached' using errcode='P0001';end if;
 v_staff:=v_ticket.member_id<>auth.uid() and public.admin_has_permission('support');
 insert into public.support_messages(ticket_id,author_id,request_id,is_staff,body)values(p_ticket_id,auth.uid(),p_request_id,v_staff,trim(p_body))returning id into v_id;
 update public.support_tickets set status=case when v_staff then 'waiting_on_member' when assigned_to is not null then 'in_progress' else 'open' end,updated_at=clock_timestamp() where id=p_ticket_id;
 if v_staff then
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(auth.uid(),'support_replied','support_ticket',p_ticket_id::text,jsonb_build_object('message_id',v_id));
  insert into public.member_notices(member_id,title,body,created_by)values(v_ticket.member_id,'CupidMatch support replied','A reply is available for “'||v_ticket.subject||'”. Open Support in your account to read it.',auth.uid());
 end if;
 return v_id;
end $$;

create or replace function cupidmatch_admin.update_support_ticket(p_ticket_id uuid,p_status text,p_claim boolean,p_reason text,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_ticket public.support_tickets%rowtype;begin
 if auth.uid() is null or not public.admin_has_permission('support') then raise exception 'Forbidden' using errcode='42501';end if;
 if p_status is null or p_status not in ('open','in_progress','waiting_on_member','resolved') or p_reason is null or length(trim(p_reason))not between 10 and 1000 then raise exception 'Invalid support action' using errcode='22023';end if;
 select * into v_ticket from public.support_tickets where id=p_ticket_id for update;
 if not found then raise exception 'Ticket not found' using errcode='P0002';end if;
 if v_ticket.updated_at is distinct from p_expected_updated_at then raise exception 'Ticket changed; refresh first' using errcode='40001';end if;
 if p_claim is not null and v_ticket.assigned_to is not null and v_ticket.assigned_to<>auth.uid() and not public.is_admin() then raise exception 'Assigned to another agent' using errcode='42501';end if;
 update public.support_tickets set status=p_status,assigned_to=case when p_claim is true then auth.uid() when p_claim is false then null else assigned_to end,updated_at=clock_timestamp()where id=p_ticket_id;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)values(auth.uid(),'support_updated','support_ticket',p_ticket_id::text,jsonb_build_object('before_status',v_ticket.status,'status',p_status,'claim',p_claim,'reason',trim(p_reason)));
 return jsonb_build_object('updated',true);
end $$;

-- Explicit, current entitlement decisions; raw activity records are never selectable.
create table public.profile_activity_preferences(member_id uuid primary key references public.profiles(id)on delete cascade,incognito boolean not null default false);
create table public.profile_visits(viewed_id uuid not null references public.profiles(id)on delete cascade,viewer_id uuid not null references public.profiles(id)on delete cascade,viewed_at timestamptz not null default now(),primary key(viewed_id,viewer_id),check(viewed_id<>viewer_id));
create index profile_visits_recent on public.profile_visits(viewed_id,viewed_at desc);
create index profile_visits_viewer on public.profile_visits(viewer_id);
alter table public.profile_activity_preferences enable row level security;
alter table public.profile_visits enable row level security;
revoke all on public.profile_activity_preferences,public.profile_visits from public,anon,authenticated;

create or replace function cupidmatch_admin.activity_feature(p_feature text)
returns boolean language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and (
 exists(select 1 from public.user_subscriptions s where s.user_id=auth.uid() and s.status in ('active','trialing') and s.current_period_start<=now() and s.current_period_end>now() and s.id=(select latest.id from public.user_subscriptions latest where latest.user_id=auth.uid()and latest.status in ('active','trialing','past_due')order by latest.created_at desc,latest.id limit 1)
 and ((p_feature='visitors' and s.plan_code in ('premium','premium_plus','plus'))or(p_feature='incognito' and s.plan_code in ('premium_plus','plus'))))
 or(p_feature='visitors' and exists(select 1 from public.member_trials t where t.user_id=auth.uid() and t.starts_at<=now() and t.ends_at>now()))) $$;

create or replace function cupidmatch_admin.profile_activity_settings(p_incognito boolean default null)
returns jsonb language plpgsql security definer set search_path=''
as $$ declare v_allowed boolean;v_enabled boolean;begin
 if auth.uid() is null then raise exception 'Forbidden' using errcode='42501';end if;
 v_allowed:=cupidmatch_admin.activity_feature('incognito');
 if p_incognito is not null then
  if p_incognito and not v_allowed then raise exception 'Premium+ required' using errcode='42501';end if;
  insert into public.profile_activity_preferences(member_id,incognito)values(auth.uid(),p_incognito)on conflict(member_id)do update set incognito=excluded.incognito;
 end if;
 select coalesce(incognito,false)into v_enabled from public.profile_activity_preferences where member_id=auth.uid();
 return jsonb_build_object('incognito',coalesce(v_enabled,false)and v_allowed,'incognitoAllowed',v_allowed);
end $$;

create or replace function cupidmatch_admin.record_profile_visit(p_viewed_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$ begin
 if auth.uid() is null then raise exception 'Forbidden' using errcode='42501';end if;
 if p_viewed_id is null or p_viewed_id=auth.uid() or public.is_admin() or exists(select 1 from public.admin_staff where user_id=auth.uid())then return false;end if;
 if not exists(select 1 from public.profiles where id=auth.uid()and suspended_at is null)or not exists(select 1 from public.profiles where id=p_viewed_id and is_published is true and suspended_at is null and is_admin is not true)then return false;end if;
 if public.is_blocked_between(auth.uid(),p_viewed_id)then return false;end if;
 if cupidmatch_admin.activity_feature('incognito')and exists(select 1 from public.profile_activity_preferences where member_id=auth.uid()and incognito)then return false;end if;
 insert into public.profile_visits(viewed_id,viewer_id)values(p_viewed_id,auth.uid())on conflict(viewed_id,viewer_id)do update set viewed_at=excluded.viewed_at where public.profile_visits.viewed_at<now()-interval '5 minutes';
 delete from public.profile_visits where viewed_id=p_viewed_id and viewed_at<now()-interval '90 days';
 return true;
end $$;

create or replace function cupidmatch_admin.profile_visitors(p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_rows jsonb;v_total bigint;begin
 if auth.uid() is null then raise exception 'Forbidden' using errcode='42501';end if;
 if p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid page' using errcode='22023';end if;
 if not cupidmatch_admin.activity_feature('visitors')then return jsonb_build_object('locked',true,'viewers','[]'::jsonb,'total',0);end if;
 select count(*)into v_total from public.profile_visits v join public.profiles p on p.id=v.viewer_id where v.viewed_id=auth.uid()and v.viewed_at>now()-interval '90 days'and p.is_published is true and p.suspended_at is null and not public.is_blocked_between(auth.uid(),v.viewer_id);
 select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb)into v_rows from(
 select p.id,p.display_name,v.viewed_at,
 case when p.photo_privacy='members'or(p.photo_privacy='connections'and exists(select 1 from public.connections c where(c.member_a_id=auth.uid()and c.member_b_id=p.id)or(c.member_b_id=auth.uid()and c.member_a_id=p.id)))then p.photo_url else null end as photo_url
 from public.profile_visits v join public.profiles p on p.id=v.viewer_id where v.viewed_id=auth.uid()and v.viewed_at>now()-interval '90 days'and p.is_published is true and p.suspended_at is null and not public.is_blocked_between(auth.uid(),v.viewer_id)
 order by v.viewed_at desc,p.id limit 20 offset(p_page-1)*20)q;
 return jsonb_build_object('locked',false,'viewers',v_rows,'total',v_total,'page',p_page,'pageSize',20);
end $$;

revoke all on function cupidmatch_admin.create_support_ticket(text,text,text,uuid) from public,anon,authenticated;
grant execute on function cupidmatch_admin.create_support_ticket(text,text,text,uuid) to authenticated;
create or replace function public.create_support_ticket(p_category text,p_subject text,p_body text,p_request_id uuid)returns uuid language sql volatile security invoker set search_path='' as $$select cupidmatch_admin.create_support_ticket(p_category,p_subject,p_body,p_request_id)$$;
revoke all on function public.create_support_ticket(text,text,text,uuid)from public,anon;
grant execute on function public.create_support_ticket(text,text,text,uuid)to authenticated;

revoke all on function cupidmatch_admin.support_tickets_list(boolean,text,text,integer) from public,anon,authenticated;
grant execute on function cupidmatch_admin.support_tickets_list(boolean,text,text,integer) to authenticated;
create or replace function public.support_tickets_list(p_staff boolean default false,p_status text default 'all',p_search text default '',p_page integer default 1)returns jsonb language sql stable security invoker set search_path='' as $$select cupidmatch_admin.support_tickets_list(p_staff,p_status,p_search,p_page)$$;
revoke all on function public.support_tickets_list(boolean,text,text,integer)from public,anon;
grant execute on function public.support_tickets_list(boolean,text,text,integer)to authenticated;

revoke all on function cupidmatch_admin.support_ticket_thread(uuid) from public,anon,authenticated;
grant execute on function cupidmatch_admin.support_ticket_thread(uuid) to authenticated;
create or replace function public.support_ticket_thread(p_ticket_id uuid)returns jsonb language sql stable security invoker set search_path='' as $$select cupidmatch_admin.support_ticket_thread(p_ticket_id)$$;
revoke all on function public.support_ticket_thread(uuid)from public,anon;
grant execute on function public.support_ticket_thread(uuid)to authenticated;

revoke all on function cupidmatch_admin.reply_support_ticket(uuid,text,uuid) from public,anon,authenticated;
grant execute on function cupidmatch_admin.reply_support_ticket(uuid,text,uuid) to authenticated;
create or replace function public.reply_support_ticket(p_ticket_id uuid,p_body text,p_request_id uuid)returns uuid language sql volatile security invoker set search_path='' as $$select cupidmatch_admin.reply_support_ticket(p_ticket_id,p_body,p_request_id)$$;
revoke all on function public.reply_support_ticket(uuid,text,uuid)from public,anon;
grant execute on function public.reply_support_ticket(uuid,text,uuid)to authenticated;

revoke all on function cupidmatch_admin.update_support_ticket(uuid,text,boolean,text,timestamptz) from public,anon,authenticated;
grant execute on function cupidmatch_admin.update_support_ticket(uuid,text,boolean,text,timestamptz) to authenticated;
create or replace function public.update_support_ticket(p_ticket_id uuid,p_status text,p_claim boolean,p_reason text,p_expected_updated_at timestamptz)returns jsonb language sql volatile security invoker set search_path='' as $$select cupidmatch_admin.update_support_ticket(p_ticket_id,p_status,p_claim,p_reason,p_expected_updated_at)$$;
revoke all on function public.update_support_ticket(uuid,text,boolean,text,timestamptz)from public,anon;
grant execute on function public.update_support_ticket(uuid,text,boolean,text,timestamptz)to authenticated;

revoke all on function cupidmatch_admin.profile_activity_settings(boolean) from public,anon,authenticated;
grant execute on function cupidmatch_admin.profile_activity_settings(boolean) to authenticated;
create or replace function public.profile_activity_settings(p_incognito boolean default null)returns jsonb language sql volatile security invoker set search_path='' as $$select cupidmatch_admin.profile_activity_settings(p_incognito)$$;
revoke all on function public.profile_activity_settings(boolean)from public,anon;
grant execute on function public.profile_activity_settings(boolean)to authenticated;

revoke all on function cupidmatch_admin.record_profile_visit(uuid) from public,anon,authenticated;
grant execute on function cupidmatch_admin.record_profile_visit(uuid) to authenticated;
create or replace function public.record_profile_visit(p_viewed_id uuid)returns boolean language sql volatile security invoker set search_path='' as $$select cupidmatch_admin.record_profile_visit(p_viewed_id)$$;
revoke all on function public.record_profile_visit(uuid)from public,anon;
grant execute on function public.record_profile_visit(uuid)to authenticated;

revoke all on function cupidmatch_admin.profile_visitors(integer) from public,anon,authenticated;
grant execute on function cupidmatch_admin.profile_visitors(integer) to authenticated;
create or replace function public.profile_visitors(p_page integer default 1)returns jsonb language sql stable security invoker set search_path='' as $$select cupidmatch_admin.profile_visitors(p_page)$$;
revoke all on function public.profile_visitors(integer)from public,anon;
grant execute on function public.profile_visitors(integer)to authenticated;

revoke all on function cupidmatch_admin.activity_feature(text)from public,anon,authenticated;
notify pgrst,'reload schema';

-- The definer projects only public member fields, explicitly enforcing caller,
-- suspension, blocking and connection-dependent photo privacy. The exposed view
-- itself uses invoker security; raw profile RLS stays private to owners/staff.
create or replace function cupidmatch_admin.discoverable_profiles()
returns table(id uuid,display_name text,bio text,photo_url text,data_ai_hint text,location text,profession text,country text,region text,languages jsonb,is_verified boolean,additional_photo_urls jsonb,age_years integer,created_at timestamptz,updated_at timestamptz,religion text,height text,education_level text,smoking_habits text,drinking_habits text,relationship_intentions jsonb,values_lifestyle jsonb,cultural_family jsonb,settlement jsonb,extra jsonb)language sql stable security definer set search_path=''
as $$ select 
  p.id,
  p.display_name,
  p.bio,
  case when (p.photo_privacy='members' or(p.photo_privacy='connections'and exists(select 1 from public.connections c where(c.member_a_id=auth.uid()and c.member_b_id=p.id)or(c.member_b_id=auth.uid()and c.member_a_id=p.id)))) then p.photo_url else null::text end as photo_url,
  p.data_ai_hint,
  p.location,
  p.profession,
  p.country,
  p.region,
  p.languages,
  p.is_verified,
  case 
    when (p.photo_privacy='members' or(p.photo_privacy='connections'and exists(select 1 from public.connections c where(c.member_a_id=auth.uid()and c.member_b_id=p.id)or(c.member_b_id=auth.uid()and c.member_a_id=p.id)))) 
    then p.additional_photo_urls 
    else '[]'::jsonb 
  end as additional_photo_urls,
  public.age_from_dob(p.dob) as age_years,
  p.created_at,
  p.updated_at,
  p.religion,
  p.height,
  p.education_level,
  p.smoking_habits,
  p.drinking_habits,
  p.relationship_intentions,
  p.values_lifestyle,
  p.cultural_family,
  p.settlement,
  jsonb_build_object(
    'gender', p.extra->'gender',
    'matchDetails', jsonb_strip_nulls(
      jsonb_build_object(
        'gender', p.extra->'matchDetails'->'gender',
        'maritalStatus', p.extra->'matchDetails'->'maritalStatus',
        'country', p.extra->'matchDetails'->'country',
        'languages', p.extra->'matchDetails'->'languages',
        'education', p.extra->'matchDetails'->'education',
        'height', p.extra->'matchDetails'->'height',
        'wantsChildren', p.extra->'matchDetails'->'wantsChildren',
        'relocation', p.extra->'matchDetails'->'relocation',
        'familyInvolvement', p.extra->'matchDetails'->'familyInvolvement',
        'marriageTimeline', p.extra->'matchDetails'->'marriageTimeline',
        'smoking', p.extra->'matchDetails'->'smoking',
        'drinking', p.extra->'matchDetails'->'drinking'
      )
    )
  ) as extra
from public.profiles p
where auth.uid() is not null and public.member_is_active(auth.uid()) and p.is_admin is not true and p.is_published = true 
  and p.suspended_at is null
  -- Exclude members who have a block relationship with the current user
  and not exists (
    select 1 from public.member_blocks mb
    where (mb.blocker_id = auth.uid() and mb.blocked_id = p.id)
       or (mb.blocker_id = p.id and mb.blocked_id = auth.uid())
  ) $$;
revoke all on function cupidmatch_admin.discoverable_profiles()from public,anon;
grant execute on function cupidmatch_admin.discoverable_profiles()to authenticated;
create or replace view public.discovery_profiles with(security_invoker=true,security_barrier=true)as select * from cupidmatch_admin.discoverable_profiles();
revoke all on public.discovery_profiles from public,anon;
grant select on public.discovery_profiles to authenticated;

create or replace function cupidmatch_admin.own_blocks_list(p_page integer default 1,p_member_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_rows jsonb;v_total bigint;begin
 if auth.uid()is null then raise exception 'Forbidden'using errcode='42501';end if;
 if p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid page'using errcode='22023';end if;
 select count(*)into v_total from public.member_blocks where blocker_id=auth.uid()and(p_member_id is null or blocked_id=p_member_id);
 select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb)into v_rows from(
 select b.id,b.blocked_id,b.created_at,p.display_name from public.member_blocks b join public.profiles p on p.id=b.blocked_id
 where b.blocker_id=auth.uid()and(p_member_id is null or b.blocked_id=p_member_id)order by b.created_at desc,b.id limit 20 offset(p_page-1)*20)q;
 return jsonb_build_object('blocks',v_rows,'total',v_total,'page',p_page,'pageSize',20);
end $$;
revoke all on function cupidmatch_admin.own_blocks_list(integer,uuid)from public,anon;
grant execute on function cupidmatch_admin.own_blocks_list(integer,uuid)to authenticated;
create or replace function public.own_blocks_list(p_page integer default 1,p_member_id uuid default null)
returns jsonb language sql stable security invoker set search_path=''as $$select cupidmatch_admin.own_blocks_list(p_page,p_member_id)$$;
revoke all on function public.own_blocks_list(integer,uuid)from public,anon;
grant execute on function public.own_blocks_list(integer,uuid)to authenticated;
notify pgrst,'reload schema';
