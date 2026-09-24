import { expect, test, type Browser, type Page } from "@playwright/test";

const A = { email: process.env.QA_USER_A_EMAIL || "", password: process.env.QA_USER_A_PASSWORD || "" };
const B = { email: process.env.QA_USER_B_EMAIL || "", password: process.env.QA_USER_B_PASSWORD || "" };
const hasUsers = Boolean(A.email && A.password && B.email && B.password);

async function login(page: Page, user: typeof A) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/^password/i).fill(user.password);
  await page.getByRole("button", { name: /log in|login|anmelden|connexion/i }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
}

async function loginPair(browser: Browser) {
  const a = await browser.newContext();
  const b = await browser.newContext();
  const pageA = await a.newPage();
  const pageB = await b.newPage();
  await login(pageA, A);
  await login(pageB, B);
  return { a, b, pageA, pageB };
}

test.describe("CupidMatch member-to-member QA", () => {
  test.skip(!hasUsers, "Set QA_USER_A_EMAIL/PASSWORD and QA_USER_B_EMAIL/PASSWORD.");

  test("two members can login independently", async ({ browser }) => {
    const { a, b, pageA, pageB } = await loginPair(browser);
    await pageA.goto("/dashboard");
    await pageB.goto("/dashboard");
    await expect(pageA).toHaveURL(/\/dashboard/);
    await expect(pageB).toHaveURL(/\/dashboard/);
    await a.close(); await b.close();
  });

  test("accepted connection is visible and messages travel both ways", async ({ browser }) => {
    const { a, b, pageA, pageB } = await loginPair(browser);

    await pageA.goto("/connections");
    await pageB.goto("/connections");
    const aHasB = await pageA.getByText(new RegExp(B.email.split("@")[0], "i")).count().catch(() => 0);
    const bHasA = await pageB.getByText(new RegExp(A.email.split("@")[0], "i")).count().catch(() => 0);
    test.skip(!(aHasB || bHasA), "QA users must first be connected; use the interest-flow test/manual setup once.");

    await pageA.goto("/messages");
    await pageB.goto("/messages");

    const stamp = Date.now();
    const fromA = `QA A→B ${stamp}`;
    const fromB = `QA B→A ${stamp}`;

    const firstA = pageA.locator("button").filter({ hasText: /./ }).filter({ has: pageA.locator("img") }).first();
    const firstB = pageB.locator("button").filter({ hasText: /./ }).filter({ has: pageB.locator("img") }).first();
    if (await firstA.count()) await firstA.click();
    if (await firstB.count()) await firstB.click();

    const boxA = pageA.getByPlaceholder(/type a message/i);
    const boxB = pageB.getByPlaceholder(/type a message/i);
    await expect(boxA).toBeVisible();
    await expect(boxB).toBeVisible();

    await boxA.fill(fromA);
    await pageA.getByRole("button", { name: /send message/i }).click();
    await expect(pageB.getByText(fromA, { exact: true })).toBeVisible({ timeout: 15_000 });

    await boxB.fill(fromB);
    await pageB.getByRole("button", { name: /send message/i }).click();
    await expect(pageA.getByText(fromB, { exact: true })).toBeVisible({ timeout: 15_000 });

    await pageA.reload();
    await pageB.reload();
    await expect(pageA.getByText(fromB, { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(pageB.getByText(fromA, { exact: true })).toBeVisible({ timeout: 15_000 });

    await a.close(); await b.close();
  });
});

test("message composer rejects whitespace-only messages", async ({ browser }) => {
  test.skip(!hasUsers, "QA users are required.");
  const { a, b, pageA } = await loginPair(browser);
  await pageA.goto("/messages");
  const conversation = pageA.locator("button").filter({ has: pageA.locator("img") }).first();
  test.skip(!(await conversation.count()), "QA User A needs an existing QA connection.");
  await conversation.click();
  const box = pageA.getByPlaceholder(/type a message/i);
  await box.fill("   ");
  await expect(pageA.getByRole("button", { name: /send message/i })).toBeDisabled();
  await a.close(); await b.close();
});

test("member pages remain protected after logout", async ({ browser }) => {
  test.skip(!hasUsers, "QA users are required.");
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, A);
  await page.goto("/dashboard");
  await page.evaluate(async () => {
    const key = Object.keys(localStorage).find(k => k.includes("auth-token"));
    if (key) localStorage.removeItem(key);
  });
  await context.clearCookies();
  await page.goto("/messages");
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  await context.close();
});

test("protected member pages redirect anonymous visitors to login", async ({ page }) => {
  for (const path of ["/dashboard", "/interests", "/connections", "/messages"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  }
});
