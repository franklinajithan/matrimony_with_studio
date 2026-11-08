import { expect, test } from "@playwright/test";

// Read-only coverage. These pages contain public content and are not gated
// by member/admin logins. No form submission, payments or account creation.
const publicRoutes = [
  "/", "/about", "/features", "/how-it-works", "/contact", "/feedback",
  "/safety", "/pricing", "/success-stories", "/blog",
  "/matrimony-guides", "/matrimony-biodata-guide",
  "/international-matrimony", "/family-assisted-matrimony",
  "/horoscope-matching", "/tamil-matrimony-uk", "/sinhala-matrimony",
  "/indian-matrimony-uk", "/sri-lankan-matrimony-uk",
  "/sri-lankan-matrimony-canada", "/sri-lankan-matrimony-australia",
  "/sri-lankan-matrimony-france", "/sri-lankan-matrimony-germany",
  "/sri-lankan-matrimony-switzerland", "/sri-lankan-matrimony-sri-lanka",
  "/analytics-privacy",
] as const;

for (const path of publicRoutes) {
  test(`PUBLIC-ROUTE ${path} loads with a page title and no fatal client errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `HTTP status at ${path}`).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveTitle(/\S/);
    await expect(page.getByText("Application error: a client-side exception has occurred")).toHaveCount(0);
    expect(errors, `uncaught browser exceptions on ${path}`).toEqual([]);
  });
}

test("SEO robots, sitemap and web manifest resolve", async ({ request }) => {
  const paths = ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest"];
  for (const path of paths) {
    const response = await request.get(path, { failOnStatusCode: false });
    expect(response.status(), `HTTP status for ${path}`).toBeLessThan(400);
    expect((await response.body()).length, `non-empty ${path}`).toBeGreaterThan(0);
  }
});

test("anonymous admin and member routes never render privileged account content", async ({ page }) => {
  const paths = ["/admin", "/admin/users", "/admin/payments", "/admin/analytics", "/admin/security", "/dashboard", "/messages", "/connections"];
  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `unexpected server response for ${path}`).toBeLessThan(500);
    // Redirect, login gate, or a forbidden state are valid. Verify that the
    // final page is NOT a privileged route with visible private dashboard UI.
    const finalPath = new URL(page.url()).pathname;
    if (finalPath.startsWith("/admin") || ["/dashboard", "/messages", "/connections"].includes(finalPath)) {
      // Server may return a guarded shell before client hydration; give the
      // route one chance to redirect or render its login gate.
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).toBeVisible();
      const privateMarkers = page.locator('[data-testid="admin-users-table"], [data-testid="admin-payment-list"], [data-testid="message-composer"]');
      await expect(privateMarkers).toHaveCount(0);
    }
  }
});
