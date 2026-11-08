import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/", "/about", "/pricing", "/contact", "/safety", "/success-stories",
  "/matrimony-guides", "/matrimony-biodata-guide", "/privacy", "/terms",
  "/community-guidelines", "/accessibility", "/feedback", "/analytics-privacy",
  "/signup", "/login",
];

const adminRoutes = [
  "/admin", "/admin/users", "/admin/verifications", "/admin/registration",
  "/admin/plans", "/admin/subscriptions", "/admin/payments", "/admin/promo-codes",
  "/admin/feedback", "/admin/analytics", "/admin/success-stories",
  "/admin/horoscope", "/admin/security",
];

test.describe("Public HTTP smoke", () => {
  test.describe.configure({ mode: "parallel" });

  for (const route of publicRoutes) {
    test(`public page responds and renders: ${route}`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/html");
      expect(await response.text()).not.toContain("Application error: a server-side exception");
    });
  }

  for (const route of adminRoutes) {
    test(`guest cannot open ${route}`, async ({ request }) => {
      const response = await request.get(route, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(response.headers().location).toMatch(/\/login(?:\?|$)/);
    });
  }

  test("guest cannot read onboarding or delete members", async ({ request }) => {
    expect((await request.get("/api/onboarding/draft")).status()).toBe(401);
    expect((await request.post("/api/admin/delete-member", { data: {} })).status()).toBe(403);
  });

  test("sitemap and robots reference the public site", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    const body = await sitemap.text();
    expect(body).toContain("/matrimony-biodata-guide</loc>");
    expect(body).not.toMatch(/<loc>[^<]*\/(admin|dashboard|messages)(\/|<)/);
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toMatch(/Sitemap: https:\/\/cupidmatch\.co\.uk\/sitemap\.xml/i);
  });
});

test("signup blocks incomplete details and exposes both password toggles", async ({ page }) => {
  await page.goto("/signup");
  const show = page.getByRole("button", { name: "Show password" });
  await expect(show).toHaveCount(2);
  await show.first().click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("You must accept the terms to continue.")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("analytics controls live on the privacy page and remember decline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Analytics settings" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Optional visitor analytics" })).toHaveCount(0);
  await page.getByRole("link", { name: "Analytics settings" }).click();
  await expect(page.getByRole("status")).toHaveText("Analytics are off.");
  await page.getByRole("button", { name: "Decline analytics" }).click();
  await page.reload();
  await expect(page.getByRole("status")).toHaveText("Analytics are off.");
  expect((await page.context().cookies()).find(({ name }) => name === "cm_analytics")?.value).toBe("no");
});

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
}

test("regular member is denied admin pages and admin writes", async ({ page }) => {
  const email = process.env.QA_USER_A_EMAIL;
  const password = process.env.QA_USER_A_PASSWORD;
  test.skip(!email || !password, "Dedicated member QA credentials are required.");
  await signIn(page, email!, password!);
  await page.goto("/admin/feedback");
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  expect((await page.request.post("/api/admin/delete-member", { data: {} })).status()).toBe(403);
});

test("admin can open every workspace tab and refresh overview", async ({ page }, testInfo) => {
  const email = process.env.QA_ADMIN_EMAIL;
  const password = process.env.QA_ADMIN_PASSWORD;
  test.skip(!email || !password, "Dedicated admin QA credentials are required.");
  test.setTimeout(150_000);
  await signIn(page, email!, password!);
  await page.goto("/admin");
  await expect(page.getByRole("main")).toBeVisible();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);

  for (const route of adminRoutes) {
    await test.step(route, async () => {
      if (testInfo.project.name === "chromium") {
        await page.getByRole("navigation", { name: "Admin navigation" }).locator(`a[href="${route}"]`).click();
      } else {
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
      }
      await expect.poll(async () => new URL(page.url()).pathname).toBe(route);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByText("Admin access could not be verified.", { exact: false })).toHaveCount(0);
      await expect(page.getByText("Application error:", { exact: false })).toHaveCount(0);
    });
  }
});
