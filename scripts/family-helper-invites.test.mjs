import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const [owner, helper, stranger, selected, unselected] = [1, 2, 3, 4, 5].map(i => `00000000-0000-0000-0000-00000000000${i}`);

test("family access is recipient-bound, revocable, time limited and read only", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create schema private;
    grant usage on schema auth, private to authenticated;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.actor', true), '')::uuid $$;
    create function private.account_session_active() returns boolean language sql stable as
      $$ select coalesce(current_setting('test.active', true), 'yes') = 'yes' $$;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create table public.profiles (
      id uuid primary key, display_name text, dob date, country text,
      is_published boolean, suspended_at timestamptz, deletion_requested_at timestamptz,
      email text, phone text, photo_url text, private_notes text
    );
    create function public.age_from_dob(dob date) returns integer language sql stable as
      $$ select extract(year from age(dob))::integer $$;
    create table public.shortlist (user_id uuid, shortlisted_id uuid, created_at timestamptz default now());
    create table public.blocks (blocker_id uuid, blocked_id uuid);
    alter table public.shortlist enable row level security;
    alter table public.blocks enable row level security;
    insert into auth.users values
      ('${owner}', 'owner@example.test', now()),
      ('${helper}', 'helper@example.test', null),
      ('${stranger}', 'stranger@example.test', now());
    insert into public.profiles (id, display_name, dob, country, is_published, email, phone, photo_url, private_notes) values
      ('${owner}', 'Owner', '1995-04-01', 'UK', false, 'private@example.test', '1234', 'hidden-photo', 'private'),
      ('${stranger}', 'Stranger', '1995-04-01', 'UK', true, null, null, null, null),
      ('${selected}', 'Selected', '1996-04-01', 'UK', true, 'selected@example.test', '4321', 'hidden-photo', 'private'),
      ('${unselected}', 'Unselected', '1997-04-01', 'UK', true, null, null, null, null);
    insert into public.shortlist (user_id, shortlisted_id) values
      ('${owner}', '${selected}'), ('${owner}', '${unselected}'), ('${stranger}', '${unselected}');
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/20261109170722_family_helper_invites.sql", import.meta.url), "utf8"));
  const asUser = async id => {
    await db.exec("set role authenticated");
    await db.query("select set_config('test.actor', $1, false)", [id]);
  };
  const call = async (action, { email = null, ids = null, biodata = false, invite = null, code = null } = {}) =>
    (await db.query("select public.family_helper_invitation($1, $2, $3, $4, $5, $6) as result", [action, email, ids, biodata, invite, code])).rows[0].result;

  await db.exec("set role anon");
  await assert.rejects(call("preview"), { code: "42501" });

  await asUser(owner);
  const preview = await call("preview");
  assert.equal(preview.shortlist.length, 2);
  assert.deepEqual(Object.keys(preview.biodata).sort(), ["age", "country", "name"]);
  await assert.rejects(call("create", { email: "helper@example.test", ids: [stranger] }), { code: "22023" });
  const created = await call("create", { email: "Helper@example.test", ids: [selected], biodata: true });
  assert.match(created.code, /^[a-f0-9]{64}$/);
  const invite = (await call("preview")).invites[0].id;
  await assert.rejects(db.query("select * from private.family_helper_invites"), { code: "42501" });

  await asUser(stranger);
  assert.equal(await call("open", { code: created.code }), null);
  assert.equal(await call("revoke", { invite }), false);
  assert.deepEqual((await call("preview")).shortlist.map(row => row.id), [unselected]);

  await asUser(helper);
  assert.equal(await call("open", { code: created.code }), null);
  await db.exec("reset role");
  await db.query("update auth.users set email_confirmed_at = now() where id = $1", [helper]);
  await asUser(helper);
  const shared = await call("open", { code: created.code });
  assert.deepEqual(Object.keys(shared.shortlist[0]).sort(), ["age", "country", "name"]);
  assert.equal(shared.shortlist[0].name, "Selected");
  assert.equal(shared.biodata.name, "Owner");
  assert.doesNotMatch(JSON.stringify(shared), /private|hidden-photo|Unselected/);
  await db.exec("set test.active = 'no'");
  await assert.rejects(call("open", { code: created.code }), { code: "42501" });
  await db.exec("set test.active = 'yes'; reset role");
  await db.query("insert into public.blocks values ($1, $2)", [selected, helper]);
  await asUser(helper);
  assert.deepEqual((await call("open", { code: created.code })).shortlist, []);
  await asUser(owner);
  assert.equal(await call("revoke", { invite }), true);
  const expiring = await call("create", { email: "helper@example.test", ids: [], biodata: true });
  await asUser(helper);
  assert.equal(await call("open", { code: created.code }), null);
  assert.ok(await call("open", { code: expiring.code }));
  await db.exec("reset role; update private.family_helper_invites set expires_at = now() - interval '1 second'");
  await asUser(helper);
  assert.equal(await call("open", { code: expiring.code }), null);
});
