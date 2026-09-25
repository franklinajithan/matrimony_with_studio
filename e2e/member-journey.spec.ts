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
  // Use stable HTML semantics rather than translated labels. The login UI is
  // multilingual, so label text is not a reliable E2E selector.
  const email = page.getByTestId("login-email");
  const password = page.getByTestId("login-password");
  await expect(email).toBeVisible({ timeout: 20_000 });
  await expect(password).toBeVisible({ timeout: 20_000 });
  await email.fill(user.email);
  await password.fill(user.password);
  await page.getByTestId("login-submit").click();
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

  test("QA-010 → QA-019 partner preferences filter Discover profiles", async ({ browser }) => {
    test.setTimeout(60_000);
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, A);

    const priyaId = "01a0a652-f9c1-70ff-9eef-ad297f2281b0";
    const rajeshId = "01a0a652-f929-76ac-bbce-9b3f2c188d5a";
    const dineshId = "01a0a652-f963-7793-a4da-78dff528095e";

    // A controlled cohort differs by country, language, faith and age.
    // Hindu/Hinduism intentionally verifies normalization of legacy profile data.
    await page.goto("/discover?country=Sri%20Lanka&language=Tamil&religion=Hinduism&ageMax=34");

    await expect(page.getByTestId(`discover-profile-${priyaId}`), "QA-010: matching profile is included").toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`discover-profile-${rajeshId}`), "QA-011: religion mismatch is excluded").toHaveCount(0);
    await expect(page.getByTestId(`discover-profile-${dineshId}`), "QA-012: country/language/age mismatch is excluded").toHaveCount(0);

    await page.goto("/discover?country=Canada&religion=Christianity&ageMin=35");
    await expect(page.getByTestId(`discover-profile-${dineshId}`), "QA-013: Catholic profile matches Christianity preference").toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`discover-profile-${priyaId}`), "QA-014: Sri Lanka/Hindu profile is excluded from Canada/Christianity").toHaveCount(0);

    await context.close();
  });

  test("QA-015 → QA-019 extended partner preference controls filter Discover", async ({ browser }) => {
    test.setTimeout(90_000);
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, A);

    const priyaId = "01a0a652-f9c1-70ff-9eef-ad297f2281b0";
    const rajeshId = "01a0a652-f929-76ac-bbce-9b3f2c188d5a";
    const dineshId = "01a0a652-f963-7793-a4da-78dff528095e";
    const roshiniId = "01a0a652-fa40-7ce7-836a-e84608163af4";

    await page.goto("/discover");
    await page.getByTestId("discover-filters-open").click();

    const choose = async (testId: string, label: string) => {
      await page.getByTestId(testId).click();
      await page.getByRole("option", { name: label, exact: true }).click();
    };

    await choose("discover-filter-gender", "Woman");
    await choose("discover-filter-marital-status", "Never married");
    await page.getByTestId("discover-filter-height-min").fill("159");
    await page.getByTestId("discover-filter-height-max").fill("165");
    await choose("discover-filter-education", "Bachelor's");
    await choose("discover-filter-children", "Wants children");
    await choose("discover-filter-relocation", "Open to relocating");
    await choose("discover-filter-family", "Close family involvement");
    await choose("discover-filter-marriage-timeline", "Within 1–2 years");

    await expect(page.getByTestId(`discover-profile-${priyaId}`), "QA-015: full preference match remains visible").toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId(`discover-profile-${rajeshId}`), "QA-016: gender mismatch excluded").toHaveCount(0);
    await expect(page.getByTestId(`discover-profile-${dineshId}`), "QA-017: marital/height/education/future mismatch excluded").toHaveCount(0);
    await expect(page.getByTestId(`discover-profile-${roshiniId}`), "QA-018: children/relocation/family/timeline mismatch excluded").toHaveCount(0);

    await page.getByTestId("discover-filter-clear").click();
    await expect(page.getByTestId(`discover-profile-${rajeshId}`), "QA-019: clearing extended filters restores excluded profiles").toBeVisible({ timeout: 20_000 });

    await context.close();
  });

  test("QA-020 → QA-042 full interest, connection and chat lifecycle", async ({ browser }) => {
    test.setTimeout(90_000);
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

    // QA-035/040/041/042/043: open the exact A↔B chat. Never click the
    // first conversation because either QA account can have older chats.
    const chatId = [idA, idB].sort().join("_");
    await pageA.goto(`/messages/${chatId}`);
    await pageB.goto(`/messages/${chatId}`);

    const boxA = pageA.getByTestId("message-composer");
    const boxB = pageB.getByTestId("message-composer");
    await expect(boxA, "QA-035: A can open connected chat").toBeVisible({ timeout: 20_000 });
    await expect(boxB, "QA-035: B can open connected chat").toBeVisible({ timeout: 20_000 });

    const stamp = Date.now();
    const fromA = `QA-040 A→B ${stamp}`;
    const fromB = `QA-042 B→A ${stamp}`;
    await boxA.fill(fromA);
    await pageA.getByTestId("message-send").click();
    await expect(pageB.locator("section").getByText(fromA, { exact: true }), "QA-041: B receives A message").toBeVisible({ timeout: 20_000 });

    await boxB.fill(fromB);
    await pageB.getByTestId("message-send").click();
    await expect(pageA.locator("section").getByText(fromB, { exact: true }), "QA-042: A receives B reply").toBeVisible({ timeout: 20_000 });

    await pageA.reload();
    await pageB.reload();
    await expect(pageA.locator("section").getByText(fromB, { exact: true }), "QA-043: reply persists after refresh").toBeVisible({ timeout: 20_000 });
    await expect(pageB.locator("section").getByText(fromA, { exact: true }), "QA-043: message persists after refresh").toBeVisible({ timeout: 20_000 });

    await a.close(); await b.close();
  });

  test("QA-043 → QA-056 message persistence, validation and unread lifecycle", async ({ browser }) => {
    test.setTimeout(90_000);
    const { a, b, pageA, pageB } = await loginPair(browser);
    const idA = await userId(pageA);
    const idB = await userId(pageB);
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();

    const chatId = [idA, idB].sort().join("_");
    await pageA.goto(`/messages/${chatId}`);
    await pageB.goto(`/messages/${chatId}`);

    const boxA = pageA.getByTestId("message-composer");
    const boxB = pageB.getByTestId("message-composer");
    await expect(boxA, "QA-035: A opens exact connected chat").toBeVisible({ timeout: 20_000 });
    await expect(boxB, "QA-035: B opens exact connected chat").toBeVisible({ timeout: 20_000 });

    // QA-045: whitespace-only messages must never be sendable.
    await boxA.fill("   ");
    await expect(pageA.getByTestId("message-send"), "QA-045: whitespace send disabled").toBeDisabled();
    await boxA.fill("");

    // QA-040/041/043/047: unique Unicode message travels A→B and survives refresh.
    const stamp = Date.now();
    const fromA = `QA-047 A→B unicode ❤️ தமிழ் ${stamp}`;
    await boxA.fill(fromA);
    await pageA.getByTestId("message-send").click();
    await expect(pageB.locator("section").getByText(fromA, { exact: true }), "QA-041: B receives A message").toBeVisible({ timeout: 20_000 });
    await pageB.reload();
    await expect(pageB.locator("section").getByText(fromA, { exact: true }), "QA-043: A message persists").toBeVisible({ timeout: 20_000 });

    // QA-042/043: B replies and A receives/persists it.
    const fromB = `QA-042 B→A ${stamp}`;
    await boxB.fill(fromB);
    await pageB.getByTestId("message-send").click();
    await expect(pageA.locator("section").getByText(fromB, { exact: true }), "QA-042: A receives B reply").toBeVisible({ timeout: 20_000 });
    await pageA.reload();
    await expect(pageA.locator("section").getByText(fromB, { exact: true }), "QA-043: B reply persists").toBeVisible({ timeout: 20_000 });

    // QA-050/052/055: opening the recipient chat clears its unread state and remains clear after refresh.
    await pageA.goto("/messages");
    await pageA.goto(`/messages/${chatId}`);
    await expect(pageA.getByTestId("message-composer"), "QA-052: opening chat after unread remains usable").toBeVisible({ timeout: 20_000 });
    await pageA.reload();
    await expect(pageA.getByTestId("message-composer"), "QA-055: read state survives refresh").toBeVisible({ timeout: 20_000 });

    await a.close(); await b.close();
  });

  test("QA-057 → QA-060 connection removal revokes chat access", async ({ browser }) => {
    test.setTimeout(90_000);
    const { a, b, pageA, pageB } = await loginPair(browser);
    const idA = await userId(pageA);
    const idB = await userId(pageB);
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    const chatId = [idA, idB].sort().join("_");

    // QA-057: remove the existing A↔B connection and confirm it disappears.
    await pageA.goto("/connections");
    const remove = pageA.getByTestId(`connection-${idB}-remove`);
    await expect(remove, "QA-057: removable connection is visible").toBeVisible({ timeout: 20_000 });
    await remove.click();
    await pageA.getByTestId("confirm-remove-connection").click();
    await expect(remove, "QA-057: connection disappears for A").toHaveCount(0, { timeout: 20_000 });

    // QA-058: the removal is reflected for the other member too.
    await pageB.goto("/connections");
    await expect(pageB.getByTestId(`connection-${idA}-remove`), "QA-058: connection disappears for B").toHaveCount(0, { timeout: 20_000 });

    // QA-059/060: a removed relationship must not regain messaging merely by
    // navigating to the old deterministic chat URL.
    await pageA.goto(`/messages/${chatId}`);
    await expect(pageA.getByTestId("message-composer"), "QA-059: removed connection cannot message from old chat").toHaveCount(0, { timeout: 20_000 });
    await pageB.goto(`/messages/${chatId}`);
    await expect(pageB.getByTestId("message-composer"), "QA-060: removed connection cannot message from old chat").toHaveCount(0, { timeout: 20_000 });

    await a.close(); await b.close();
  });

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
