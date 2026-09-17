create or replace function public.consume_subscription_usage(p_feature_key text, p_limit integer)
returns table(allowed boolean, used_count integer)
language plpgsql security definer set search_path=public
as $$ declare v_user uuid:=auth.uid(); v_period date:=date_trunc('month',now())::date; v_used integer;
begin
 if v_user is null then raise exception 'not authenticated'; end if;
 if p_feature_key not in ('interestsPerMonth','profileSharesPerMonth','biodataTemplates','profileBoostsPerMonth') then raise exception 'invalid feature'; end if;
 if p_limit is not null and p_limit < 0 then raise exception 'invalid limit'; end if;
 insert into public.subscription_usage(user_id,feature_key,period_start,used_count) values(v_user,p_feature_key,v_period,0) on conflict(user_id,feature_key,period_start) do nothing;
 select s.used_count into v_used from public.subscription_usage s where s.user_id=v_user and s.feature_key=p_feature_key and s.period_start=v_period for update;
 if p_limit is not null and v_used>=p_limit then return query select false,v_used; return; end if;
 update public.subscription_usage set used_count=used_count+1,updated_at=now() where user_id=v_user and feature_key=p_feature_key and period_start=v_period returning subscription_usage.used_count into v_used;
 return query select true,v_used;
end $$;
revoke all on function public.consume_subscription_usage(text,integer) from public;
grant execute on function public.consume_subscription_usage(text,integer) to authenticated;
