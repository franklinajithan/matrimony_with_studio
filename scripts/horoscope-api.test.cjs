const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
function load(file, mocks) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, {
    filename: file,
  })(
    (name) => {
      if (name === "zod") return require("zod");
      if (Object.hasOwn(mocks, name)) return mocks[name];
      throw new Error("Unexpected dependency: " + name);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const own = "10000000-0000-4000-8000-000000000001",
  other = "10000000-0000-4000-8000-000000000002";
const schema = load("src/lib/horoscope/schema.ts", {});
const { compareSharedFields } = load("src/lib/horoscope/comparison.ts", {
  "./schema": schema,
});
function setup({
  body = { member: other, ai: false },
  allowed = true,
  consent = true,
  provider = true,
  enabled = true,
  fresh = true,
  limit = false,
} = {}) {
  const calls = [];
  let providerInput;
  const a = {
    revision: 2,
    tradition: "tamil",
    shared_fields: ["rasi", "timeQuality"],
    fields: {
      rasi: "Mesha",
      timeQuality: "unknown",
      dateOfBirth: "1990-01-01",
      birthCity: "Private city",
      nakshatra: "Unshared star",
    },
    ai_consent: consent,
  };
  const b = {
    revision: 3,
    tradition: "tamil",
    fields: { rasi: "Simha", timeQuality: "unknown" },
    ai_consent: consent,
  };
  const api = load("src/app/api/horoscope/compare/route.ts", {
    "@/lib/horoscope/server": {
      context: async (request, write) => {
        assert.equal(write, true);
        return {
          user: { id: own },
          settings: { ai_horoscope_matching_enabled: enabled },
          db: {
            rpc: async (name, args) => {
              calls.push(name);
              switch (name) {
                case "horoscope_can_compare":
                  return { data: allowed, error: null };
                case "horoscope_view":
                  return { data: args.p_owner === own ? a : b, error: null };
                case "horoscope_claim_action":
                  return {
                    data: null,
                    error: limit ? { code: "54000" } : null,
                  };
                case "horoscope_report_current":
                  return { data: fresh, error: null };
                case "horoscope_store_report":
                  return { data: "report-id", error: null };
                default:
                  throw new Error("Unexpected RPC " + name);
              }
            },
          },
        };
      },
      readBody: async () => body,
      json: (body, status = 200) => ({ body, status }),
      failure: () => ({ status: 503 }),
    },
    "@/lib/horoscope/comparison": { compareSharedFields },
    "@/lib/horoscope/provider": {
      providerConfigured: () => provider,
      explainComparison: async (input) => {
        providerInput = input;
        return {
          explanation: "Only shared fields are compared.",
          questions: [],
        };
      },
    },
  });
  return { api, calls, input: () => providerInput };
}
for (const body of [
  null,
  {},
  { member: other, ai: "true" },
  { member: "not-a-uuid" },
  { member: other, extra: "unexpected" },
])
  test(
    "malformed compare request rejected before data access: " +
      JSON.stringify(body),
    async () => {
      const t = setup({ body });
      assert.equal((await t.api.POST({})).status, 400);
      assert.equal(t.calls.length, 0);
    },
  );
test("private/unapproved comparison never fetches horoscope fields", async () => {
  const t = setup({ allowed: false });
  assert.equal((await t.api.POST({})).status, 403);
  assert.deepEqual(t.calls, ["horoscope_can_compare"]);
});
for (const setting of [
  { consent: false },
  { provider: false },
  { enabled: false },
])
  test(
    "unavailable AI does not consume daily budget: " + JSON.stringify(setting),
    async () => {
      const t = setup({ ...setting, body: { member: other, ai: true } });
      assert.equal((await t.api.POST({})).status, 403);
      assert.ok(!t.calls.includes("horoscope_claim_action"));
      assert.equal(t.input(), undefined);
    },
  );
test("AI sees only permitted comparison values and cannot change deterministic result", async () => {
  const t = setup({ body: { member: other, ai: true } });
  const r = await t.api.POST({});
  assert.equal(r.status, 200);
  assert.equal(r.body.comparison.traditionalResult.score, null);
  const input = JSON.stringify(t.input());
  for (const hidden of ["1990-01-01", "Private city", "Unshared star"])
    assert.ok(!input.includes(hidden));
  assert.equal(
    r.body.aiExplanation.explanation,
    "Only shared fields are compared.",
  );
});
test("permission withdrawal after generation prevents storing or returning the report", async () => {
  const t = setup({ body: { member: other, ai: true }, fresh: false });
  const r = await t.api.POST({});
  assert.equal(r.status, 409);
  assert.equal(r.body.comparison, undefined);
  assert.ok(!t.calls.includes("horoscope_store_report"));
});
test("rate limit stops provider generation and report writes", async () => {
  const t = setup({ body: { member: other, ai: true }, limit: true });
  assert.equal((await t.api.POST({})).status, 429);
  assert.equal(t.input(), undefined);
  assert.ok(!t.calls.includes("horoscope_store_report"));
});
