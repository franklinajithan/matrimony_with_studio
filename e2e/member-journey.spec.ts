import { expect, test, type Browser, type Page } from "@playwright/test";

const A = { email: process.env.QA_USER_A_EMAIL || "", password: process.env.QA_USER_A_PASSWORD || "" };
const B = { email: process.env.QA_USER_B_EMAIL || "", password: process.env.QA_USER_B_PASSWORD || "" };
const hasUsers = Boolean(A.email && A.password && B.email && B.password);

async function userId(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/qa/whoami", { credentials: "include" });
    if (response.ok) {
      const data = await response.json();
      if (data?.id) return String(data.id);
    }

    const supabaseKeys = Object.keys(localStorage).filter((key) => key.startsWith("sb-") && key.endsWith("-auth-token"));
    for (const key of supabaseKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const value = JSON.parse(raw);
        const id = value?.user?.id || value?.currentSession?.user?.id;
        if (id) return String(id);
      } catch {}
    }
    return "";
  });
}

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

  test("QA-020 → QA-042 full interest, connection and chat lifecycle", async ({ browser }) => {
    const { a, b, pageA, pageB } = await loginPair(browser);
    const idA = await userId(pageA);
    const idB = await userId(pageB);
    expect(idA, "QA User A id").toBeTruthy();
    expect(idB, "QA User B id").toBeTruthy();

    // QA-020/021: A discovers B and sends one interest.
    await pageA.goto("/discover");
    const interestButton = pageA.getByTestId(`profile-${idB}-interest`);
    await expect(interestButton, "QA-010: B must be discoverable by A").toBeVisible({ timeout: 20_000 });
    if (!(await interestButton.isDisabled())) {
      await interestButton.click();
      await expect(interestButton, "QA-020/021: interest changes to sent").toBeDisabled({ timeout: 10_000 });
    }

    // QA-022/030: B receives and accepts A's request.
    await pageB.goto("/interests");
    const accept = pageB.getByTestId(`interest-${idA}-accept`);
    // The interests page loads auth + requests asynchronously. locator.count() is
    // immediate and previously let the test race past a real pending request.
    const pendingVisible = await accept
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (pendingVisible) {
      await accept.click();
      await Promise.race([
        pageB.waitForURL(/\/messages\//, { timeout: 20_000 }),
        pageB.getByText("Failed to accept interest.", { exact: true }).waitFor({ state: "visible", timeout: 20_000 }).then(() => {
          throw new Error("QA-030: CupidMatch failed while creating the accepted connection/chat.");
        }),
      ]);
    }

    // QA-032/033: both members see the connection.
    await pageA.goto("/connections");
    await expect(pageA.getByTestId(`connection-${idB}-remove`), "QA-032: connection visible to A").toBeVisible({ timeout: 20_000 });
    await pageB.goto("/connections");
    await expect(pageB.getByTestId(`connection-${idA}-remove`), "QA-033: connection visible to B").toBeVisible({ timeout: 20_000 });

    // QA-035/040/041/042/043: same chat, realtime two-way delivery, persistence.
    await pageA.goto("/messages");
    await pageB.goto("/messages");
    const firstA = pageA.locator("button").filter({ has: pageA.locator("img") }).first();
    const firstB = pageB.locator("button").filter({ has: pageB.locator("img") }).first();
    if (await firstA.count()) await firstA.click();
    if (await firstB.count()) await firstB.click();

    const boxA = pageA.getByPlaceholder(/type a message/i);
    const boxB = pageB.getByPlaceholder(/type a message/i);
    await expect(boxA, "QA-035: A can open connected chat").toBeVisible();
    await expect(boxB, "QA-035: B can open connected chat").toBeVisible();

    const stamp = Date.now();
    const fromA = `QA-040 A→B ${stamp}`;
    const fromB = `QA-042 B→A ${stamp}`;
    await boxA.fill(fromA);
    await pageA.getByRole("button", { name: /send message/i }).click();
    await expect(pageB.getByText(fromA, { exact: true }), "QA-041: B receives A message").toBeVisible({ timeout: 20_000 });

    await boxB.fill(fromB);
    await pageB.getByRole("button", { name: /send message/i }).click();
    await expect(pageA.getByText(fromB, { exact: true }), "QA-042: A receives B reply").toBeVisible({ timeout: 20_000 });

    await pageA.reload();
    await pageB.reload();
    await expect(pageA.getByText(fromB, { exact: true }), "QA-043: reply persists after refresh").toBeVisible({ timeout: 20_000 });
    await expect(pageB.getByText(fromA, { exact: true }), "QA-043: message persists after refresh").toBeVisible({ timeout: 20_000 });

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
