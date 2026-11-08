create table public.feedback_threads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references auth.users(id) on delete cascade,
  guest_email text,
  category text not null check (category in ('Feedback', 'Technical issue', 'General enquiry')),
  subject text not null check (length(btrim(subject)) between 1 and 120),
  body text not null check (length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  awaiting_support boolean not null default true,
  check ((member_id is null) <> (guest_email is null)),
  check (guest_email is null or length(guest_email) between 3 and 254)
);

create index feedback_member_recent on public.feedback_threads (member_id, updated_at desc, id);
create index feedback_guest_submissions on public.feedback_threads (guest_email, created_at desc);
create index feedback_inbox_order on public.feedback_threads (awaiting_support desc, updated_at desc, id);

create table public.feedback_replies (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.feedback_threads(id) on delete cascade,
  from_support boolean not null,
  body text not null check (length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index feedback_thread_replies on public.feedback_replies (thread_id, id);

alter table public.feedback_threads enable row level security;
alter table public.feedback_replies enable row level security;
revoke all on public.feedback_threads, public.feedback_replies from public, anon, authenticated;
grant select, insert, update on public.feedback_threads, public.feedback_replies to service_role;

create function public.open_feedback_thread(
  p_member uuid, p_email text, p_category text, p_subject text, p_body text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  thread_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    coalesce(p_member::text, p_email), 0
  ));
  if (select count(*) from public.feedback_threads
      where (member_id = p_member or guest_email = p_email)
      and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Feedback submission limit reached' using errcode = 'P0001';
  end if;
  insert into public.feedback_threads (member_id, guest_email, category, subject, body)
  values (p_member, p_email, p_category, p_subject, p_body)
  returning id into thread_id;
  return thread_id;
end;
$$;

create function public.reply_to_feedback(
  p_thread uuid, p_member uuid, p_support boolean, p_body text
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update public.feedback_threads
    set updated_at = clock_timestamp(), awaiting_support = not p_support
    where id = p_thread and member_id is not null
      and (p_support or member_id = p_member);
  if not found then
    return false;
  end if;
  insert into public.feedback_replies (thread_id, from_support, body)
  values (p_thread, p_support, p_body);
  return true;
end;
$$;

revoke all on function public.open_feedback_thread(uuid, text, text, text, text),
  public.reply_to_feedback(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.open_feedback_thread(uuid, text, text, text, text),
  public.reply_to_feedback(uuid, uuid, boolean, text) to service_role;
