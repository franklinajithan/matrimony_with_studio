const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript"),
  Stripe = require("stripe");
const sdk = new Stripe("sk_test_fixture");
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const mod = { exports: {} };
  function req(name) {
    if (name === "server-only") return {};
    if (name === "next/server")
      return {
        NextResponse: {
          json: (body, init) => ({ body, status: init?.status || 200 }),
        },
      };
    if (name === "zod") return require("zod");
    if (name === "@/lib/admin/http")
      return load("src/lib/admin/http.ts", mocks);
    if (name === "stripe") return Stripe;
    if (name.startsWith("node:")) return require(name);
    if (name in mocks) return mocks[name];
    throw Error("Unexpected import " + name);
  }
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(
    req,
    mod,
    mod.exports,
  );
  return mod.exports;
}
function req(url, body, signature) {
  return new Request("https://preview.example" + url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signature ? { "stripe-signature": signature } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const secret = "whsec_fixture";
process.env.STRIPE_WEBHOOK_SECRET = secret;
process.env.STRIPE_IDENTITY_WEBHOOK_SECRET = secret;
function signed(event) {
  const raw = JSON.stringify(event);
  return {
    raw,
    signature: sdk.webhooks.generateTestHeaderString({ payload: raw, secret }),
  };
}
function billingHarness(subscription) {
  const writes = [];
  const api = load("src/app/api/billing/webhook/route.ts", {
    "@/lib/providers/stripe": {
      getStripe: () => ({
        webhooks: sdk.webhooks,
        subscriptions: { retrieve: async () => subscription },
      }),
      priceMapping: (id) =>
        id === "price_fixture" ? { plan: "premium", term: "monthly" } : null,
      validatedPrice: async () => "price_fixture",
    },
    "@/lib/supabase/service": {
      serviceClient: () => ({
        rpc: async (name, args) => {
          writes.push({ name, args });
          return { error: null };
        },
      }),
    },
  });
  return { api, writes };
}
test("billing webhook rejects unsigned and tampered bodies without database writes", async () => {
  const { api, writes } = billingHarness({});
  assert.equal((await api.POST(req("/api/billing/webhook", {}))).status, 400);
  const e = signed({
    id: "evt_bad",
    type: "customer.subscription.updated",
    livemode: false,
    data: { object: { id: "sub_test" } },
  });
  assert.equal(
    (await api.POST(req("/api/billing/webhook", e.raw + " ", e.signature)))
      .status,
    400,
  );
  assert.equal(writes.length, 0);
});
for (const [provider, status] of [
  ["active", "active"],
  ["past_due", "past_due"],
  ["canceled", "cancelled"],
  ["unpaid", "expired"],
])
  test(
    "signed subscription event stores authoritative " + provider,
    async () => {
      const sub = {
        id: "sub_fixture",
        customer: "cus_fixture",
        status: provider,
        metadata: { member_id: "00000000-0000-4000-8000-000000000004" },
        items: {
          data: [
            {
              price: { id: "price_fixture" },
              current_period_start: 1700000000,
              current_period_end: 1900000000,
            },
          ],
        },
        cancel_at_period_end: provider === "canceled",
      };
      const { api, writes } = billingHarness(sub);
      const e = signed({
        id: "evt_" + provider,
        type: "customer.subscription.updated",
        created: 1800000000,
        livemode: false,
        data: { object: { id: "sub_fixture", status: "active" } },
      });
      assert.equal(
        (await api.POST(req("/api/billing/webhook", e.raw, e.signature)))
          .status,
        200,
      );
      assert.equal(writes[0].args.p_status, status);
      assert.equal(writes[0].args.p_member_id, sub.metadata.member_id);
    },
  );
test("unrecognized Stripe price and live-mode event never grant membership", async () => {
  const { api, writes } = billingHarness({
    items: { data: [{ price: { id: "price_unknown" } }] },
    metadata: { member_id: "fake" },
  });
  let e = signed({
    id: "evt_unknown",
    type: "customer.subscription.updated",
    livemode: false,
    data: { object: { id: "sub_fixture" } },
  });
  assert.equal(
    (await api.POST(req("/api/billing/webhook", e.raw, e.signature))).status,
    503,
  );
  e = signed({
    id: "evt_live",
    type: "customer.subscription.updated",
    livemode: true,
    data: { object: { id: "sub_fixture" } },
  });
  assert.equal(
    (await api.POST(req("/api/billing/webhook", e.raw, e.signature))).status,
    400,
  );
  assert.equal(writes.length, 0);
});
test("identity webhook requires signature and stores test evidence without profile approval", async () => {
  const writes = [];
  const api = load("src/app/api/identity/webhook/route.ts", {
    "@/lib/providers/stripe": {
      getStripe: () => ({
        webhooks: sdk.webhooks,
        identity: {
          verificationSessions: {
            retrieve: async () => ({
              id: "vs_fixture",
              status: "verified",
              livemode: false,
            }),
          },
        },
      }),
    },
    "@/lib/supabase/service": {
      serviceClient: () => ({
        rpc: async (name, args) => {
          writes.push({ name, args });
          return { error: null };
        },
      }),
    },
  });
  assert.equal((await api.POST(req("/api/identity/webhook", {}))).status, 400);
  const e = signed({
    id: "evt_id",
    type: "identity.verification_session.verified",
    livemode: false,
    data: { object: { id: "vs_fixture" } },
  });
  assert.equal(
    (await api.POST(req("/api/identity/webhook", e.raw, e.signature))).status,
    200,
  );
  assert.equal(writes[0].name, "apply_identity_event");
  assert.equal(writes[0].args.p_livemode, false);
  assert.equal("is_verified" in writes[0].args, false);
});
test("attachment content signature and size validation", () => {
  const { validAttachment } = load("src/lib/communication/files.ts");
  assert.equal(
    validAttachment(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
    ),
    true,
  );
  assert.equal(
    validAttachment(
      new TextEncoder().encode("<script>alert(1)</script>"),
      "image/png",
    ),
    false,
  );
  assert.equal(
    validAttachment(new TextEncoder().encode("%PDF-1.7"), "application/pdf"),
    true,
  );
  assert.equal(validAttachment(new Uint8Array(5242881), "image/png"), false);
  assert.equal(
    validAttachment(new TextEncoder().encode("<svg/>"), "image/svg+xml"),
    false,
  );
});
test("anonymous workspace requests cannot reach the database", async () => {
  const api = load("src/app/api/workspace/route.ts", {
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
        rpc: () => {
          throw Error("Unauthorized SQL");
        },
      }),
    },
  });
  assert.equal(
    (await api.POST(req("/api/workspace", { action: "plan_list" }))).status,
    401,
  );
});
test("phone verification applies server attempt limits before sending", async () => {
  let sent = 0;
  process.env.SMS_ENABLED = "true";
  const api = load("src/app/api/phone/route.ts", {
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        auth: {
          getUser: async () => ({ data: { user: { id: "fixture" } } }),
          updateUser: () => {
            sent++;
            throw Error("Must not send");
          },
        },
        rpc: async () => ({ error: { code: "22023" } }),
      }),
    },
  });
  assert.equal(
    (
      await api.POST(
        req("/api/phone", { action: "send", phone: "+447700900123" }),
      )
    ).status,
    429,
  );
  assert.equal(sent, 0);
  delete process.env.SMS_ENABLED;
});
