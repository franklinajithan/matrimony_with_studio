import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const read = name => readFileSync(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8");

test("acquisition counts one entry per visit and filters journeys by traffic channel", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema cron;
      create function cron.schedule(text,text,text) returns integer language sql as 'select 1';
    `);
    await db.exec(read("20261108014500_visitor_activity").split("create extension if not exists pg_cron;")[0]);
    await db.exec(read("20261112143000_visitor_acquisition_report"));
    const google = "00000000-0000-4000-8000-000000000001";
    const referral = "00000000-0000-4000-8000-000000000002";
    const direct = "00000000-0000-4000-8000-000000000003";
    const old = "00000000-0000-4000-8000-000000000004";
    await db.exec(`
      insert into visitor_referrers(visit_id,domain,engine) values
        ('${google}','google.co.uk','Google'), ('${referral}','facebook.com',null);
      insert into visitor_activity (visit_id,page_id,page,browser,source,opened_at) values
        ('${google}',gen_random_uuid(),'/','Chrome','Google',now()-interval '24 hours'),
        ('${google}',gen_random_uuid(),'/signup','Chrome','Google',now()-interval '23 hours 59 minutes'),
        ('${referral}',gen_random_uuid(),'/pricing','Chrome','Social',now()-interval '24 hours'),
        ('${direct}',gen_random_uuid(),'/','Chrome','Direct',now()-interval '24 hours'),
        ('${old}',gen_random_uuid(),'/about','Chrome','Bing',now()-interval '24 hours');
    `);
    await db.exec("set role service_role");
    const get = async channel => (await db.query("select visitor_acquisition_report(7,$1) as report", [channel])).rows[0].report;
    const all = await get("all");
    assert.deepEqual(all.totals, { visits: 4, search: 2, referrals: 1, unattributed: 1 });
    assert.equal(all.daily.length, 7);
    assert.deepEqual((await get("referrals")).sources, [{ name: "facebook.com", channel: "referrals", visits: 1 }]);
    const search = await get("search");
    assert.equal(search.selected_visits, 2);
    assert.deepEqual(search.next_pages, [{ landing: "/", next: "/signup", visits: 1 }]);
    assert.deepEqual(search.landing.find(row => row.page === "/"), { page: "/", visits: 1, continued: 1 });
    for (const role of ["anon", "authenticated"]) {
      await db.exec("reset role; set role " + role);
      await assert.rejects(get("all"), /permission denied/);
      await assert.rejects(db.query("select * from visitor_referrers"), /permission denied/);
    }
  } finally {
    await db.close();
  }
});
