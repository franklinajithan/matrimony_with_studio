-- Private planning data is accessible only through authenticated, ownership-checked RPCs.
create table public.member_account_controls (
 member_id uuid primary key references public.profiles(id) on delete cascade,
 deactivated_at timestamptz, deletion_requested_at timestamptz,
 notification_preferences jsonb not null default '{"email":false,"interests":true,"messages":true,"support":true}',
 updated_at timestamptz not null default now()
);
create table public.future_maps (
 member_id uuid primary key references public.profiles(id) on delete cascade,
 plan jsonb not null default '{}', version integer not null default 1, updated_at timestamptz not null default now()
);
create table public.future_map_shares (
 member_id uuid references public.profiles(id) on delete cascade,
 viewer_id uuid references public.profiles(id) on delete cascade, created_at timestamptz not null default now(),
 primary key(member_id,viewer_id),check(member_id<>viewer_id)
);
create table public.family_invitations (
 id uuid primary key default gen_random_uuid(),member_id uuid not null references public.profiles(id) on delete cascade,
 invited_email text not null,helper_id uuid references public.profiles(id) on delete cascade,
 relationship text not null check(relationship in ('parent','sibling','friend','advisor')),
 permissions jsonb not null default '{"viewPlan":false,"suggest":false,"comment":false}',
 status text not null default 'pending' check(status in ('pending','accepted','declined','revoked')),
 expires_at timestamptz not null default now()+interval '7 days',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(member_id is distinct from helper_id)
);
create unique index family_current_email on public.family_invitations(member_id,invited_email) where status in ('pending','accepted');
create index family_helper on public.family_invitations(helper_id,status);
create index family_email on public.family_invitations(invited_email,status);
create table public.family_activity (
 id uuid primary key default gen_random_uuid(),invitation_id uuid not null references public.family_invitations(id) on delete cascade,
 author_id uuid not null references public.profiles(id),kind text not null check(kind in ('comment','suggestion','invited','accepted','declined','revoked','permissions')),
 body text not null default '',target_id uuid references public.profiles(id) on delete set null,created_at timestamptz not null default now()
);
create index family_activity_invitation on public.family_activity(invitation_id,created_at desc);
alter table public.member_account_controls enable row level security;
alter table public.future_maps enable row level security;
alter table public.future_map_shares enable row level security;
alter table public.family_invitations enable row level security;
alter table public.family_activity enable row level security;
revoke all on public.member_account_controls,public.future_maps,public.future_map_shares,public.family_invitations,public.family_activity from public,anon,authenticated;

create or replace function public.member_is_active(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=p_id and p.suspended_at is null and not exists(select 1 from public.member_account_controls a where a.member_id=p.id and (a.deactivated_at is not null or a.deletion_requested_at is not null)))
$$;
revoke all on function public.member_is_active(uuid)from public,anon;
grant execute on function public.member_is_active(uuid)to authenticated;

create function cupidmatch_admin.planning_pair_allowed(p_a uuid,p_b uuid)returns boolean language sql stable security definer set search_path=''as $$
 select public.member_is_active(p_a)and public.member_is_active(p_b)and not exists(select 1 from public.member_blocks where(blocker_id=p_a and blocked_id=p_b)or(blocker_id=p_b and blocked_id=p_a))
$$;
revoke all on function cupidmatch_admin.planning_pair_allowed(uuid,uuid)from public,anon,authenticated;

create function cupidmatch_admin.planning_membership(p_member uuid)returns boolean language sql stable security definer set search_path=''as $$
 select exists(select 1 from public.user_subscriptions s where s.user_id=p_member and s.status in('active','trialing')and s.plan_code in('premium','premium_plus','plus')and s.current_period_start<=now()and s.current_period_end>now()and s.id=(select latest.id from public.user_subscriptions latest where latest.user_id=p_member and latest.status in('active','trialing','past_due','cancelled','expired')order by latest.created_at desc,latest.id limit 1))or exists(select 1 from public.member_trials t where t.user_id=p_member and t.starts_at<=now()and t.ends_at>now())
$$;
revoke all on function cupidmatch_admin.planning_membership(uuid)from public,anon,authenticated;

create function cupidmatch_admin.member_workspace(p_action text,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare v_me uuid:=auth.uid();v_id uuid;v_target uuid;v_inv public.family_invitations%rowtype;v_email text;v_plan jsonb;v_permissions jsonb;v_rows jsonb;v_result jsonb;v_count integer;v_version integer;v_export_table text;v_export_column text;v_export_data jsonb;
begin
 if v_me is null then raise exception 'Sign in required'using errcode='42501';end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>30000 then raise exception 'Invalid input'using errcode='22023';end if;
 -- Paused accounts retain their settings and export, but cannot participate in matching.
 if p_action='account' then
  return coalesce((select to_jsonb(a)-'member_id' from public.member_account_controls a where member_id=v_me),'{"notification_preferences":{"email":false,"interests":true,"messages":true,"support":true}}');
 elsif p_action='preferences' then
  if exists(select 1 from jsonb_object_keys(p_payload)k where k not in('email','interests','messages','support'))or exists(select 1 from jsonb_each(p_payload)e where jsonb_typeof(e.value)<>'boolean')then raise exception 'Invalid preferences'using errcode='22023';end if;
  insert into public.member_account_controls(member_id,notification_preferences)values(v_me,'{"email":false,"interests":true,"messages":true,"support":true}'::jsonb||p_payload)on conflict(member_id)do update set notification_preferences=public.member_account_controls.notification_preferences||p_payload,updated_at=clock_timestamp();return jsonb_build_object('saved',true);
 elsif p_action in('deactivate','reactivate','request_deletion','cancel_deletion') then
  if p_action='request_deletion'and (p_payload->>'confirmation')is distinct from'DELETE'then raise exception 'Confirmation required'using errcode='22023';end if;
  if exists(select 1 from public.profiles where id=v_me and is_admin)or exists(select 1 from public.admin_staff where user_id=v_me)then raise exception 'Staff must transfer or revoke privileged access before account closure'using errcode='42501';end if;
  insert into public.member_account_controls(member_id)values(v_me)on conflict do nothing;
  update public.member_account_controls set
   deactivated_at=case when p_action in('deactivate','request_deletion')then now()when p_action='reactivate'and deletion_requested_at is null then null else deactivated_at end,
   deletion_requested_at=case when p_action='request_deletion'then now()when p_action='cancel_deletion'then null else deletion_requested_at end,updated_at=clock_timestamp()where member_id=v_me;
  return jsonb_build_object('saved',true);
 elsif p_action='export' then
  select jsonb_build_object('exportedAt',now(),'profile',to_jsonb(p)-'is_admin'-'suspension_reason','settings',(select to_jsonb(a)-'member_id'from public.member_account_controls a where member_id=v_me),'futureMap',(select to_jsonb(f)from public.future_maps f where member_id=v_me),'familyInvitations',coalesce((select jsonb_agg(to_jsonb(i))from public.family_invitations i where member_id=v_me),'[]'),'supportTickets',coalesce((select jsonb_agg(to_jsonb(t))from public.support_tickets t where member_id=v_me),'[]'),'supportMessages',coalesce((select jsonb_agg(to_jsonb(m))from public.support_messages m join public.support_tickets t on t.id=m.ticket_id where t.member_id=v_me),'[]'))into v_result from public.profiles p where id=v_me;
  for v_export_table,v_export_column in select * from(values('biodata_documents','owner_id'),('biodata_share_links','owner_id'),('messages','sender_id'),('match_requests','sender_id'),('member_notices','member_id'),('profile_share_links','owner_id'))as q(table_name,column_name)loop
   if to_regclass('public.'||v_export_table)is not null then
    execute format('select coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb)from public.%I t where %I=$1',v_export_table,v_export_column)into v_export_data using v_me;
    v_result:=v_result||jsonb_build_object(v_export_table,v_export_data);
   end if;
  end loop;
  return v_result;
 end if;
 if not public.member_is_active(v_me)then raise exception 'Account is inactive'using errcode='42501';end if;
 if p_action='plan_list' then
  return jsonb_build_object('own',(select to_jsonb(f)from public.future_maps f where member_id=v_me),'shares',coalesce((select jsonb_agg(jsonb_build_object('viewer_id',s.viewer_id,'name',p.display_name))from public.future_map_shares s join public.profiles p on p.id=s.viewer_id where s.member_id=v_me),'[]'),'sharedWithMe',coalesce((select jsonb_agg(jsonb_build_object('member_id',s.member_id,'name',p.display_name,'plan',f.plan,'version',f.version))from public.future_map_shares s join public.profiles p on p.id=s.member_id join public.future_maps f on f.member_id=s.member_id where s.viewer_id=v_me and cupidmatch_admin.planning_pair_allowed(v_me,s.member_id)and exists(select 1 from public.connections c where(c.member_a_id=v_me and c.member_b_id=s.member_id)or(c.member_b_id=v_me and c.member_a_id=s.member_id))),'[]'));
 elsif p_action='plan_save' then
  v_plan:=p_payload->'plan';v_version:=(p_payload->>'version')::integer;
  if v_plan is null or jsonb_typeof(v_plan)<>'object'or octet_length(v_plan::text)>18000 or v_version is null or v_version<0 then raise exception 'Invalid plan'using errcode='22023';end if;
  if exists(select 1 from jsonb_object_keys(v_plan)k where k not in('currentLocation','futureLocation','relocation','longDistance','career','family','timeline','milestones'))then raise exception 'Unknown plan field'using errcode='22023';end if;
  if exists(select 1 from jsonb_each(v_plan)e where e.key<>'milestones'and(jsonb_typeof(e.value)<>'string'or length(e.value#>>'{}')>1000))then raise exception 'Invalid plan value'using errcode='22023';end if;
  if v_plan?'milestones'then
   if jsonb_typeof(v_plan->'milestones')<>'array'then raise exception 'Invalid milestones'using errcode='22023';end if;
   if jsonb_array_length(v_plan->'milestones')>12 or exists(select 1 from jsonb_array_elements(v_plan->'milestones')m where jsonb_typeof(m)<>'object'or length(m->>'title')not between 1 and 150 or m->>'title'is null or jsonb_typeof(m->'done')is distinct from'boolean')then raise exception 'Invalid milestones'using errcode='22023';end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_me::text,801));
  select version into v_count from public.future_maps where member_id=v_me;
  if coalesce(v_count,0)<>v_version then raise exception 'Plan changed; refresh before saving'using errcode='40001';end if;
  insert into public.future_maps(member_id,plan)values(v_me,v_plan)on conflict(member_id)do update set plan=excluded.plan,version=public.future_maps.version+1,updated_at=clock_timestamp();return jsonb_build_object('saved',true);
 elsif p_action in('plan_share','plan_unshare')then
  v_target:=(p_payload->>'viewerId')::uuid;
  if v_target is null or v_target=v_me then raise exception 'Choose a connection'using errcode='22023';end if;
  if p_action='plan_unshare'then delete from public.future_map_shares where member_id=v_me and viewer_id=v_target;else
   if not cupidmatch_admin.planning_pair_allowed(v_me,v_target)or not exists(select 1 from public.connections where(member_a_id=v_me and member_b_id=v_target)or(member_b_id=v_me and member_a_id=v_target))then raise exception 'Active connection required'using errcode='42501';end if;
   insert into public.future_map_shares(member_id,viewer_id)values(v_me,v_target)on conflict do nothing;
  end if;return jsonb_build_object('saved',true);
 elsif p_action='family_list'then
  select lower(email)into v_email from auth.users where id=v_me;
  select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'member_id',i.member_id,'name',p.display_name,'invited_email',case when i.member_id=v_me then i.invited_email else null end,'relationship',i.relationship,'permissions',i.permissions,'status',case when i.status='pending'and i.expires_at<=now()then'expired'else i.status end,'expires_at',i.expires_at,'owner',i.member_id=v_me,'plan',case when i.helper_id=v_me and i.status='accepted'and coalesce((i.permissions->>'viewPlan')::boolean,false)and cupidmatch_admin.planning_membership(i.member_id)and cupidmatch_admin.planning_pair_allowed(v_me,i.member_id)then(select plan from public.future_maps where member_id=i.member_id)else null end)),'[]')into v_rows from public.family_invitations i join public.profiles p on p.id=i.member_id where(i.member_id=v_me or i.helper_id=v_me or(i.invited_email=v_email and i.status='pending'and i.expires_at>now()))and(i.member_id=v_me or cupidmatch_admin.planning_pair_allowed(v_me,i.member_id));
  -- Owner entitlements, not the helper's, govern ongoing participation.
  return jsonb_build_object('invitations',v_rows,'canInvite',cupidmatch_admin.activity_feature('visitors'));
 elsif p_action='family_invite'then
  if not cupidmatch_admin.activity_feature('visitors')then raise exception 'Premium membership required'using errcode='42501';end if;
  v_email:=lower(trim(p_payload->>'email'));v_permissions:=p_payload->'permissions';
  if v_email is null or v_email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'or length(v_email)>254 or p_payload->>'relationship'is null or p_payload->>'relationship'not in('parent','sibling','friend','advisor')then raise exception 'Invalid invitation'using errcode='22023';end if;
  if v_permissions is null or jsonb_typeof(v_permissions)<>'object'or exists(select 1 from jsonb_object_keys(v_permissions)k where k not in('viewPlan','suggest','comment'))or exists(select 1 from jsonb_each(v_permissions)e where jsonb_typeof(e.value)<>'boolean')then raise exception 'Invalid permissions'using errcode='22023';end if;
  if exists(select 1 from auth.users where id=v_me and lower(email)=v_email)then raise exception 'Cannot invite yourself'using errcode='22023';end if;
  perform pg_advisory_xact_lock(hashtextextended(v_me::text,802));
  update public.family_invitations set status='revoked',updated_at=now()where member_id=v_me and status='pending'and expires_at<=now();
  if(select count(*)from public.family_invitations where member_id=v_me and status in('pending','accepted'))>=5 or(select count(*)from public.family_invitations where member_id=v_me and created_at>now()-interval '24 hours')>=10 then raise exception 'Invitation limit reached'using errcode='22023';end if;
  insert into public.family_invitations(member_id,invited_email,relationship,permissions)values(v_me,v_email,p_payload->>'relationship',v_permissions)returning id into v_id;
  insert into public.family_activity(invitation_id,author_id,kind)values(v_id,v_me,'invited');return jsonb_build_object('id',v_id);
 elsif p_action in('family_respond','family_revoke','family_permissions','family_post','family_activity')then
  v_id:=(p_payload->>'id')::uuid;
  select * into v_inv from public.family_invitations where id=v_id for update;
  if not found then raise exception 'Invitation not found'using errcode='P0002';end if;
  if p_action='family_respond'then
   if v_inv.member_id=v_me or v_inv.status<>'pending'or v_inv.expires_at<=now()or not exists(select 1 from auth.users where id=v_me and email_confirmed_at is not null and lower(email)=v_inv.invited_email)or not cupidmatch_admin.planning_pair_allowed(v_me,v_inv.member_id)then raise exception 'Invitation unavailable'using errcode='42501';end if;
   if p_payload->>'response'is null or p_payload->>'response'not in('accepted','declined')then raise exception 'Invalid response'using errcode='22023';end if;
   update public.family_invitations set status=p_payload->>'response',helper_id=v_me,updated_at=now()where id=v_id;
   insert into public.family_activity(invitation_id,author_id,kind)values(v_id,v_me,p_payload->>'response');return jsonb_build_object('saved',true);
  elsif p_action='family_revoke'then
   if v_inv.member_id<>v_me and v_inv.helper_id is distinct from v_me then raise exception 'Forbidden'using errcode='42501';end if;
   update public.family_invitations set status='revoked',updated_at=now()where id=v_id;
   insert into public.family_activity(invitation_id,author_id,kind)values(v_id,v_me,'revoked');return jsonb_build_object('saved',true);
  elsif p_action='family_permissions'then
   if v_inv.member_id<>v_me then raise exception 'Forbidden'using errcode='42501';end if;
   v_permissions:=p_payload->'permissions';
   if v_permissions is null or jsonb_typeof(v_permissions)<>'object'or exists(select 1 from jsonb_object_keys(v_permissions)k where k not in('viewPlan','suggest','comment'))or exists(select 1 from jsonb_each(v_permissions)e where jsonb_typeof(e.value)<>'boolean')then raise exception 'Invalid permissions'using errcode='22023';end if;
   update public.family_invitations set permissions=v_permissions,updated_at=now()where id=v_id;
   insert into public.family_activity(invitation_id,author_id,kind)values(v_id,v_me,'permissions');return jsonb_build_object('saved',true);
  end if;
  if v_inv.status<>'accepted'or(v_inv.member_id<>v_me and v_inv.helper_id is distinct from v_me)or not cupidmatch_admin.planning_pair_allowed(v_inv.member_id,v_inv.helper_id)then raise exception 'Access revoked'using errcode='42501';end if;
  -- Check membership for the owner without switching auth.uid or trusting client claims.
  if not cupidmatch_admin.planning_membership(v_inv.member_id)then raise exception 'Member plan expired'using errcode='42501';end if;
  if p_action='family_activity'then
   select coalesce(jsonb_agg(to_jsonb(q)),'[]')into v_rows from(select a.id,a.kind,a.body,a.author_id,a.created_at,case when a.target_id is not null and cupidmatch_admin.planning_pair_allowed(v_me,a.target_id)and cupidmatch_admin.planning_pair_allowed(v_inv.member_id,a.target_id)and exists(select 1 from public.profiles where id=a.target_id and is_published)then a.target_id else null end as target_id from public.family_activity a where invitation_id=v_id order by created_at desc,id limit 100)q;return jsonb_build_object('activity',v_rows);
  end if;
  if p_payload->>'kind'is null or p_payload->>'kind'not in('comment','suggestion')or p_payload->>'body'is null or length(trim(p_payload->>'body'))not between 1 and 2000 then raise exception 'Invalid contribution'using errcode='22023';end if;
  if v_inv.helper_id=v_me and not coalesce((v_inv.permissions->>case when p_payload->>'kind'='comment'then'comment'else'suggest'end)::boolean,false)then raise exception 'Permission required'using errcode='42501';end if;
  if p_payload->>'kind'='suggestion'then
   v_target:=(p_payload->>'targetId')::uuid;
   if v_target is null or v_target in(v_me,v_inv.member_id)or not cupidmatch_admin.planning_pair_allowed(v_me,v_target)or not cupidmatch_admin.planning_pair_allowed(v_inv.member_id,v_target)or not exists(select 1 from public.profiles where id=v_target and is_published and is_admin is not true)then raise exception 'Profile unavailable'using errcode='42501';end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_me::text,803));
  if(select count(*)from public.family_activity where author_id=v_me and created_at>now()-interval '1 hour')>=30 then raise exception 'Please try again later'using errcode='22023';end if;
  insert into public.family_activity(invitation_id,author_id,kind,body,target_id)values(v_id,v_me,p_payload->>'kind',trim(p_payload->>'body'),v_target);return jsonb_build_object('saved',true);
 end if;
 raise exception 'Unknown action'using errcode='22023';
end $$;
revoke all on function cupidmatch_admin.member_workspace(text,jsonb)from public,anon;
grant execute on function cupidmatch_admin.member_workspace(text,jsonb)to authenticated;
create function public.member_workspace(p_action text,p_payload jsonb default '{}')returns jsonb language sql security invoker set search_path=''as $$select cupidmatch_admin.member_workspace(p_action,p_payload)$$;
revoke all on function public.member_workspace(text,jsonb)from public,anon;
grant execute on function public.member_workspace(text,jsonb)to authenticated;

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
  and p.suspended_at is null and public.member_is_active(p.id)
  -- Exclude members who have a block relationship with the current user
  and not exists (
    select 1 from public.member_blocks mb
    where (mb.blocker_id = auth.uid() and mb.blocked_id = p.id)
       or (mb.blocker_id = p.id and mb.blocked_id = auth.uid())
  ) $$;

create or replace function cupidmatch_admin.activity_feature(p_feature text)
returns boolean language sql stable security definer set search_path=''
as $$ select auth.uid() is not null and (
 exists(select 1 from public.user_subscriptions s where s.user_id=auth.uid() and s.status in ('active','trialing') and s.current_period_start<=now() and s.current_period_end>now() and s.id=(select latest.id from public.user_subscriptions latest where latest.user_id=auth.uid()and latest.status in ('active','trialing','past_due','cancelled','expired')order by latest.created_at desc,latest.id limit 1)
 and ((p_feature='visitors' and s.plan_code in ('premium','premium_plus','plus'))or(p_feature='incognito' and s.plan_code='premium_plus')))
 or(p_feature='visitors' and exists(select 1 from public.member_trials t where t.user_id=auth.uid() and t.starts_at<=now() and t.ends_at>now()))) $$;


create or replace function cupidmatch_admin.record_profile_visit(p_viewed_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$ begin
 if auth.uid() is null or not public.member_is_active(auth.uid())then raise exception 'Forbidden' using errcode='42501';end if;
 if p_viewed_id is null or p_viewed_id=auth.uid() or public.is_admin() or exists(select 1 from public.admin_staff where user_id=auth.uid())then return false;end if;
 if not public.member_is_active(auth.uid())or not public.member_is_active(p_viewed_id)or not exists(select 1 from public.profiles where id=p_viewed_id and is_published is true and suspended_at is null and is_admin is not true)then return false;end if;
 if public.is_blocked_between(auth.uid(),p_viewed_id)then return false;end if;
 if cupidmatch_admin.activity_feature('incognito')and exists(select 1 from public.profile_activity_preferences where member_id=auth.uid()and incognito)then return false;end if;
 insert into public.profile_visits(viewed_id,viewer_id)values(p_viewed_id,auth.uid())on conflict(viewed_id,viewer_id)do update set viewed_at=excluded.viewed_at where public.profile_visits.viewed_at<now()-interval '5 minutes';
 delete from public.profile_visits where viewed_id=p_viewed_id and viewed_at<now()-interval '90 days';
 return true;
end $$;

create or replace function cupidmatch_admin.profile_visitors(p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path=''
as $$ declare v_rows jsonb;v_total bigint;begin
 if auth.uid() is null or not public.member_is_active(auth.uid())then raise exception 'Forbidden' using errcode='42501';end if;
 if p_page is null or p_page not between 1 and 100000 then raise exception 'Invalid page' using errcode='22023';end if;
 if not cupidmatch_admin.activity_feature('visitors')then return jsonb_build_object('locked',true,'viewers','[]'::jsonb,'total',0);end if;
 select count(*)into v_total from public.profile_visits v join public.profiles p on p.id=v.viewer_id where v.viewed_id=auth.uid()and v.viewed_at>now()-interval '90 days'and p.is_published is true and p.suspended_at is null and public.member_is_active(p.id)and not public.is_blocked_between(auth.uid(),v.viewer_id);
 select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb)into v_rows from(
 select p.id,p.display_name,v.viewed_at,
 case when p.photo_privacy='members'or(p.photo_privacy='connections'and exists(select 1 from public.connections c where(c.member_a_id=auth.uid()and c.member_b_id=p.id)or(c.member_b_id=auth.uid()and c.member_a_id=p.id)))then p.photo_url else null end as photo_url
 from public.profile_visits v join public.profiles p on p.id=v.viewer_id where v.viewed_id=auth.uid()and v.viewed_at>now()-interval '90 days'and p.is_published is true and p.suspended_at is null and public.member_is_active(p.id)and not public.is_blocked_between(auth.uid(),v.viewer_id)
 order by v.viewed_at desc,p.id limit 20 offset(p_page-1)*20)q;
 return jsonb_build_object('locked',false,'viewers',v_rows,'total',v_total,'page',p_page,'pageSize',20);
end $$;
