import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
const db = new PGlite();
const a = "10000000-0000-4000-8000-000000000001",
  b = "10000000-0000-4000-8000-000000000002";
const payload = (revision = 0, visibility = "private") => ({
  revision,
  tradition: "tamil",
  visibility,
  fields: {
    dateOfBirth: "1990-06-15",
    timeQuality: "unknown",
    birthCity: "London",
    birthCountry: "UK",
    timezone: "Europe/London",
    language: "Tamil",
    rasi: "Mesha",
    nakshatra: "Ashwini",
  },
  shared_fields: ["rasi", "nakshatra", "timeQuality"],
  comparison_consent: true,
  ai_consent: false,
  planets: [],
});
async function actor(id, role = "authenticated") {
  await db.exec(
    `reset role;select set_config('request.jwt.claim.sub','${id || ""}',false);set role ${role};`,
  );
}
async function rpc(name, args = [], params = []) {
  return (
    await db.query(`select public.${name}(${args.join(",")}) as result`, params)
  ).rows[0].result;
}
async function save(p) {
  return rpc("horoscope_save", ["$1::jsonb"], [JSON.stringify(p)]);
}
await db.exec(`
create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema storage;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table public.profiles(id uuid primary key references auth.users,suspended_at timestamptz,is_published boolean default true,is_admin boolean default false);
create table public.connections(id uuid primary key default gen_random_uuid(),member_a_id uuid,member_b_id uuid);
create table public.admin_audit_log(actor_id uuid,action text,target_type text,target_id text,metadata jsonb);
create function public.is_admin() returns boolean language sql stable security definer as $$select coalesce((select is_admin from public.profiles where id=auth.uid()),false)$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;
grant usage on schema public,auth,storage to authenticated,anon,service_role;
grant select,insert,delete on storage.objects to authenticated;
insert into auth.users values('${a}'),('${b}');insert into public.profiles(id) values('${a}'),('${b}');
`);
const migration = await readFile(
  new URL(
    "../supabase/migrations/20261018214004_horoscope_private_studio.sql",
    import.meta.url,
  ),
  "utf8",
);
await db.exec(migration);
await db.exec(
  "begin; update public.horoscope_settings set horoscope_enabled=true,horoscope_upload_enabled=true;",
);
// Expected permission errors must not poison the surrounding rollback transaction.
const originalQuery = db.query.bind(db);
let savepoint = 0;
db.query = async (...args) => {
  const point = "assertion_" + ++savepoint;
  await db.exec("savepoint " + point);
  try {
    const result = await originalQuery(...args);
    await db.exec("release savepoint " + point);
    return result;
  } catch (error) {
    await db.exec(
      "rollback to savepoint " + point + "; release savepoint " + point,
    );
    throw error;
  }
};
try {
  await test("horoscope migration executes and enforces PostgreSQL policies", async (t) => {
    await t.test(
      "owner creates private horoscope with unknown birth time",
      async () => {
        await actor(a);
        const h = await save(payload());
        assert.equal(h.visibility, "private");
        assert.equal(h.fields.timeOfBirth, undefined);
        assert.equal(h.user_id, a);
      },
    );
    await t.test(
      "peer cannot read private raw profile or private view RPC",
      async () => {
        await actor(b);
        assert.equal(
          (await db.query("select * from public.horoscope_profiles")).rows
            .length,
          0,
        );
        await assert.rejects(
          rpc("horoscope_view", ["$1::uuid"], [a]),
          /unavailable/,
        );
      },
    );
    await t.test(
      "direct raw writes and admin controls denied to ordinary members",
      async () => {
        await actor(b);
        await assert.rejects(
          db.query("update public.horoscope_profiles set visibility=$1", [
            "members",
          ]),
          /permission denied/,
        );
        await assert.rejects(
          rpc("horoscope_admin_settings", ["$1::jsonb"], ["{}"]),
          /Forbidden/,
        );
      },
    );
    await t.test(
      "shared DTO redacts exact DOB/location/provenance",
      async () => {
        await actor(a);
        await save(payload(1, "members"));
        await actor(b);
        const h = await rpc("horoscope_view", ["$1::uuid"], [a]);
        assert.deepEqual(Object.keys(h.fields).sort(), [
          "nakshatra",
          "rasi",
          "timeQuality",
        ]);
        assert.equal(h.provenance, undefined);
        assert.equal(h.fields.dateOfBirth, undefined);
        assert.equal(
          await rpc("horoscope_can_compare", ["$1::uuid"], [a]),
          false,
        );
      },
    );
    await t.test(
      "comparison requires mutual consent and reciprocal visibility",
      async () => {
        await actor(b);
        await save(payload(0, "private"));
        assert.equal(
          await rpc("horoscope_can_compare", ["$1::uuid"], [a]),
          false,
        );
        await save(payload(1, "members"));
        assert.equal(
          await rpc("horoscope_can_compare", ["$1::uuid"], [a]),
          true,
        );
      },
    );
    await t.test(
      "approved connection visibility rejects unapproved peer",
      async () => {
        await actor(a);
        await save(payload(2, "connections"));
        await actor(b);
        assert.equal(
          await rpc("horoscope_can_compare", ["$1::uuid"], [a]),
          false,
        );
        await assert.rejects(
          rpc("horoscope_view", ["$1::uuid"], [a]),
          /unavailable/,
        );
        await db.exec(
          `reset role;insert into public.connections(member_a_id,member_b_id) values('${a}','${b}');`,
        );
        await actor(b);
        assert.equal(
          await rpc("horoscope_can_compare", ["$1::uuid"], [a]),
          true,
        );
      },
    );
    let reportId;
    await t.test(
      "reports stored only with fresh revisions and current permission",
      async () => {
        await actor(b);
        reportId = await rpc(
          "horoscope_store_report",
          ["$1::uuid", "2", "3", "$2::jsonb"],
          [
            a,
            JSON.stringify({
              comparison: { score: null },
              aiExplanation: null,
            }),
          ],
        );
        assert.equal(
          (await db.query("select id from public.horoscope_match_reports")).rows
            .length,
          1,
        );
        await actor(a);
        assert.equal(
          (await db.query("select id from public.horoscope_match_reports")).rows
            .length,
          0,
        );
      },
    );
    await t.test(
      "a block in either direction overrides shared horoscope and cached report",
      async () => {
        await actor(a);
        await db.query(
          "insert into public.blocks(blocker_id,blocked_id) values($1,$2)",
          [a, b],
        );
        await actor(b);
        assert.equal(
          await rpc("horoscope_can_compare", ["$1::uuid"], [a]),
          false,
        );
        assert.equal(
          (
            await db.query(
              "select id from public.horoscope_match_reports where id=$1",
              [reportId],
            )
          ).rows.length,
          0,
        );
        await assert.rejects(
          rpc("horoscope_view", ["$1::uuid"], [a]),
          /unavailable/,
        );
        await actor(a);
        await db.query("delete from public.blocks where blocker_id=$1", [a]);
      },
    );
    await t.test(
      "private document and extraction isolation; expiry enforced",
      async () => {
        await actor(a);
        const id = "20000000-0000-4000-8000-000000000001";
        const d = await rpc(
          "horoscope_register_document",
          ["$1::uuid", "'image/png'", "repeat('a',64)"],
          [id],
        );
        await db.query(
          "insert into storage.objects(bucket_id,name,owner_id) values($1,$2,$3)",
          ["horoscope-private", d.storage_path, a],
        );
        await rpc(
          "horoscope_record_extraction",
          ["$1::uuid", "$2::jsonb", "'test-v1'"],
          [id, JSON.stringify({ fields: [], warnings: [] })],
        );
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          1,
        );
        await actor(b);
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.horoscope_documents")).rows
            .length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.horoscope_extractions")).rows
            .length,
          0,
        );
        await db.exec(
          "reset role;update public.horoscope_documents set expires_at=now()-interval '1 day';",
        );
        await actor(a);
        assert.equal(
          (await db.query("select * from storage.objects")).rows.length,
          0,
        );
      },
    );
    await t.test(
      "stale saves reject and consent withdrawal invalidates report access",
      async () => {
        await actor(a);
        await assert.rejects(save(payload(1, "members")), /Record changed/);
        const p = payload(3, "connections");
        p.comparison_consent = false;
        await save(p);
        await actor(b);
        assert.equal(
          await rpc("horoscope_can_compare", ["$1::uuid"], [a]),
          false,
        );
        assert.equal(
          (await db.query("select id from public.horoscope_match_reports")).rows
            .length,
          0,
        );
      },
    );
    await t.test(
      "direct RPC rejects missing birth date and unknown-time lagna",
      async () => {
        await actor(b);
        let p = payload(2, "members");
        delete p.fields.dateOfBirth;
        await assert.rejects(save(p), /Invalid birth details/);
        p = payload(2, "members");
        p.fields.lagna = "Mesha";
        await assert.rejects(save(p), /Unknown time/);
      },
    );
    await t.test("suspension overrides peer access", async () => {
      await db.exec(
        `reset role;update public.profiles set suspended_at=now() where id='${a}';`,
      );
      await actor(b);
      await assert.rejects(
        rpc("horoscope_view", ["$1::uuid"], [a]),
        /unavailable/,
      );
    });
    await t.test(
      "anonymous RPCs denied and source bucket remains private",
      async () => {
        await actor(null, "anon");
        await assert.rejects(
          rpc("horoscope_view", ["$1::uuid"], [a]),
          /permission denied/,
        );
        await db.exec("reset role");
        const bucket = await db.query(
          "select public from storage.buckets where id='horoscope-private'",
        );
        assert.equal(bucket.rows[0].public, false);
      },
    );
    await t.test(
      "owner deletion removes profile and derived records",
      async () => {
        await actor(a);
        await rpc("horoscope_delete");
        assert.equal(
          (await db.query("select * from public.horoscope_profiles")).rows
            .length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.horoscope_documents")).rows
            .length,
          0,
        );
        assert.equal(
          (await db.query("select * from public.horoscope_extractions")).rows
            .length,
          0,
        );
      },
    );
  });
} finally {
  await db.exec("reset role;rollback;");
  await db.close();
}
