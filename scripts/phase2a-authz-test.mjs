import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const root = path.resolve(import.meta.dirname, "..");
const envFile = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const env = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = env.DATABASE_URL;

if (!url || !anonKey || !databaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL, publishable/anon key, or DATABASE_URL.");
}

const restHeaders = { apikey: anonKey, Accept: "application/json" };

async function rest(pathname, options = {}) {
  const response = await fetch(`${url}${pathname}`, {
    ...options,
    headers: { ...restHeaders, ...(options.headers || {}) },
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, json };
}

async function authRequest(pathname, body) {
  const response = await fetch(`${url}${pathname}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error_description || json.msg || json.error || `Auth request failed (${response.status})`);
  }
  return json;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createConfirmedUser(email, password, displayName) {
  const result = await db.query(
    `
    with new_user as (
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, recovery_token,
        email_change_token_new, email_change, email_change_token_current,
        phone_change, phone_change_token, reauthentication_token,
        is_sso_user, is_anonymous
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1,
        crypt($2, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', $3::text),
        now(),
        now(),
        '', '', '', '', '', '', '', '',
        false,
        false
      )
      returning id, email
    ),
    ident as (
      insert into auth.identities (
        id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      )
      select
        gen_random_uuid(),
        new_user.id::text,
        new_user.id,
        jsonb_build_object('sub', new_user.id::text, 'email', new_user.email),
        'email',
        now(),
        now(),
        now()
      from new_user
    )
    select id from new_user
    `,
    [email, password, displayName]
  );
  return result.rows[0].id;
}

const stamp = Date.now();
const password = `Test-${stamp}-Aa1`;
const emailA = `phase2a.a.${stamp}@gmail.com`;
const emailB = `phase2a.b.${stamp}@gmail.com`;
const results = [];

const db = new Client({
  connectionString: databaseUrl.replace(/\?sslmode=[^&]+/, ""),
  ssl: { rejectUnauthorized: false },
});
await db.connect();

try {
  const anonProfiles = await rest("/rest/v1/profiles?select=id,email,dob");
  assert(
    anonProfiles.status === 401 ||
      anonProfiles.status === 403 ||
      (Array.isArray(anonProfiles.json) && anonProfiles.json.length === 0),
    `Anonymous profiles read should be blocked, got ${anonProfiles.status}`
  );
  results.push(`anon profiles: HTTP ${anonProfiles.status} (blocked or empty)`);

  const anonDiscovery = await rest("/rest/v1/discovery_profiles?select=id,display_name");
  assert(
    anonDiscovery.status === 401 ||
      anonDiscovery.status === 403 ||
      (Array.isArray(anonDiscovery.json) && anonDiscovery.json.length === 0),
    `Anonymous discovery read should be blocked, got ${anonDiscovery.status}`
  );
  results.push(`anon discovery: HTTP ${anonDiscovery.status} (blocked or empty)`);

  await createConfirmedUser(emailA, password, "Account A");
  await createConfirmedUser(emailB, password, "Account B");

  const loginA = await authRequest("/auth/v1/token?grant_type=password", { email: emailA, password });
  const tokenA = loginA.access_token;
  const idA = loginA.user?.id;
  if (!tokenA || !idA) throw new Error("Account A session missing");

  const saveA = await rest("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenA}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      id: idA,
      display_name: "Account A",
      dob: "1992-04-18",
      bio: "Account A private draft bio",
      is_published: false,
      onboarding_draft: { displayName: "Account A", dob: "1992-04-18" },
    }),
  });
  assert(saveA.status < 300, `Account A could not save profile: ${saveA.status}`);
  results.push("Account A saved unpublished profile");

  const reloadA = await rest(`/rest/v1/profiles?id=eq.${idA}&select=id,display_name,dob,bio,is_published`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(Array.isArray(reloadA.json) && reloadA.json[0]?.dob === "1992-04-18", "Account A could not reload private dob");
  results.push("Account A reloaded its own private fields");

  const loginB = await authRequest("/auth/v1/token?grant_type=password", { email: emailB, password });
  const tokenB = loginB.access_token;
  if (!tokenB) throw new Error("Account B session missing");

  const readAAsB = await rest(`/rest/v1/profiles?id=eq.${idA}&select=id,email,dob,bio,is_admin`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(Array.isArray(readAAsB.json) && readAAsB.json.length === 0, "Account B must not read A's private profile row");
  results.push("Account B cannot read A's private profile");

  const editAAsB = await rest(`/rest/v1/profiles?id=eq.${idA}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${tokenB}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ bio: "hacked by B" }),
  });
  assert(
    editAAsB.status === 401 ||
      editAAsB.status === 403 ||
      (Array.isArray(editAAsB.json) && editAAsB.json.length === 0),
    "Account B must not update A's profile"
  );
  results.push("Account B cannot update A's profile");

  const privilegeA = await rest(`/rest/v1/profiles?id=eq.${idA}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${tokenA}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_admin: true, is_verified: true, subscription_plan: "elite" }),
  });
  assert(privilegeA.status >= 400, "Account A must not be able to grant itself admin or entitlements");
  results.push("Account A cannot set privileged fields");

  console.log("Phase 2A authorization checks passed:");
  for (const line of results) console.log(`- ${line}`);
} finally {
  await db.query("delete from auth.users where email = any($1)", [[emailA, emailB]]);
  await db.end();
}
