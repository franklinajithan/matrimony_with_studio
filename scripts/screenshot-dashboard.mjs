import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.SCREENSHOT_BASE_URL || "http://localhost:9002";
const email = process.env.SCREENSHOT_EMAIL;
const password = process.env.SCREENSHOT_PASSWORD;
const outDir = path.resolve("artifacts/screenshots/dashboard");

const viewports = [
  { name: "390px", width: 390, height: 844 },
  { name: "768px", width: 768, height: 1024 },
  { name: "1440px", width: 1440, height: 900 },
];

async function shot(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(outDir, name),
    fullPage: true,
  });
}

async function main() {
  if (!email || !password) {
    throw new Error("SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD are required.");
  }
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 25000 });
  await page.goto(`${base}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500);
    await shot(page, `overview-${viewport.name}.png`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) {
    await menu.click();
    await page.waitForTimeout(400);
    await shot(page, "overview-390px-drawer.png");
    await page.keyboard.press("Escape");
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
