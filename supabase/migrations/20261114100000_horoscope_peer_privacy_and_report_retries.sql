-- Keep legacy exact birth facts accessible only to their owner.
create or replace function public.horoscope_view(p_owner uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare h public.horoscope_profiles; result jsonb;
begin
 if not public.horoscope_can_view(p_owner) then raise exception 'Horoscope unavailable' using errcode='42501'; end if;
 select * into h from public.horoscope_profiles where user_id=p_owner;
 if not found then return null; end if;
 if p_owner=auth.uid() then return to_jsonb(h); end if;
 select coalesce(jsonb_object_agg(key,value),'{}') into result from jsonb_each(h.fields) where key=any(h.shared_fields)
 and key in ('timeQuality','rasi','nakshatra','pada','lagna','ayanamsa','dosha','dasha');
 insert into public.horoscope_audit_events(actor_id,action) values(auth.uid(),'view');
 return jsonb_build_object('user_id',h.user_id,'tradition',h.tradition,'fields',result,'revision',h.revision,'comparison_consent',h.comparison_consent,'ai_consent',h.ai_consent,'updated_at',h.updated_at);
end $$;

-- Reports are derived, and older clients could insert more than one per revision.
delete from public.horoscope_match_reports;
create unique index horoscope_reports_pair_revision
 on public.horoscope_match_reports(requester_id,other_id,requester_revision,other_revision);

create or replace function public.horoscope_store_report(p_other uuid,p_own_revision integer,p_other_revision integer,p_report jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 -- Serialize with profile saves, in a consistent order for reciprocal requests.
 perform pg_advisory_xact_lock(hashtextextended(least(auth.uid(),p_other)::text,0));
 perform pg_advisory_xact_lock(hashtextextended(greatest(auth.uid(),p_other)::text,0));
 if not public.horoscope_report_current(p_other,p_own_revision,p_other_revision) then raise exception 'Permissions changed' using errcode='42501'; end if;
 if p_report->'aiExplanation' is distinct from 'null'::jsonb and (not exists(select 1 from public.horoscope_settings where ai_horoscope_matching_enabled) or (select count(*) from public.horoscope_profiles where user_id in (auth.uid(),p_other) and ai_consent)<>2) then raise exception 'AI consent unavailable' using errcode='42501'; end if;
 insert into public.horoscope_match_reports(requester_id,other_id,requester_revision,other_revision,report) values(auth.uid(),p_other,p_own_revision,p_other_revision,p_report)
 on conflict(requester_id,other_id,requester_revision,other_revision) do update
 set report=excluded.report, expires_at=excluded.expires_at
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.horoscope_delete() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 delete from public.horoscope_match_reports where requester_id=auth.uid() or other_id=auth.uid();
 delete from public.horoscope_profiles where user_id=auth.uid();
 delete from public.horoscope_consents where user_id=auth.uid();
 delete from public.horoscope_documents where owner_id=auth.uid();
 insert into public.horoscope_audit_events(actor_id,action) values(auth.uid(),'delete');
end $$;
