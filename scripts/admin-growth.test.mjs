import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

function migration(name) {
  return readFileSync(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8");
}

test("growth report preserves ordered funnel counts, billing currencies, and access boundaries", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      grant usage on schema auth to authenticated;
      create schema cron;
      create function cron.schedule(text, text, text) returns integer language sql as 'select 1';
      create table profiles(id uuid primary key, created_at timestamptz, is_admin boolean, is_published boolean);
      create view discovery_profiles as select id from profiles where is_published;
      create table match_requests(sender_id uuid, created_at timestamptz);
      create table connections(member_a_id uuid, member_b_id uuid, connected_at timestamptz);
      create table messages(id uuid primary key default gen_random_uuid(), chat_id text, sender_id uuid, created_at timestamptz);
      create table payment_intents(id uuid primary key, user_id uuid, provider text, status text, plan_code text,
        verified_at timestamptz, billing_term text, currency text, amount_pence integer);
      create table user_subscriptions(id uuid primary key, plan_code text, provider text, status text,
        cancel_at_period_end boolean, current_period_end timestamptz, payment_intent_id uuid);
      grant select on all tables in schema public to service_role;
      grant select on discovery_profiles to authenticated;
    `);
    await db.exec(migration("20261108014500_visitor_activity").split("create extension if not exists pg_cron;")[0]);
    await db.exec(migration("20261112095953_visitor_traffic_summary"));
    await db.exec(migration("20261112130000_admin_growth_operations"));
    const reporter = "00000000-0000-4000-8000-000000000001";
    const reported = "00000000-0000-4000-8000-000000000002";
    await db.exec(`
      create function test_day(days_ago integer) returns timestamptz language sql stable as $$
        select (((now() at time zone 'Europe/London')::date - days_ago)::timestamp + interval '12 hours') at time zone 'Europe/London'
      $$;
      update admin_growth_configuration set started_at = test_day(20);
      insert into admin_daily_traffic
        select (now() at time zone 'Europe/London')::date - n, 2, 3 from generate_series(1, 14) as n
        on conflict (day) do update set visits=excluded.visits, page_views=excluded.page_views;
      insert into profiles values ('${reporter}', test_day(3), false, false), ('${reported}', test_day(9), false, true);
      update profiles set is_published = true where id = '${reporter}';
      update admin_profile_publications set recorded_at = test_day(2) where member_id = '${reporter}';
      insert into visitor_activity(visit_id,page_id,page,browser,source,opened_at) values
        ('${reporter}', gen_random_uuid(), '/', 'Chrome', 'Direct', test_day(2)),
        ('${reported}', gen_random_uuid(), '/', 'Chrome', 'Direct', test_day(3));
      insert into visitor_campaigns values ('${reporter}', 'instagram', 'uk-launch', test_day(2));
      insert into visitor_growth_events values
        ('${reporter}', 'signup_started', test_day(2) + interval '1 minute'),
        ('${reporter}', 'account_created', test_day(2) + interval '2 minutes'),
        ('${reporter}', 'profile_published', test_day(2) + interval '3 minutes'),
        ('${reporter}', 'request_sent', test_day(2) + interval '4 minutes'),
        ('${reported}', 'request_sent', test_day(3) + interval '1 minute');
      insert into match_requests values ('${reporter}', test_day(3));
      insert into connections values ('${reporter}', '${reported}', test_day(2));
      insert into messages(chat_id,sender_id,created_at) values
        ('old', '${reporter}', test_day(10)), ('old', '${reported}', test_day(9)), ('old', '${reported}', test_day(2)),
        ('new', '${reporter}', test_day(3)), ('new', '${reported}', test_day(2));
      insert into payment_intents values
        ('${reporter}', '${reporter}', 'stripe','paid','plus',test_day(3),'three_months','gbp',1200),
        ('${reported}', '${reported}', 'stripe','paid','premium',test_day(3),'monthly','eur',900);
      insert into user_subscriptions values
        ('${reporter}','plus','stripe','active',false,now()+interval '1 month','${reporter}'),
        ('${reported}','premium','stripe','active',false,now()+interval '1 month','${reported}');
      update user_subscriptions set cancel_at_period_end = true where id = '${reporter}';
      update user_subscriptions set cancel_at_period_end = true where id = '${reporter}';
      update admin_subscription_cancellations set recorded_at = test_day(1);
    `);
    await db.exec("set role service_role");
    const getReport = async days => (await db.query("select admin_growth_report($1) as report", [days])).rows[0].report;
    const report = await getReport(7);
    assert.deepEqual(report.funnel, { homepage: 2, signup: 1, account: 1, profile: 1, request: 1 });
    assert.deepEqual(report.campaigns, [{ channel: "instagram", name: "uk-launch", visits: 1, registrations: 1, publications: 1 }]);
    assert.deepEqual(report.comparison, { visits: 14, previous_visits: 14, page_views: 21, previous_page_views: 21,
      registrations: 1, previous_registrations: 1, published: 1, previous_published: 0 });
    assert.equal((await getReport(30)).comparison.previous_visits, null);
    assert.deepEqual(report.engagement, { returning: 1, sent: 1, accepted: 1, first_replies: 1 });
    assert.deepEqual(report.billing, { plus_upgrades: 1, premium_upgrades: 1, cancellations: 1, mrr: [
      { currency: "EUR", subscriptions: 1, minor_units: 900 }, { currency: "GBP", subscriptions: 1, minor_units: 400 },
    ] });

    for (const role of ["anon", "authenticated"]) {
      await db.exec(`reset role; set role ${role}`);
      await assert.rejects(getReport(7), /permission denied/);
      await assert.rejects(db.query("select * from visitor_growth_events"), /permission denied/);
      await assert.rejects(db.query("select * from reports"), /permission denied/);
    }

    await db.exec(`set request.jwt.claim.sub = '${reporter}'`);
    const submit = (from, to) => db.query("insert into reports(reporter_id,reported_id,reason) values ($1,$2,'spam')", [from, to]);
    await assert.rejects(submit(reported, reporter), /row-level security/);
    await submit(reporter, reported);
    await assert.rejects(submit(reporter, reported), /duplicate key/);
    await db.exec("reset role; set role service_role");
    assert.equal((await db.query("select count(*)::integer as total from reports")).rows[0].total, 1);
  } finally {
    await db.close();
  }
});
