import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = new URL("../supabase/migrations/20261109154645_dashboard_new_matches.sql", import.meta.url);

test("new match migration tracks availability, protects visit state and filters discovery", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create schema private;
    grant usage on schema private, auth to authenticated;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.member', true), '')::uuid $$;
    create function private.account_session_active() returns boolean language sql stable as
      $$ select coalesce(current_setting('test.active', true), 'yes') = 'yes' $$;
    create table public.profiles (
      id uuid primary key, is_published boolean, suspended_at timestamptz,
      deletion_requested_at timestamptz, photo_url text, photo_privacy text, display_name text
    );
    grant update on public.profiles to authenticated;
    create function public.member_is_active(p_id uuid) returns boolean language sql stable as
      $$ select exists(select 1 from public.profiles where id = p_id and suspended_at is null and deletion_requested_at is null) $$;
    create table public.blocks (blocker uuid, blocked uuid);
    create function public.are_blocked(a uuid, b uuid) returns boolean language sql stable as
      $$ select exists(select 1 from public.blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a)) $$;
    create view public.discovery_profiles as
      select id, display_name, case when photo_privacy = 'members' then photo_url end as photo_url
      from public.profiles where is_published and suspended_at is null;
    insert into public.profiles (id, is_published, display_name)
      values ('00000000-0000-0000-0000-000000000001', true, 'Viewer'),
             ('00000000-0000-0000-0000-000000000002', true, 'Existing'),
             ('00000000-0000-0000-0000-000000000003', false, 'Draft');
  `);
  await db.exec(await readFile(migration, "utf8"));
  await db.exec(`
    update public.profiles set display_name = 'Edited', discovery_available_at = now()
      where id = '00000000-0000-0000-0000-000000000002';
    update public.profiles set is_published = true
      where id = '00000000-0000-0000-0000-000000000003';
    insert into public.profiles (id, is_published, photo_url, photo_privacy, display_name)
      values ('00000000-0000-0000-0000-000000000004', true, 'masked', 'connections', 'Private photo'),
             ('00000000-0000-0000-0000-000000000005', true, 'masked', 'hidden', 'Blocked by viewer'),
             ('00000000-0000-0000-0000-000000000006', true, 'masked', 'members', 'Blocked viewer'),
             ('00000000-0000-0000-0000-000000000007', true, 'masked', 'members', 'Suspended'),
             ('00000000-0000-0000-0000-000000000008', true, 'masked', 'members', 'Deletion pending');
    insert into public.blocks values
      ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005'),
      ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001');
    update public.profiles set suspended_at = now() where display_name = 'Suspended';
    update public.profiles set deletion_requested_at = now() where display_name = 'Deletion pending';
  `);

  const candidates = "select available_at::text, member_id, profile from public.dashboard_new_match_candidates('-infinity', 'infinity')";
  await db.exec("set role anon");
  await assert.rejects(db.query(candidates), { code: "42501" });
  await assert.rejects(db.query("select public.dashboard_match_visit()"), { code: "42501" });
  await db.exec("set role authenticated");
  await db.query("select set_config('test.member', $1, false)", ["00000000-0000-0000-0000-000000000001"]);
  const rows = (await db.query(candidates)).rows;
  assert.deepEqual(rows.map(({ profile }) => profile.display_name), ["Private photo", "Draft"]);
  assert.equal(rows[0].profile.photo_url, null);
  const nextPage = await db.query(
    "select * from public.dashboard_new_match_candidates('-infinity', 'infinity', $1, $2)",
    [rows[0].available_at, rows[0].member_id],
  );
  assert.equal(nextPage.rows[0].member_id, rows[1].member_id);
  assert.equal((await db.query("select * from public.dashboard_new_match_candidates(now(), 'infinity')")).rows.length, 0);
  await assert.rejects(db.query("select * from private.dashboard_match_visits"), { code: "42501" });

  const first = (await db.query("select public.dashboard_match_visit() as visit")).rows[0].visit;
  assert.equal(first.previous, null);
  await db.query("select public.dashboard_match_visit($1)", [first.opened]);
  await db.query("select public.dashboard_match_visit('2000-01-01')");
  assert.equal((await db.query("select public.dashboard_match_visit() as visit")).rows[0].visit.previous, first.opened);
  await db.exec("set test.active = 'no'");
  assert.deepEqual((await db.query(candidates)).rows, []);
  await assert.rejects(db.query("select public.dashboard_match_visit()"), { code: "42501" });
  await db.exec("reset role");
  await db.exec("update public.profiles set is_published = false where display_name = 'Draft'");
  assert.equal((await db.query("select discovery_available_at from public.profiles where display_name = 'Draft'")).rows[0].discovery_available_at, null);
  await db.exec("update public.profiles set is_published = true where display_name = 'Draft'");
  assert.ok((await db.query("select discovery_available_at from public.profiles where display_name = 'Draft'")).rows[0].discovery_available_at);
});
