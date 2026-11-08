import { expect, test } from "@playwright/test";

/** Non-mutating smoke checks; safe for staging or production. */
test.describe("public site smoke", () => {
  test("homepage responds and has no uncaught client errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("public internal links do not return server errors", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const hrefs = await page.locator("a[href]").evaluateAll(els =>
      els.map(el => (el as HTMLAnchorElement).href)
    );
    const origin = new URL(page.url()).origin;
    const urls = [...new Set(hrefs)].filter(href => {
      try { return new URL(href).origin === origin; } catch { return false; }
    }).slice(0, 35);
    for (const url of urls) {
      const response = await page.request.get(url, {
        failOnStatusCode: false, maxRedirects: 3,
      });
      expect(response.status(), "server error at " + url).toBeLessThan(500);
    }
  });

  test("visible homepage buttons have a usable accessible label", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const unlabeled = await page.locator("button, [role='button']").evaluateAll(els =>
      els.filter(el => {
        const text = (el.textContent || "").trim();
        return !text && !el.getAttribute("aria-label")?.trim() &&
          !el.getAttribute("title")?.trim() && !el.querySelector("img[alt]");
      }).map(el => el.outerHTML.slice(0, 180))
    );
    expect(unlabeled).toEqual([]);
  });

  test("mobile homepage does not overflow horizontally", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile project required");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 2
    );
    expect(overflow).toBe(false);
  });
});
