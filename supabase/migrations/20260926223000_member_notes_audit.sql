create table if not exists public.member_admin_notes (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.profiles(id) on delete cascade,
 author_id uuid not null references auth.users(id),
 note text not null check (length(trim(note)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists member_admin_notes_member_created_idx on public.member_admin_notes(member_id,created_at desc);
alter table public.member_admin_notes enable row level security;
revoke all on public.member_admin_notes from anon,authenticated;
grant select,insert on public.member_admin_notes to authenticated;
drop policy if exists admin_read_notes on public.member_admin_notes;
drop policy if exists admin_write_notes on public.member_admin_notes;
create policy admin_read_notes on public.member_admin_notes for select to authenticated using (public.is_admin());
create policy admin_write_notes on public.member_admin_notes for insert to authenticated with check (public.is_admin() and author_id=auth.uid());
create or replace function public.audit_member_admin_note() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(new.author_id,'member_note_added','profile',new.member_id::text,jsonb_build_object('note_id',new.id));
 return new;
end $$;
drop trigger if exists audit_member_admin_note_trigger on public.member_admin_notes;
create trigger audit_member_admin_note_trigger after insert on public.member_admin_notes for each row execute function public.audit_member_admin_note();