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
  const req = (n) => {
    if (n === "server-only") return {};
    if (n === "next/server")
      return {
        NextResponse: {
          json: (body, init) => ({ body, status: init?.status || 200 }),
        },
      };
    if (n === "zod" || n === "react/jsx-runtime" || n.startsWith("node:"))
      return require(n);
    if (n in mocks) return mocks[n];
    const local = {
      "@/lib/admin/http": "src/lib/admin/http.ts",
      "@/lib/providers/email-signature": "src/lib/providers/email-signature.ts",
    }[n];
    if (local) return load(local, mocks);
    throw Error("Unexpected import " + n);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(
    req,
    mod,
    mod.exports,
  );
  return mod.exports;
}
for (const [plan, expected] of [
  ["premium", "/membership?plan=premium"],
  ["premium_plus", "/membership?plan=premium_plus"],
  ["https://evil.example", "/membership"],
])
  test(
    "membership sign-in preserves only a supported plan: " + plan,
    async () => {
      let destination;
      const page = load("src/app/membership/page.tsx", {
        "@/components/account/BillingActions": {},
        "@/components/account/BillingHistory": {},
        "@/components/account/CheckoutResult": {},
        "next/link": {},
        "next/navigation": {
          redirect: (value) => {
            destination = value;
            throw new Error("redirect");
          },
        },
        "@/lib/supabase/server": {
          createSupabaseServerClient: async () => ({
            auth: { getUser: async () => ({ data: { user: null } }) },
          }),
        },
        "@/lib/subscriptions/server": {
          getServerSubscription: () => {
            throw new Error("Must redirect before data reads");
          },
        },
      });
      await assert.rejects(
        page.default({ searchParams: Promise.resolve({ plan }) }),
        /redirect/,
      );
      assert.equal(destination, `/login?next=${encodeURIComponent(expected)}`);
    },
  );
const user = {
    id: "70000000-0000-4000-8000-000000000001",
    email: "fixture@example.test",
  },
  requestId = "70000000-0000-4000-8000-000000000002";
const request = (url, body) =>
  new Request("https://preview.example" + url, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
const configured = {
  "@/lib/subscriptions/checkout": {
    billingConfigured: () => true,
    assertBillingConfiguration: () => {},
  },
  "@/lib/subscriptions/server": {
    getServerSubscription: async () => ({
      user,
      plan: { code: "free" },
      subscription: null,
    }),
  },
};
test("Svix published vector is accepted; tampering and expired timestamps are rejected", () => {
  const { verifyEmailSignature } = load("src/lib/providers/email-signature.ts"),
    payload = '{"event_type":"ping","data":{"success":true}}',
    headers = new Headers({
      "svix-id": "msg_loFOjxBNrRLzqYUf",
      "svix-timestamp": "1731705121",
      "svix-signature": "v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0=",
    }),
    secret = "whsec_plJ3nmyCDGBKInavdOK15jsl";
  assert.equal(
    verifyEmailSignature(payload, headers, secret, 1731705121000),
    "msg_loFOjxBNrRLzqYUf",
  );
  assert.throws(() =>
    verifyEmailSignature(payload + " ", headers, secret, 1731705121000),
  );
  assert.throws(() =>
    verifyEmailSignature(payload, headers, secret, 1731705521000),
  );
});
test("invoice history scopes customer, cursor and provider links", async () => {
  let query;
  const { billingHistory } = load("src/lib/providers/billing-history.ts", {
    "./stripe": {
      getStripe: () => ({
        invoices: {
          list: async (q) => {
            query = q;
            return {
              has_more: true,
              data: [
                {
                  id: "in_one",
                  customer: "cus_one",
                  livemode: false,
                  created: 1700000000,
                  currency: "gbp",
                  amount_due: 799,
                  amount_paid: 799,
                  hosted_invoice_url: "https://evil.example/invoice",
                  invoice_pdf: "https://pay.stripe.com/invoice/pdf",
                },
              ],
            };
          },
        },
      }),
    },
  });
  const result = await billingHistory("cus_one", "in_previous");
  assert.deepEqual(query, {
    customer: "cus_one",
    limit: 10,
    starting_after: "in_previous",
  });
  assert.equal(result.invoices[0].hostedUrl, null);
  assert.equal(result.next, "in_one");
});
for (const foreign of [true, false])
  test(
    "invoice history rejects " +
      (foreign ? "foreign customer" : "live invoice"),
    async () => {
      const { billingHistory } = load("src/lib/providers/billing-history.ts", {
        "./stripe": {
          getStripe: () => ({
            invoices: {
              list: async () => ({
                data: [
                  {
                    customer: foreign ? "cus_other" : "cus_one",
                    livemode: !foreign,
                  },
                ],
              }),
            },
          }),
        },
      });
      await assert.rejects(billingHistory("cus_one"));
    },
  );
function sessionHarness(session, subscription = null) {
  return load("src/app/api/billing/session/route.ts", {
    ...configured,
    "@/lib/subscriptions/server": {
      getServerSubscription: async () => ({
        user,
        plan: { code: "free" },
        subscription,
      }),
    },
    "@/lib/providers/stripe": {
      isProviderTestMember: () => true,
      getStripe: () => ({
        checkout: { sessions: { retrieve: async () => session } },
      }),
      providerError: () => "Unavailable",
    },
  });
}
test("checkout belonging to another member is not disclosed", async () => {
  const api = sessionHarness({
    client_reference_id: "other",
    metadata: { member_id: "other" },
  });
  assert.equal(
    (await api.GET(request("/api/billing/session?session_id=cs_test_fixture")))
      .status,
    404,
  );
});
test("paid checkout return cannot grant access without webhook state", async () => {
  const api = sessionHarness({
    client_reference_id: user.id,
    metadata: { member_id: user.id },
    subscription: "sub_one",
    status: "complete",
    payment_status: "paid",
  });
  const r = await api.GET(
    request("/api/billing/session?session_id=cs_test_fixture"),
  );
  assert.equal(r.body.synchronized, false);
  assert.equal(r.body.plan, "free");
});
test("checkout return confirms only its stored subscription", async () => {
  const api = sessionHarness(
    {
      client_reference_id: user.id,
      metadata: { member_id: user.id },
      subscription: "sub_one",
    },
    { provider_subscription_id: "sub_one" },
  );
  assert.equal(
    (await api.GET(request("/api/billing/session?session_id=cs_test_fixture")))
      .body.synchronized,
    true,
  );
});
function checkoutHarness({
  locked = true,
  subscriptions = [],
  open = [],
} = {}) {
  const calls = [];
  const stripe = {
    customers: {
      create: async () => {
        throw Error("Customer already bound");
      },
    },
    subscriptions: {
      list: async () => ({ data: subscriptions, has_more: false }),
    },
    checkout: {
      sessions: {
        list: async () => ({ data: open, has_more: false }),
        expire: async (id) => calls.push(["expire", id]),
        create: async (body, options) => {
          calls.push(["create", body, options]);
          return { url: "https://checkout.stripe.com/test" };
        },
      },
    },
  };
  const api = load("src/app/api/billing/checkout/route.ts", {
    ...configured,
    "@/lib/providers/stripe": {
      isProviderTestMember: () => true,
      validatedPrice: async () => "price_one",
      getStripe: () => stripe,
      providerError: () => "Unavailable",
    },
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        rpc: async () => ({ data: true }),
      }),
    },
    "@/lib/supabase/service": {
      serviceClient: () => ({
        rpc: async (n, a) => {
          calls.push([n, a]);
          return {
            data: n === "billing_customer" ? "cus_one" : a.p_release || locked,
          };
        },
      }),
    },
  });
  return {
    api,
    calls,
    post: () =>
      api.POST(
        request("/api/billing/checkout", {
          plan: "premium",
          term: "monthly",
          requestId,
        }),
      ),
  };
}
test("concurrent checkout is rejected before creating provider sessions", async () => {
  const h = checkoutHarness({ locked: false });
  assert.equal((await h.post()).status, 409);
  assert.equal(
    h.calls.some((c) => c[0] === "create"),
    false,
  );
});
for (const status of ["active", "past_due", "incomplete", "unpaid", "paused"])
  test(
    "checkout rejects existing provider subscription " + status,
    async () => {
      const h = checkoutHarness({ subscriptions: [{ status }] });
      assert.equal((await h.post()).status, 409);
      assert.equal(
        h.calls.some((c) => c[0] === "create"),
        false,
      );
      assert.equal(h.calls.at(-1)[1].p_release, true);
    },
  );
test("checkout reuses a matching pending session", async () => {
  const h = checkoutHarness({
    open: [
      {
        id: "cs_test_existing",
        livemode: false,
        client_reference_id: user.id,
        metadata: { plan: "premium", term: "monthly" },
        url: "https://checkout.stripe.com/existing",
      },
    ],
  });
  assert.equal(
    (await h.post()).body.url,
    "https://checkout.stripe.com/existing",
  );
  assert.equal(
    h.calls.some((c) => c[0] === "create"),
    false,
  );
});
test("checkout expires changed choices and creates idempotent customer-scoped session", async () => {
  const h = checkoutHarness({
    open: [
      {
        id: "cs_test_old",
        livemode: false,
        client_reference_id: user.id,
        metadata: { plan: "premium_plus", term: "monthly" },
      },
    ],
  });
  assert.equal((await h.post()).status, 200);
  const created = h.calls.find((c) => c[0] === "create");
  assert.equal(
    h.calls.some((c) => c[0] === "expire"),
    true,
  );
  assert.equal(created[1].customer, "cus_one");
  assert.equal(created[1].allow_promotion_codes, true);
  assert.match(created[1].success_url, /session_id=\{CHECKOUT_SESSION_ID\}/);
  assert.equal(created[2].idempotencyKey, `checkout:${user.id}:${requestId}`);
});
const job = { id: requestId, member_id: user.id, lease: requestId };
function refundHarness({ foreign = false, prior = null } = {}) {
  const calls = [];
  const service = {
    rpc: async (name, args) => {
      calls.push([name, args]);
      return {};
    },
    from: (table) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({
          data:
            table === "provider_operations"
              ? prior
              : {
                  provider_customer_id: "cus_one",
                  provider_subscription_id: "sub_one",
                },
        }),
      };
      return chain;
    },
  };
  const api = load("src/app/api/admin/payments/route.ts", {
    "@/lib/auth/admin": { requireServerAdmin: async () => ({ id: requestId }) },
    "@/lib/supabase/server": {
      createSupabaseServerClient: async () => ({
        rpc: async () => ({ data: requestId }),
      }),
    },
    "@/lib/supabase/service": {
      serviceConfigured: () => true,
      serviceClient: () => service,
    },
    "@/lib/subscriptions/checkout": { billingConfigured: () => true },
    "@/lib/providers/billing-history": {},
    "@/lib/providers/stripe": {
      isProviderTestMember: () => true,
      providerError: () => "Unavailable",
      getStripe: () => ({
        charges: {
          retrieve: async () => ({
            id: "ch_one",
            customer: foreign ? "cus_other" : "cus_one",
            livemode: false,
            currency: "gbp",
            paid: true,
            amount: 799,
            amount_refunded: 0,
          }),
        },
        refunds: {
          create: async (args, options) => {
            calls.push(["refund", args, options]);
            return { id: "re_one" };
          },
        },
      }),
    },
  });
  return {
    calls,
    post: () =>
      api.POST(
        request("/api/admin/payments", {
          memberId: user.id,
          action: "refund",
          chargeId: "ch_one",
          amount: 799,
          reason: "Authorised fixture refund review",
          requestId,
        }),
      ),
  };
}
test("foreign refund is denied and the audit operation is failed rather than left pending", async () => {
  const h = refundHarness({ foreign: true });
  assert.equal((await h.post()).status, 400);
  assert.equal(
    h.calls.some((c) => c[0] === "refund"),
    false,
  );
  assert.equal(h.calls.at(-1)[1].p_status, "failed");
  assert.equal(h.calls.at(-1)[1].p_reference, "validation_failed");
});
test("successful refund retry replays the stored result without a second provider operation", async () => {
  const h = refundHarness({
    prior: { status: "succeeded", provider_reference: "re_existing" },
  });
  const result = await h.post();
  assert.equal(result.body.reference, "re_existing");
  assert.equal(result.body.replayed, true);
  assert.equal(h.calls.length, 0);
});
test("authorised mock refund is scoped, idempotent and audited", async () => {
  const h = refundHarness();
  assert.equal((await h.post()).body.reference, "re_one");
  const call = h.calls.find((c) => c[0] === "refund");
  assert.equal(call[1].charge, "ch_one");
  assert.equal(call[2].idempotencyKey, `refund:${requestId}`);
  assert.equal(h.calls.at(-1)[1].p_status, "succeeded");
});
function erasureHarness(failure) {
  const calls = [];
  let files = 0;
  const db = {
    rpc: async (n, a) => {
      calls.push(a.p_stage);
      return {
        data:
          a.p_stage === "inventory"
            ? {
                customers: failure === "provider" ? ["cus_one"] : [],
                identities: [],
              }
            : a.p_stage === "files"
              ? files++ === 0
                ? [{ bucket: "media", path: `users/${user.id}/photo.png` }]
                : []
              : {},
      };
    },
    auth: {
      admin: {
        updateUserById: async () => {
          calls.push("ban");
          return {};
        },
        deleteUser: async () => {
          calls.push("auth-delete");
          return failure === "auth" ? { error: { status: 503 } } : {};
        },
      },
    },
    storage: {
      from: () => ({
        remove: async () => {
          calls.push("remove-file");
          return failure === "storage"
            ? { error: { message: "storage down" } }
            : {};
        },
      }),
    },
  };
  return {
    calls,
    run: () =>
      load("src/lib/account/deletion.ts", {
        "@/lib/providers/stripe": { isProviderTestMember: () => false },
      }).eraseApprovedAccount(db, job),
  };
}
test("erasure removes files before records/auth and confirms completion last", async () => {
  const h = erasureHarness();
  await h.run();
  assert.deepEqual(h.calls, [
    "inventory",
    "ban",
    "files",
    "remove-file",
    "files",
    "records",
    "auth-delete",
    "complete",
  ]);
});
for (const failure of ["storage", "auth", "provider"])
  test(
    "erasure never claims completion after " + failure + " failure",
    async () => {
      const h = erasureHarness(failure);
      await assert.rejects(h.run());
      assert.equal(h.calls.includes("complete"), false);
      if (failure !== "auth")
        assert.equal(h.calls.includes("auth-delete"), false);
    },
  );
test("erasure worker refuses unapproved retention before database access", async () => {
  const previous = { ...process.env };
  process.env.CRON_SECRET = "fixture";
  process.env.ACCOUNT_DELETION_ENABLED = "true";
  process.env.RETENTION_POLICY_APPROVED = "false";
  try {
    const api = load("src/app/api/jobs/account-deletion/route.ts", {
      "@/lib/supabase/service": {
        serviceConfigured: () => true,
        serviceClient: () => {
          throw Error("Must not access database");
        },
      },
      "@/lib/account/deletion": {},
    });
    assert.equal(
      (
        await api.GET(
          new Request("https://preview.example/api/jobs/account-deletion", {
            headers: { Authorization: "Bearer fixture" },
          }),
        )
      ).status,
      503,
    );
  } finally {
    process.env = previous;
  }
});
test("live email delivery requires explicit operator configuration before claiming jobs", async () => {
  const previous = { ...process.env };
  Object.assign(process.env, {
    CRON_SECRET: "fixture",
    EMAIL_NOTIFICATIONS_ENABLED: "true",
    RESEND_API_KEY: "fixture",
    EMAIL_FROM: "fixture@example.test",
    RESEND_WEBHOOK_SECRET: "whsec_fixture",
    EMAIL_DELIVERY_MODE: "live",
  });
  delete process.env.EMAIL_LIVE_DELIVERY_APPROVED;
  try {
    const api = load("src/app/api/jobs/email/route.ts", {
      "@/lib/supabase/service": {
        serviceConfigured: () => true,
        serviceClient: () => {
          throw Error("Must not claim jobs");
        },
      },
    });
    assert.equal(
      (
        await api.GET(
          new Request("https://preview.example/api/jobs/email", {
            headers: { Authorization: "Bearer fixture" },
          }),
        )
      ).status,
      503,
    );
  } finally {
    process.env = previous;
  }
});
test("unsigned email delivery webhook never writes state", async () => {
  const previous = process.env.RESEND_WEBHOOK_SECRET;
  process.env.RESEND_WEBHOOK_SECRET = "whsec_Zml4dHVyZQ==";
  try {
    const api = load("src/app/api/email/webhook/route.ts", {
      "@/lib/supabase/service": {
        serviceConfigured: () => true,
        serviceClient: () => {
          throw Error("Must not access database");
        },
      },
    });
    assert.equal(
      (await api.POST(request("/api/email/webhook", {}))).status,
      400,
    );
  } finally {
    if (previous === undefined) delete process.env.RESEND_WEBHOOK_SECRET;
    else process.env.RESEND_WEBHOOK_SECRET = previous;
  }
});
