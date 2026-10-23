const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");

const source = ts.transpileModule(
  fs.readFileSync("src/app/api/horoscope/route.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText;

function routeFor(approved, rpcError = null) {
  const calls = [];
  const db = {
    rpc: async (name, args) => {
      calls.push(name);
      if (name === "horoscope_qa_member_allowed") return { data: approved, error: rpcError };
      if (name === "horoscope_save") return { data: { revision: 1 }, error: null };
      throw new Error("Unexpected RPC: " + name);
    },
  };
  const mocks = {
    "@/lib/horoscope/server": {
      context: async (_request, write) => {
        assert.equal(write, true);
        return { db, settings: { horoscope_enabled: false } };
      },
      readBody: async () => ({}),
      json: (body, status = 200) => ({ body, status }),
      failure: (e) => { throw e; },
    },
    "@/lib/horoscope/schema": {
      saveSchema: { safeParse: () => ({ success: true, data: { revision: 0 } }) },
    },
  };
  const mod = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(
    (name) => {
      if (!(name in mocks)) throw new Error("Unexpected dependency: " + name);
      return mocks[name];
    },
    mod,
    mod.exports,
  );
  return { PUT: mod.exports.PUT, calls };
}

test("unapproved member cannot save horoscope data", async () => {
  const r = routeFor(false);
  assert.equal((await r.PUT({})).status, 403);
  assert.deepEqual(r.calls, ["horoscope_qa_member_allowed"]);
});

test("database authorization errors fail closed", async () => {
  const r = routeFor(null, { message: "Unavailable" });
  assert.equal((await r.PUT({})).status, 403);
  assert.deepEqual(r.calls, ["horoscope_qa_member_allowed"]);
});

test("approved QA member can save manually despite global feature being off", async () => {
  const r = routeFor(true);
  assert.equal((await r.PUT({})).status, 200);
  assert.deepEqual(r.calls, ["horoscope_qa_member_allowed", "horoscope_save"]);
});
