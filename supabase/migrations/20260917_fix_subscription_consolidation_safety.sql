-- Follow-up safety migration for installations that only have one of the two
-- historical subscription table variants.
do $$ begin
  if to_regclass('public.user_subscriptions') is not null then
    execute 'update public.user_subscriptions set plan_code = ''premium'' where plan_code = ''plus''';
  end if;
  if to_regclass('public.member_subscriptions') is not null then
    execute 'update public.member_subscriptions set plan_code = ''premium'' where plan_code = ''plus''';
  end if;
end $$;
