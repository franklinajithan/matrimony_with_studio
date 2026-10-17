const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(file, mocks = {}) {
  const mod = { exports: {} },
    code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
  vm.runInThisContext("(function(require,module,exports){" + code + "\n})")(
    (name) => {
      if (name in mocks) return mocks[name];
      throw Error("Unexpected import " + name);
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
const { loadDirectory } = load("src/lib/matching/directory.ts");
test("matching directory includes records after the old 500-profile cutoff", async () => {
  const records = Array.from({ length: 730 }, (_, id) => ({ id })),
    calls = [];
  const result = await loadDirectory(async (offset, limit) => {
    calls.push(offset);
    return records.slice(offset, offset + limit);
  }, new AbortController().signal);
  assert.deepEqual(result, records);
  assert.ok(calls.includes(700));
});
test("directory failure, cancellation and safety limits never return incomplete matches as complete", async () => {
  await assert.rejects(
    loadDirectory(async () => {
      throw Error("Unavailable");
    }, new AbortController().signal),
    /Unavailable/,
  );
  const control = new AbortController();
  await assert.rejects(
    loadDirectory(async () => {
      control.abort();
      return [];
    }, control.signal),
    { name: "AbortError" },
  );
  await assert.rejects(
    loadDirectory(
      async () => Array(100).fill({ id: "fixture" }),
      new AbortController().signal,
      200,
    ),
    /too large/,
  );
  assert.equal(
    (
      await loadDirectory(
        async (offset) =>
          offset < 200 ? Array(100).fill({ id: "fixture" }) : [],
        new AbortController().signal,
        200,
      )
    ).length,
    200,
  );
});
test("shortlist status reads are deduplicated, owner-filtered and split below URL limits", async () => {
  const calls = [],
    userId = "fixture-member";
  const { getShortlistedIds } = load("src/lib/supabase/shortlist.ts", {
    "./timestamp": { Timestamp: {} },
    "./client": {
      supabase: {
        from: (table) => {
          assert.equal(table, "shortlist");
          const query = {
            select: () => query,
            eq: (key, value) => {
              assert.equal(key, "user_id");
              assert.equal(value, userId);
              return query;
            },
            in: async (key, values) => {
              assert.equal(key, "shortlisted_id");
              calls.push(values);
              return { data: [{ shortlisted_id: values[0] }], error: null };
            },
          };
          return query;
        },
      },
    },
  });
  const ids = Array.from({ length: 951 }, (_, i) => "profile-" + i);
  const result = await getShortlistedIds(userId, [...ids, ...ids]);
  assert.equal(calls.length, 10);
  assert.ok(calls.every((batch) => batch.length <= 100));
  assert.equal(new Set(calls.flat()).size, 951);
  assert.equal(result.size, 10);
});
test("literal internal UI links resolve to declared application routes", () => {
  const routes = [],
    sources = [];
  function walk(dir, fn) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      entry.isDirectory() ? walk(p, fn) : fn(p);
    }
  }
  walk("src/app", (p) => {
    if (/\/(page|route)\.tsx?$/.test(p))
      routes.push(
        p
          .replace(/^src\/app/, "")
          .replace(/\/(page|route)\.tsx?$/, "")
          .replace(/\/\([^/]+\)/g, "") || "/",
      );
  });
  walk("src", (p) => {
    if (/\.tsx?$/.test(p)) sources.push(p);
  });
  const missing = [];
  for (const file of sources)
    for (const match of fs
      .readFileSync(file, "utf8")
      .matchAll(/href\s*(?:=|:)\s*["'](\/[a-zA-Z0-9\/_?&=#-]*)["']/g)) {
      const href = match[1].split(/[?#]/)[0];
      if (href.includes(".")) continue;
      if (
        !routes.some((route) =>
          new RegExp(
            "^" +
              route
                .replace(/\[\.\.\.[^\]]+\]/g, ".+")
                .replace(/\[[^\]]+\]/g, "[^/]+") +
              "$",
          ).test(href),
        )
      )
        missing.push({ file, href });
    }
  assert.deepEqual(missing, []);
});
