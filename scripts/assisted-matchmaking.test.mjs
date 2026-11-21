import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const [member, adviser, outsider, candidate, blocked] = [1, 2, 3, 4, 5].map(i => `00000000-0000-0000-0000-00000000000${i}`);

test("assisted matchmaking gates requests, restricts advisers and records member approval", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create schema private;
    grant usage on schema private, auth to authenticated;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.actor', true), '')::uuid $$;
    create function private.account_session_active() returns boolean language sql stable as $$ select true $$;
    create table auth.users (id uuid primary key);
    create table public.profiles (
      id uuid primary key, display_name text, country text, is_admin boolean, is_published boolean default true,
      suspended_at timestamptz, deletion_requested_at timestamptz, extra jsonb default '{}', onboarding_draft jsonb default '{}'
    );
    create function public.member_is_active(p_id uuid) returns boolean language sql stable as
      $$ select exists(select 1 from public.profiles where id = p_id and suspended_at is null) $$;
    create function public.is_admin() returns boolean language sql stable as
      $$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;
    create table public.blocks (blocker_id uuid, blocked_id uuid);
    create table public.admin_audit_log (actor_id uuid, action text, target_type text, target_id text, metadata jsonb);
    insert into auth.users values ('${member}'), ('${adviser}'), ('${outsider}');
    insert into public.profiles (id, display_name, is_admin) values
      ('${member}', 'Member', false), ('${adviser}', 'Adviser', true), ('${outsider}', 'Unassigned administrator', true),
      ('${candidate}', 'Candidate one', false), ('${blocked}', 'Candidate two', false);
    update public.profiles set extra = '{"partnerPreferences":{"countries":["UK"]}}' where id = '${member}';
    insert into public.blocks values ('${blocked}', '${member}');
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/20261109171252_assisted_matchmaking.sql", import.meta.url), "utf8"));
  const asUser = async id => {
    await db.exec("set role authenticated");
    await db.query("select set_config('test.actor', $1, false)", [id]);
  };
  const call = async (action, id = null, note = null, ids = null) =>
    (await db.query("select public.assisted_matchmaking($1,$2,$3,$4) as result", [action, id, note, ids])).rows[0].result;

  await db.exec("set role anon");
  await assert.rejects(call("mine"), { code: "42501" });
  await asUser(member);
  assert.deepEqual(await call("mine"), { available: false, request: null });
  await assert.rejects(call("submit", null, "Please help"), { code: "42501" });
  await db.exec("reset role; update private.assisted_matchmaking_settings set enabled = true");
  await asUser(member);
  assert.equal((await call("mine")).available, false);
  await db.exec("reset role");
  await db.query("insert into private.assisted_matchmaking_advisers values ($1)", [adviser]);
  await asUser(member);
  assert.equal((await call("submit", null, "Please help")).status, "requested");
  await assert.rejects(call("submit", null, "Duplicate"), { code: "23505" });
  const request = (await call("mine")).request.id;
  await assert.rejects(call("curate", request, null, [candidate]), { code: "42501" });
  await asUser(outsider);
  await assert.rejects(call("queue"), { code: "42501" });
  await assert.rejects(call("close", request), { code: "42501" });
  await assert.rejects(db.query("select * from private.assisted_matchmaking_requests"), { code: "42501" });

  await asUser(adviser);
  assert.deepEqual((await call("queue")).requests[0].preferences, { countries: ["UK"] });
  assert.deepEqual((await call("search", request, "Candidate")).map(item => item.id), [candidate]);
  await assert.rejects(call("curate", request, null, [blocked]), { code: "22023" });
  assert.equal((await call("curate", request, null, [candidate])).status, "review_ready");
  await assert.rejects(call("approve", request, null, [candidate]), { code: "42501" });
  await asUser(member);
  assert.equal((await call("mine")).request.shortlist[0].id, candidate);
  await assert.rejects(call("approve", request, null, []), { code: "22023" });
  assert.equal((await call("request_changes", request)).status, "changes_requested");
  await asUser(adviser);
  await call("curate", request, null, [candidate]);
  await asUser(member);
  assert.equal((await call("approve", request, null, [candidate])).status, "approved");
  await db.exec("reset role");
  const audit = (await db.query("select actor_id, metadata from public.admin_audit_log")).rows;
  assert.deepEqual(audit.map(row => [row.actor_id, row.metadata.to]), [
    [member, "requested"], [adviser, "review_ready"], [member, "changes_requested"],
    [adviser, "review_ready"], [member, "approved"],
  ]);
});
