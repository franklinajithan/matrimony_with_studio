import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const migration = readFileSync(
  new URL("../supabase/migrations/20261108120000_atomic_member_connection_removal.sql", import.meta.url),
  "utf8",
);
const client = readFileSync(
  new URL("../src/lib/supabase/connections.ts", import.meta.url),
  "utf8",
);

test("connection removal is one server-side transaction", () => {
  assert.match(migration, /security definer/i);
  assert.match(migration, /auth\.uid\(\)/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /delete from public\.connections/i);
  assert.match(migration, /update public\.match_requests/i);
  assert.match(migration, /status\s*=\s*'withdrawn'/i);
  assert.match(migration, /mr\.status\s*=\s*'accepted'/i);
  assert.match(migration, /revoke all .* from public, anon/i);
  assert.match(migration, /grant execute .* to authenticated/i);
});

test("client invokes authorized RPC and confirms result", () => {
  assert.match(client, /user\.id\s*!==\s*userA/);
  assert.match(client, /supabase\.rpc\("remove_my_connection"/);
  assert.match(client, /if \(data !== true\) throw/);
  const removal = client.split("export async function removeConnection(")[1].split("async function listConnectionsFromAcceptedRequests")[0];
  assert.doesNotMatch(removal, /\.from\("connections"\)\.delete\(/);
});
