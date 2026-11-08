import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("visit analytics aggregates distinct page views and blocks public reads", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
    const migration = readFileSync(new URL("../supabase/migrations/20261108014500_visitor_activity.sql", import.meta.url), "utf8");
    // The local database does not provide the managed pg_cron extension.
    await db.exec(migration.split("create extension if not exists pg_cron;")[0]);
    await db.exec("set role service_role");
    const visit = "00000000-0000-4000-8000-000000000001";
    const landing = "00000000-0000-4000-8000-000000000002";
    const next = "00000000-0000-4000-8000-000000000003";
    const record = (view, page, seconds) => db.query(
      "select record_visitor_activity($1, $2, $3, 'GB', 'Chrome', 'Google', $4)",
      [visit, view, page, seconds],
    );
    await record(landing, "/", 0);
    await record(landing, "/", 15);
    await record(landing, "/", 0);
    await record(next, "/pricing", 0);
    const { rows } = await db.query("select * from visitor_visit_list(0)");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].page_views, 2);
    assert.equal(rows[0].landing_page, "/");
    assert.equal(rows[0].source, "Google");
    assert.ok(rows[0].active_seconds > 0 && rows[0].active_seconds < 15);
    for (const role of ["anon", "authenticated"]) {
      await db.exec("reset role; set role " + role);
      await assert.rejects(db.query("select * from visitor_activity"), /permission denied/);
      await assert.rejects(db.query("select * from visitor_visit_list(0)"), /permission denied/);
      await assert.rejects(record(next, "/pricing", 0), /permission denied/);
    }
  } finally {
    await db.close();
  }
});
