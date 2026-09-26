-- Atomic profile-review decisions. Approval here is NOT identity-document verification.
create or replace function public.review_profile_verification_request(p_request_id uuid, p_decision text, p_reviewer_note text default '')
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_request public.verification_requests%rowtype;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_decision not in ('approved','rejected') or p_reviewer_note is null or char_length(p_reviewer_note)>1000 then
   raise exception 'Invalid review decision' using errcode='22023';
 end if;
 select * into v_request from public.verification_requests where id=p_request_id for update;
 if not found then raise exception 'Request not found' using errcode='P0002'; end if;
 if v_request.status <> 'pending' then raise exception 'Request already reviewed' using errcode='23505'; end if;
 update public.verification_requests set status=p_decision,reviewer_id=auth.uid(),reviewer_note=p_reviewer_note,reviewed_at=now()
 where id=p_request_id;
 insert into public.admin_audit_log(actor_id,action,target_type,target_id,metadata)
 values(auth.uid(),'profile_review_'||p_decision,'verification_request',p_request_id::text,
 jsonb_build_object('member_id',v_request.member_id));
 return jsonb_build_object('id',p_request_id,'status',p_decision);
end;
$$;
revoke all on function public.review_profile_verification_request(uuid,text,text) from public,anon;
grant execute on function public.review_profile_verification_request(uuid,text,text) to authenticated;