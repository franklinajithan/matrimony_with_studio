-- Only one current paid/trial membership per member. Pending checkout attempts may coexist.
create unique index if not exists member_subscriptions_one_current
on public.member_subscriptions(user_id)
where status = 'active';
