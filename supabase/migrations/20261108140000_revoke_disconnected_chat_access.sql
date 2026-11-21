-- Revoking a connection must also revoke read/update access to old chats.
-- A former participant must not retain API access solely because their ID
-- remains in the chats row.
create or replace function public.is_chat_participant(p_chat_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.chats ch
      join public.connections c
        on c.member_a_id = least(ch.participant_1, ch.participant_2)
       and c.member_b_id = greatest(ch.participant_1, ch.participant_2)
     where ch.id = p_chat_id
       and auth.uid() in (ch.participant_1, ch.participant_2)
  );
$$;

-- Keep all existing grants/policies on messages; their participant helper now
-- also requires an active connection.
drop policy if exists chats_select_participants on public.chats;
create policy chats_select_participants on public.chats
  for select to authenticated
  using (
    auth.uid() in (participant_1, participant_2)
    and exists (
      select 1 from public.connections c
      where c.member_a_id = least(participant_1, participant_2)
        and c.member_b_id = greatest(participant_1, participant_2)
    )
  );

drop policy if exists chats_update_participants on public.chats;
create policy chats_update_participants on public.chats
  for update to authenticated
  using (
    auth.uid() in (participant_1, participant_2)
    and exists (
      select 1 from public.connections c
      where c.member_a_id = least(participant_1, participant_2)
        and c.member_b_id = greatest(participant_1, participant_2)
    )
  )
  with check (
    auth.uid() in (participant_1, participant_2)
    and exists (
      select 1 from public.connections c
      where c.member_a_id = least(participant_1, participant_2)
        and c.member_b_id = greatest(participant_1, participant_2)
    )
  );

revoke all on function public.is_chat_participant(text) from public, anon;
grant execute on function public.is_chat_participant(text) to authenticated;
