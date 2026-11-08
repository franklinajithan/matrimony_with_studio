-- Standalone PostgreSQL 17 fixture. NEVER run on a Supabase project.
-- CI runs this against an ephemeral Postgres service.
create schema auth;
create role authenticated nologin;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
grant usage on schema public,auth to authenticated;
grant execute on function auth.uid() to authenticated;

create table public.match_requests (
  id text primary key,
  sender_id uuid not null,
  receiver_id uuid not null,
  status text not null check (status in ('pending','accepted','withdrawn','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  member_a_id uuid not null,
  member_b_id uuid not null,
  created_from_request_id text,
  connected_at timestamptz not null default now(),
  unique (member_a_id,member_b_id),
  check(member_a_id < member_b_id)
);
create table public.chats (
  id text primary key,
  participant_1 uuid,
  participant_2 uuid,
  participant_details jsonb not null default '{}'::jsonb,
  unread_by jsonb not null default '{}'::jsonb,
  last_message_text text,
  created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null references public.chats(id),
  sender_id uuid not null,
  text text not null,
  created_at timestamptz not null default now()
);
grant select,insert,update,delete on all tables in schema public to authenticated;
alter table public.match_requests enable row level security;
alter table public.connections enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

create policy match_requests_select_involved on public.match_requests for select to authenticated
  using (sender_id=auth.uid() or receiver_id=auth.uid());
create policy match_requests_update_participants on public.match_requests for update to authenticated
  using (sender_id=auth.uid() or receiver_id=auth.uid())
  with check(sender_id=auth.uid() or receiver_id=auth.uid());
create policy connections_select_involved on public.connections for select to authenticated
  using(member_a_id=auth.uid() or member_b_id=auth.uid());
create policy connections_insert_involved on public.connections for insert to authenticated
  with check((member_a_id=auth.uid() or member_b_id=auth.uid()) and member_a_id<member_b_id);
create policy connections_delete_involved on public.connections for delete to authenticated
  using(member_a_id=auth.uid() or member_b_id=auth.uid());
create policy chats_insert_participants on public.chats for insert to authenticated
  with check(participant_1=auth.uid() or participant_2=auth.uid());
create policy chats_select_participants on public.chats for select to authenticated
  using(participant_1=auth.uid() or participant_2=auth.uid());
create policy chats_update_participants on public.chats for update to authenticated
  using(participant_1=auth.uid() or participant_2=auth.uid())
  with check(participant_1=auth.uid() or participant_2=auth.uid());

create or replace function public.is_chat_participant(p_chat_id text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (select 1 from public.chats c where c.id=p_chat_id
     and auth.uid() in (c.participant_1,c.participant_2));
$$;
create policy messages_select_participants on public.messages for select to authenticated
  using(public.is_chat_participant(chat_id));
create policy messages_insert_participants on public.messages for insert to authenticated
  with check(sender_id=auth.uid() and public.is_chat_participant(chat_id));

insert into public.match_requests(id,sender_id,receiver_id,status) values
('qa-request-ab','00000000-0000-4000-8000-00000000000a','00000000-0000-4000-8000-00000000000b','pending');
