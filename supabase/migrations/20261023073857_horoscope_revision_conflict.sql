-- Optimistic-lock conflicts are business conflicts, not retriable serialization failures.
-- Preserve the installed function's ownership checks and any cohort rollout guards.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.horoscope_save(jsonb)'::regprocedure) into definition;
  if position('errcode=''PT409''' in definition) > 0 then return; end if;
  if position('errcode=''40001''' in definition) = 0 then
    raise exception 'Unexpected horoscope revision-conflict definition';
  end if;
  execute replace(definition, 'errcode=''40001''', 'errcode=''PT409''');
end $$;
