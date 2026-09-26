import { test, expect } from "@playwright/test";
import { messages } from "../src/components/i18n/messages";

const languages = ["en", "ta", "si", "fr", "nl", "de"] as const;
const publicPages = ["/", "/about", "/success-stories", "/pricing", "/safety", "/contact", "/login", "/signup"];
const memberPages = ["/dashboard", "/discover", "/dashboard/partner-preferences", "/interests", "/connections", "/messages", "/dashboard/edit-profile", "/dashboard/privacy", "/dashboard/horoscope", "/biodata", "/settings"];
function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (!value || typeof value !== "object") return {};
  return Object.entries(value).reduce<Record<string, string>>(
    (result, [key, nested]) => ({ ...result, ...flatten(nested, prefix ? `${prefix}.${key}` : key) }), {}
  );
}
test("I18N-001 all six languages contain every translation key", () => {
  const reference = flatten(messages.en);
  for (const language of languages) {
    const actual = flatten(messages[language]);
    expect(Object.keys(reference).filter((key) => !actual[key]?.trim()), `${language}: missing keys`).toEqual([]);
    expect(Object.keys(actual).filter((key) => !(key in reference)), `${language}: extra keys`).toEqual([]);
  }
});
for (const language of languages) {
  test(`I18N-010 ${language}: translation persists on all public pages`, async ({ page }) => {
    await page.goto("/login");
    await page.evaluate((code) => {
      localStorage.setItem("cupidmatch-language", code);
      document.cookie = `cupidmatch-language=${code}; Path=/; SameSite=Lax`;
    }, language);
    for (const route of publicPages) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("lang", language, { timeout: 15000 });
      await expect(page.getByText("Application error: a client-side exception has occurred")).toHaveCount(0);
    }
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(messages[language].hero.title);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(messages[language].hero.titleAccent);
    await page.goto("/login");
    await expect(page.getByText(messages[language].auth.loginTitle, { exact: true })).toBeVisible();
    await page.goto("/pricing");
    await expect(page.getByText(messages[language].pricing.title, { exact: true })).toBeVisible();
  });
}
test("I18N-020 selector persists language through navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select language" }).click();
  await page.getByRole("menuitem", { name: /தமிழ்/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ta");
  await page.goto("/login");
  await expect(page.getByText(messages.ta.auth.loginTitle, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("cupidmatch-language"))).toBe("ta");
});
test("I18N-030 all member routes preserve each selected language", async ({ page }) => {
  const email = process.env.QA_USER_A_EMAIL;
  const password = process.env.QA_USER_A_PASSWORD;
  test.skip(!email || !password, "Member QA credentials not configured");
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email!);
  await page.getByTestId("login-password").fill(password!);
  await page.getByTestId("login-submit").click();
  await expect(page).not.toHaveURL(/login/, { timeout: 20000 });
  for (const language of languages) {
    await page.evaluate((code) => {
      localStorage.setItem("cupidmatch-language", code);
      document.cookie = `cupidmatch-language=${code}; Path=/; SameSite=Lax`;
    }, language);
    for (const route of memberPages) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("lang", language, { timeout: 15000 });
      await expect(page.getByText("Application error: a client-side exception has occurred")).toHaveCount(0);
    }
  }
});
