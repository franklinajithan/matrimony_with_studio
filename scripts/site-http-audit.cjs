// Read-only anonymous HTTP checks against a disposable production server.
// No browser automation, member mutations, provider sends or live credentials.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const port = 3127,
  origin = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://qa-fixture.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon-key",
      NEXT_PUBLIC_SITE_URL: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let output = "";
server.stdout.on("data", (b) => (output += b));
server.stderr.on("data", (b) => (output += b));
const results = [],
  pages = new Map();
function record(check, passed, detail = "") {
  results.push({ check, passed, detail });
  if (!passed) console.log("FAIL", check, detail);
}
async function get(route, method = "GET") {
  const r = await fetch(origin + route, {
    method,
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    ...(method === "POST"
      ? { headers: { "Content-Type": "application/json" }, body: "{}" }
      : {}),
  });
  return {
    status: r.status,
    location: r.headers.get("location"),
    cache: r.headers.get("cache-control"),
    body: await r.text(),
  };
}
async function main() {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error("Server readiness timeout: " + output.slice(-1000))),
      20000,
    );
    const check = setInterval(() => {
      if (output.includes("Ready in")) {
        clearInterval(check);
        clearTimeout(timer);
        resolve();
      } else if (server.exitCode !== null) {
        clearInterval(check);
        clearTimeout(timer);
        reject(Error(output.slice(-1000)));
      }
    }, 100);
  });
  const publicRoutes = [
    "/",
    "/faq",
    "/about",
    "/features",
    "/pricing",
    "/launch-pricing",
    "/blog",
    "/safety",
    "/contact",
    "/success-stories",
    "/privacy",
    "/terms",
    "/community-guidelines",
    "/accessibility",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  for (const route of publicRoutes) {
    const r = await get(route);
    pages.set(route, r.body);
    record("Public " + route, r.status === 200, String(r.status));
    record(
      "Heading " + route,
      /<h1\b/i.test(r.body) ||
        ["/login", "/signup", "/forgot-password", "/reset-password"].includes(
          route,
        ),
      "No h1 in server HTML",
    );
  }
  const protectedRoutes = [
    "/success-stories/submit",
    "/dashboard",
    "/discover",
    "/shortlist",
    "/interests",
    "/connections",
    "/messages",
    "/profile",
    "/settings",
    "/family-circle",
    "/future-map",
    "/support",
    "/verification",
    "/biodata",
    "/admin",
    "/admin/users",
    "/admin/reports",
    "/admin/operations",
    "/admin/support",
    "/admin/plans",
    "/membership?plan=premium",
  ];
  for (const route of protectedRoutes) {
    const r = await get(route);
    const target = r.location ? new URL(r.location, origin) : null;
    record(
      "Protected " + route,
      [307, 308].includes(r.status) && target?.pathname === "/login",
      `${r.status} ${target?.pathname || ""}`,
    );
    record(
      "Protected cache " + route,
      r.cache?.includes("no-store"),
      r.cache || "missing",
    );
    if (target)
      record(
        "Destination " + route,
        target.searchParams.get("next") === route,
        target.searchParams.get("next") || "missing",
      );
  }
  for (const route of [
    "/api/qa/whoami",
    "/api/billing/config",
    "/api/billing/status",
    "/api/billing/history",
    "/api/billing/session",
    "/api/communication",
    "/api/support",
    "/api/members/notices",
    "/api/onboarding/draft",
    "/api/admin/members",
    "/api/admin/summary",
    "/api/admin/staff",
    "/api/admin/payments",
    "/api/admin/email-delivery",
  ]) {
    const r = await get(route);
    record(
      "Anonymous API " + route,
      [401, 403].includes(r.status),
      String(r.status),
    );
  }
  const workspace = await get("/api/workspace", "POST");
  record(
    "Anonymous workspace POST",
    workspace.status === 401,
    String(workspace.status),
  );
  const fragments = [];
  for (const [route, html] of pages)
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const href = match[1].replaceAll("&amp;", "&");
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      const url = new URL(href, origin);
      if (url.hash)
        fragments.push({
          from: route,
          to: url.pathname,
          hash: decodeURIComponent(url.hash.slice(1)),
        });
    }
  for (const f of fragments) {
    const html = pages.get(f.to);
    if (html)
      record(
        `Anchor ${f.from} → ${f.to}#${f.hash}`,
        new RegExp(
          `\\bid=["']${f.hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
        ).test(html),
        "Missing anchor",
      );
  }
  const linked = new Set();
  for (const html of pages.values())
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const href = match[1].replaceAll("&amp;", "&");
      if (href.startsWith("/") && !href.startsWith("//")) {
        const url = new URL(href, origin);
        if (!pages.has(url.pathname) && !url.pathname.startsWith("/api/"))
          linked.add(url.pathname + url.search);
      }
    }
  for (const route of linked) {
    const r = await get(route);
    record(
      "Linked destination " + route,
      [200, 307, 308].includes(r.status),
      String(r.status),
    );
  }
  const missing = await get("/qa-page-does-not-exist");
  record("Unknown page 404", missing.status === 404, String(missing.status));
  for (const route of ["/share/profile/invalid", "/share/biodata/invalid"]) {
    const r = await get(route);
    record(
      "Invalid share " + route,
      [200, 400, 404].includes(r.status) && !r.body.includes("NEXT_REDIRECT"),
      String(r.status),
    );
  }
  const sitemap = await get("/sitemap.xml");
  record(
    "Sitemap",
    sitemap.status === 200 && sitemap.body.includes("https://cupidmatch.co.uk"),
    String(sitemap.status),
  );
  const robots = await get("/robots.txt");
  record(
    "Robots",
    robots.status === 200 && robots.body.includes("Disallow: /admin"),
    String(robots.status),
  );
  const failed = results.filter((r) => !r.passed);
  const report = {
    checkedAt: new Date().toISOString(),
    target:
      "disposable production HTTP server; fixture Supabase configuration; no signed-in browser/provider acceptance",
    checks: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
  fs.writeFileSync(
    "/tmp/cupidmatch-site-http-audit.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify({
      checks: report.checks,
      passed: report.passed,
      failed: report.failed,
    }),
  );
  if (failed.length) process.exitCode = 1;
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => server.kill("SIGTERM"));
