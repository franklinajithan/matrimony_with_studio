const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript"),
  vm = require("node:vm");
const { gzipSync } = require("node:zlib"),
  { spawnSync } = require("node:child_process");
function load(file, mocks = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInThisContext("(function(require,module,exports){" + code + "\n})")(
    (name) => {
      if (name in mocks) return mocks[name];
      if (name === "zod") return require("zod");
      if (name === "next/server")
        return {
          NextResponse: { json: (body, init) => Response.json(body, init) },
        };
      if (name.startsWith("node:")) return require(name);
      if (name === "@/lib/account/archive") return archive;
      if (name === "@/lib/admin/http") return load("src/lib/admin/http.ts");
      throw Error("Unexpected import " + name);
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
const archive = load("src/lib/account/archive.ts"),
  memberId = "10000000-0000-4000-8000-000000000001";
async function collect(generator) {
  const chunks = [];
  for await (const chunk of generator) chunks.push(Buffer.from(chunk));
  return gzipSync(Buffer.concat(chunks));
}
function extract(bytes, name) {
  const result = spawnSync("tar", ["-xzOf", "-", name], { input: bytes });
  assert.equal(result.status, 0, result.stderr.toString());
  return result.stdout;
}
function source(overrides = {}) {
  return {
    memberId,
    signal: new AbortController().signal,
    page: async () => ({ rows: [], next: null }),
    download: async () => {
      throw Error("No file expected");
    },
    ...overrides,
  };
}
test("streamed archive is readable by system tar and paginates records", async () => {
  const calls = [];
  const bytes = await collect(
    archive.accountArchive(
      source({
        page: async (dataset, after) => {
          calls.push([dataset, after]);
          return dataset === "sent_messages"
            ? after
              ? { rows: [{ id: "second", text: "தமிழ்" }], next: null }
              : { rows: [{ id: "first" }], next: "cursor" }
            : { rows: [], next: null };
        },
      }),
    ),
  );
  const manifest = JSON.parse(extract(bytes, "manifest.json"));
  assert.equal(manifest.complete, true);
  assert.equal(manifest.counts.sent_messages, 2);
  assert.match(
    extract(bytes, "records/sent_messages-2.json").toString(),
    /தமிழ்/,
  );
  assert.ok(
    calls.some(
      ([name, after]) => name === "sent_messages" && after === "cursor",
    ),
  );
});
test("owned files retain exact bytes with original path mapping", async () => {
  const path = "users/" + memberId + "/photos/my photo.jpg",
    body = Buffer.from([0, 255, 3, 4]);
  const bytes = await collect(
    archive.accountArchive(
      source({
        page: async (dataset) => ({
          rows:
            dataset === "files"
              ? [{ id: "fixture", bucket: "media", path, size: 4 }]
              : [],
          next: null,
        }),
        download: async (bucket, key) => {
          assert.equal(bucket, "media");
          assert.equal(key, path);
          return body;
        },
      }),
    ),
  );
  const manifest = JSON.parse(extract(bytes, "manifest.json"));
  assert.equal(manifest.complete, true);
  assert.equal(manifest.files[0].path, path);
  assert.deepEqual(extract(bytes, "files/media/fixture.bin"), body);
});
test("failed datasets and missing files mark archive incomplete", async () => {
  const bytes = await collect(
    archive.accountArchive(
      source({
        page: async (dataset) => {
          if (dataset === "profile") throw Error("Unavailable");
          return {
            rows:
              dataset === "files"
                ? [
                    {
                      id: "fixture",
                      bucket: "media",
                      path: "users/" + memberId + "/own.jpg",
                      size: 4,
                    },
                  ]
                : [],
            next: null,
          };
        },
      }),
    ),
  );
  const manifest = JSON.parse(extract(bytes, "manifest.json"));
  assert.equal(manifest.complete, false);
  assert.equal(manifest.issues[0].dataset, "profile");
  assert.match(manifest.files[0].status, /unavailable/);
});
test("oversized, foreign and unsafe object paths never reach privileged downloads", async () => {
  for (const item of [
    { path: "users/" + memberId + "/large.jpg", size: 11 * 1024 * 1024 },
    { path: "users/other/private.jpg", size: 4 },
    { path: "users/" + memberId + "/../other.jpg", size: 4 },
    { path: "users/" + memberId + "/%2e%2e/other.jpg", size: 4 },
    { path: "users/" + memberId + "/bad\\name.jpg", size: 4 },
  ]) {
    let calls = 0;
    const bytes = await collect(
      archive.accountArchive(
        source({
          page: async (dataset) => ({
            rows:
              dataset === "files"
                ? [{ id: "fixture", bucket: "media", ...item }]
                : [],
            next: null,
          }),
          download: async () => {
            calls++;
            return new Uint8Array(4);
          },
        }),
      ),
    );
    assert.equal(calls, 0);
    assert.equal(JSON.parse(extract(bytes, "manifest.json")).complete, false);
  }
  assert.throws(() => archive.tarHeader("../../escape", 1));
});
test("cancelling archive stops source iteration", async () => {
  const control = new AbortController();
  control.abort();
  await assert.rejects(
    collect(archive.accountArchive(source({ signal: control.signal }))),
    { name: "AbortError" },
  );
});
function api(user, configured, reserved = true) {
  const calls = [];
  return {
    calls,
    handler: load("src/app/api/account/export/route.ts", {
      "@/lib/supabase/server": {
        createSupabaseServerClient: async () => ({
          auth: { getUser: async () => ({ data: { user } }) },
          rpc: async (name) => {
            calls.push(name);
            return { error: reserved ? null : { code: "22023" } };
          },
        }),
      },
      "@/lib/supabase/service": {
        serviceConfigured: () => configured,
        serviceClient: () => {
          throw Error("Must not access files");
        },
      },
    }),
  };
}
test("archive endpoint denies cross-site, signed-out, unconfigured and throttled requests", async () => {
  const request = (headers = {}) =>
      new Request("https://preview.example/api/account/export", { headers }),
    a = api(null, true);
  assert.equal((await a.handler.GET(request())).status, 401);
  assert.equal(
    (await a.handler.GET(request({ "sec-fetch-site": "cross-site" }))).status,
    403,
  );
  assert.equal(
    (await a.handler.GET(request({ origin: "https://attacker.example" })))
      .status,
    403,
  );
  assert.equal(
    (await api({ id: memberId }, false).handler.GET(request())).status,
    503,
  );
  assert.equal(
    (await api({ id: memberId }, true, false).handler.GET(request())).status,
    429,
  );
  assert.deepEqual(a.calls, []);
});
test("availability check does not consume quota or access private files", async () => {
  const a = api({ id: memberId }, true);
  assert.equal(
    (
      await a.handler.HEAD(
        new Request("https://preview.example/api/account/export"),
      )
    ).status,
    200,
  );
  assert.deepEqual(a.calls, []);
});
test("archive API streams valid gzip with private download headers", async () => {
  const calls = [];
  const handler = load("src/app/api/account/export/route.ts", {
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: memberId } } }) },
        rpc: async (name) => {
          calls.push(name);
          return {
            data:
              name === "account_export_page" ? { rows: [], next: null } : true,
            error: null,
          };
        },
      }),
    },
    "@/lib/supabase/service": {
      serviceConfigured: () => true,
      serviceClient: () => ({
        storage: {
          from: () => {
            throw Error("No files expected");
          },
        },
      }),
    },
  });
  const r = await handler.GET(
    new Request("https://preview.example/api/account/export"),
  );
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "private, no-store");
  assert.match(r.headers.get("content-disposition"), /attachment/);
  assert.equal(
    JSON.parse(extract(Buffer.from(await r.arrayBuffer()), "manifest.json"))
      .complete,
    true,
  );
  assert.equal(calls[0], "reserve_account_export");
});
test("admin setup checks report missing or invalid inputs without returning secrets", () => {
  const { integrationReadiness } = load("src/lib/account/readiness.ts");
  const empty = integrationReadiness({});
  assert.equal(
    empty.find((item) => item.name.startsWith("Stripe")).enabled,
    false,
  );
  assert.equal(
    empty.find((item) => item.name.startsWith("Stripe")).configured,
    false,
  );
  const result = integrationReadiness({
    BILLING_ENABLED: "true",
    STRIPE_SECRET_KEY: "sk_live_fixture_SECRET",
    TURN_AUTH_SECRET: "short",
  });
  assert.ok(
    result.find((item) => item.name.startsWith("Stripe")).invalid.length,
  );
  assert.equal(JSON.stringify(result).includes("fixture_SECRET"), false);
  assert.equal(JSON.stringify(result).includes("sk_live"), false);
  assert.ok(
    result.find((item) => item.name.startsWith("Voice")).invalid.length,
  );
});
function shortlistApi(user = { id: memberId }) {
  const calls = [];
  const ownId = "20000000-0000-4000-8000-000000000001",
    hiddenId = "20000000-0000-4000-8000-000000000002";
  const handler = load("src/app/api/shortlist/route.ts", {
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        auth: { getUser: async () => ({ data: { user } }) },
        from: (table) => {
          calls.push(["from", table]);
          const query = {
            select: (columns, options) => {
              calls.push(["select", columns, options]);
              return query;
            },
            delete: () => {
              calls.push(["delete"]);
              return query;
            },
            eq: (key, value) => {
              calls.push(["eq", key, value]);
              return query;
            },
            order: (key, value) => {
              calls.push(["order", key, value]);
              return query;
            },
            range: async (start, end) => {
              calls.push(["range", start, end]);
              return {
                data: [
                  {
                    id: ownId,
                    shortlisted_id: ownId,
                    created_at: "2026-10-17",
                  },
                  {
                    id: hiddenId,
                    shortlisted_id: hiddenId,
                    created_at: "2026-10-17",
                  },
                ],
                count: 22,
                error: null,
              };
            },
            in: async (key, values) => {
              calls.push(["in", key, values]);
              return {
                data: [{ id: ownId, display_name: "Visible member" }],
                error: null,
              };
            },
            then: (resolve) => resolve({ data: [], error: null }),
          };
          return query;
        },
      }),
    },
  });
  return { handler, calls, ownId, hiddenId };
}
test("shortlist pagination reads only owner rows and projects only currently visible members", async () => {
  const a = shortlistApi(),
    r = await a.handler.GET(
      new Request("https://preview.example/api/shortlist?page=2"),
    );
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.total, 22);
  assert.equal(data.items[0].profile.display_name, "Visible member");
  assert.equal(data.items[1].profile, null);
  assert.ok(
    a.calls.some(
      (call) =>
        call[0] === "eq" && call[1] === "user_id" && call[2] === memberId,
    ),
  );
  assert.ok(
    a.calls.some(
      (call) => call[0] === "range" && call[1] === 20 && call[2] === 39,
    ),
  );
  assert.ok(
    a.calls.some(
      (call) => call[0] === "from" && call[1] === "discovery_profiles",
    ),
  );
});
test("shortlist removal requires origin, authentication and ownership filters", async () => {
  const a = shortlistApi();
  const request = (origin) =>
    new Request("https://preview.example/api/shortlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", origin },
      body: JSON.stringify({ id: a.ownId }),
    });
  assert.equal(
    (await a.handler.DELETE(request("https://attacker.example"))).status,
    403,
  );
  assert.equal(a.calls.length, 0);
  assert.equal(
    (await a.handler.DELETE(request("https://preview.example"))).status,
    200,
  );
  assert.ok(
    a.calls.some(
      (call) => call[0] === "eq" && call[1] === "id" && call[2] === a.ownId,
    ),
  );
  assert.ok(
    a.calls.some(
      (call) =>
        call[0] === "eq" && call[1] === "user_id" && call[2] === memberId,
    ),
  );
});
test("shortlist endpoint rejects invalid pages and expired sessions before reading data", async () => {
  const a = shortlistApi(null);
  assert.equal(
    (
      await a.handler.GET(
        new Request("https://preview.example/api/shortlist?page=-1"),
      )
    ).status,
    400,
  );
  assert.equal(
    (await a.handler.GET(new Request("https://preview.example/api/shortlist")))
      .status,
    401,
  );
  assert.equal(a.calls.length, 0);
});
