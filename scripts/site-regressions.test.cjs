const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(file, mocks = {}) {
  const code = ts.transpileModule(
      fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      },
    ).outputText,
    mod = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(
    (n) => {
      if (n in mocks) return mocks[n];
      if (n === "next/server")
        return {
          NextResponse: {
            json: (body, init) => ({ body, status: init?.status || 200 }),
          },
        };
      if (["react", "react/jsx-runtime"].includes(n)) return require(n);
      throw Error("Unexpected dependency " + n);
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
function biodataHarness() {
  const calls = [];
  return {
    calls,
    ...load("src/lib/supabase/biodata.ts", {
      "./client": {
        supabase: {
          rpc: async (n, a) => {
            calls.push({ n, a });
            return { data: [] };
          },
        },
      },
      "@/lib/biodata/defaults": { defaultDesignForTemplate: () => ({}) },
      "@/lib/biodata/templates": { TEMPLATE_VERSION: 1 },
    }),
  };
}
for (const token of [
  "invalid",
  "",
  "a".repeat(129),
  "<script>bad</script>",
  "a/b".repeat(16),
])
  test(
    "malformed biodata token never calls database: " + token.slice(0, 16),
    async () => {
      const h = biodataHarness();
      assert.equal(await h.getShareByToken(token), null);
      assert.equal(h.calls.length, 0);
    },
  );
test("plausible biodata token still uses the authorised resolver", async () => {
  const h = biodataHarness(),
    token = "a".repeat(48);
  assert.equal(await h.getShareByToken(token), null);
  assert.equal(h.calls[0].n, "resolve_biodata_share");
  assert.equal(h.calls[0].a.p_token, token);
});
test("server email links fall back to the current CupidMatch domain", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  try {
    assert.equal(
      load("src/lib/supabase/env.ts").getSiteUrl(),
      "https://cupidmatch.co.uk",
    );
  } finally {
    if (previous !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
test("explicit server site URL remains authoritative and normalized", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example/";
  try {
    assert.equal(
      load("src/lib/supabase/env.ts").getSiteUrl(),
      "https://preview.example",
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
function usageHarness(error = null) {
  const filters = [];
  const chain = {
    select: () => chain,
    eq: (k, v) => {
      filters.push([k, v]);
      return chain;
    },
    maybeSingle: async () => ({
      data: error ? null : { used_count: 7 },
      error,
    }),
  };
  const api = load("src/app/api/subscription/usage/[feature]/route.ts", {
    "@/lib/subscriptions/server": {
      getServerSubscription: async () => ({
        user: { id: "member-fixture" },
        plan: { entitlements: { interestsPerMonth: 10 } },
      }),
    },
    "@/lib/subscriptions/usage": {
      usageDecision: (_entitlements, _feature, used) => ({
        used,
        remaining: 10 - used,
      }),
    },
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({ from: () => chain }),
    },
  });
  return {
    filters,
    get: () =>
      api.GET(
        new Request(
          "https://preview.example/api/subscription/usage/interestsPerMonth",
        ),
        { params: Promise.resolve({ feature: "interestsPerMonth" }) },
      ),
  };
}
test("usage endpoint reads the authenticated member current-period count instead of reporting zero", async () => {
  const h = usageHarness(),
    r = await h.get();
  assert.equal(r.body.used, 7);
  assert.equal(r.body.remaining, 3);
  assert.deepEqual(h.filters.slice(0, 2), [
    ["user_id", "member-fixture"],
    ["feature_key", "interestsPerMonth"],
  ]);
  assert.match(h.filters[2][1], /^\d{4}-\d{2}-01$/);
});
test("usage read failure is retryable and never presented as a zero count", async () => {
  const h = usageHarness({ code: "connection_failed" }),
    r = await h.get();
  assert.equal(r.status, 503);
  assert.equal("used" in r.body, false);
});

test("all primary brand entry points use the one canonical CupidMatch logo", () => {
  const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const shared = read("src/components/shared/Logo.tsx");
  const navbar = read("src/components/navigation/Navbar.tsx");
  const layout = read("src/app/layout.tsx");
  const social = read("src/app/opengraph-image.tsx");
  assert.match(shared, /CUPIDMATCH_LOGO = ["']\/images\/cupidmatch-logo-new\.png["']/);
  assert.match(navbar, /<Logo\b/);
  assert.doesNotMatch(navbar, /cupidmatch-logo(?:-new)?\.png/);
  assert.equal((layout.match(/\/images\/cupidmatch-logo-new\.png/g) || []).length, 3);
  assert.match(social, /cupidmatch\.co\.uk\/images\/cupidmatch-logo-new\.png/);
  assert.doesNotMatch(social, /matrimony-with-studio\.vercel\.app\/images/);
});
