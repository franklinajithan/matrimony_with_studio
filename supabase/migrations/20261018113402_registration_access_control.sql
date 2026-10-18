-- Public status is readable; only the audited admin RPC can change it.
create table public.registration_control (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default true,
  message text not null default 'New registrations are temporarily paused. Please check back soon.' check (length(trim(message)) between 1 and 300),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.registration_control enable row level security;
revoke all on public.registration_control from public, anon, authenticated;
grant select on public.registration_control to anon, authenticated;
create policy "registration status is public" on public.registration_control for select to anon, authenticated using (true);
insert into public.registration_control(singleton) values(true);

create or replace function public.set_registration_access(p_enabled boolean, p_message text, p_version integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_row public.registration_control; result_row public.registration_control;
begin
  if auth.uid() is null or public.is_admin() is distinct from true then
    raise exception 'Forbidden' using errcode='42501';
  end if;
  if p_enabled is null or p_version is null or p_message is null or length(trim(p_message)) not between 1 and 300 then
    raise exception 'Invalid registration settings' using errcode='22023';
  end if;
  select * into strict current_row from public.registration_control where singleton for update;
  if current_row.version <> p_version then
    raise exception 'Settings changed. Refresh and try again.' using errcode='40001';
  end if;
  if current_row.enabled = p_enabled and current_row.message = trim(p_message) then return to_jsonb(current_row); end if;
  update public.registration_control set enabled=p_enabled, message=trim(p_message), version=version+1, updated_at=now() where singleton returning * into result_row;
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
    values(auth.uid(), case when p_enabled then 'registration.enabled' else 'registration.paused' end, 'registration_control','site',jsonb_build_object('previous_enabled',current_row.enabled,'enabled',p_enabled,'message',trim(p_message)));
  return to_jsonb(result_row);
end;
$$;
revoke all on function public.set_registration_access(boolean,text,integer) from public, anon;
grant execute on function public.set_registration_access(boolean,text,integer) to authenticated;

-- Enforce at account creation, including direct Auth API calls and OAuth.
-- Existing member sign-ins do not insert auth.users and remain available.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create function app_private.enforce_registration_access()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce((select enabled from public.registration_control where singleton), false) then
    raise exception 'New registrations are temporarily paused.' using errcode='P0001';
  end if;
  return new;
end;
$$;
revoke all on function app_private.enforce_registration_access() from public, anon, authenticated;
create trigger enforce_registration_access before insert on auth.users for each row execute function app_private.enforce_registration_access();
