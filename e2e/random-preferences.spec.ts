import { expect, test } from "@playwright/test";

const A = { email: process.env.QA_USER_A_EMAIL || "", password: process.env.QA_USER_A_PASSWORD || "" };
const profiles = [
  ["01a0a652-f9c1-70ff-9eef-ad297f2281b0","Woman","Never married",160,"Bachelor's","Wants children","Open to relocating","Close family involvement","Within 1–2 years"],
  ["01a0a652-f929-76ac-bbce-9b3f2c188d5a","Man","Never married",175,"Bachelor's","Wants children","Open to relocating","Close family involvement","Within 1–2 years"],
  ["01a0a652-f963-7793-a4da-78dff528095e","Man","Divorced",180,"Doctorate","Open to discussing","Would relocate for the right person","Prefer independent decisions","Ready when it feels right"],
  ["01a0a652-fa40-7ce7-836a-e84608163af4","Woman","Never married",163,"Master's","Does not want children","Would relocate for the right person","Some family involvement","Still exploring"],
] as const;

test("QA-R01 random partner preference combinations", async ({ page }) => {
  test.setTimeout(240000);
  test.skip(!A.email || !A.password, "QA user required");
  await page.goto("/login");
  await page.getByTestId("login-email").fill(A.email);
  await page.getByTestId("login-password").fill(A.password);
  await page.getByTestId("login-submit").click();
  await expect(page).not.toHaveURL(/\/login/);

  const seed = Number(process.env.QA_RANDOM_SEED || "20260925");
  let state = seed >>> 0;
  const rnd = () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
  const pick = <T,>(v: readonly T[]) => v[Math.floor(rnd() * v.length)];
  const fields = [
    ["discover-filter-gender",1,["Woman","Man"]],
    ["discover-filter-marital-status",2,["Never married","Divorced"]],
    ["discover-filter-education",4,["Bachelor's","Master's","Doctorate"]],
    ["discover-filter-children",5,["Wants children","Does not want children","Open to discussing"]],
    ["discover-filter-relocation",6,["Open to relocating","Would relocate for the right person"]],
    ["discover-filter-family",7,["Close family involvement","Some family involvement","Prefer independent decisions"]],
    ["discover-filter-marriage-timeline",8,["Within 1–2 years","Ready when it feels right","Still exploring"]],
  ] as const;

  for (let n=1;n<=50;n++) {
    await page.goto("/discover");
    await page.getByTestId("discover-filters-open").click();
    const chosen: [number,string][] = [];
    for (const [testId,index,values] of fields) if (rnd()<0.45) {
      const value=pick(values); chosen.push([index,value]);
      await page.getByTestId(testId).click();
      await page.getByRole("option",{name:value,exact:true}).click();
    }
    const min = rnd()<0.4 ? pick([158,160,163,170,175]) : undefined;
    const max = rnd()<0.4 ? pick([163,172,175,180,185]) : undefined;
    const lo=min&&max?Math.min(min,max):min, hi=min&&max?Math.max(min,max):max;
    if(lo) await page.getByTestId("discover-filter-height-min").fill(String(lo));
    if(hi) await page.getByTestId("discover-filter-height-max").fill(String(hi));

    for(const p of profiles) {
      const expected=chosen.every(([i,v])=>p[i]===v)&&(!lo||p[3]>=lo)&&(!hi||p[3]<=hi);
      const card=page.getByTestId("discover-profile-"+p[0]);
      const msg="seed="+seed+" scenario="+n+" filters="+JSON.stringify({chosen,lo,hi})+" profile="+p[0];
      if(expected) await expect(card,msg).toBeVisible({timeout:10000}); else await expect(card,msg).toHaveCount(0);
    }
  }
});


// QA-R02 uses all ten published synthetic QA profiles. Keep this separate from
// QA-R01's four richly annotated profiles: the other six have known gender,
// education and height, but not every extended-preference field.
test("QA-R02 thirty seeded random Find Matches scenarios across ten QA profiles", async ({ page }) => {
  test.setTimeout(300_000);
  test.skip(!A.email || !A.password, "QA user required");
  const cohort = [
    ["01a0a652-f929-76ac-bbce-9b3f2c188d5a","Man",175,"Bachelor's"],
    ["01a0a652-f947-73e7-8499-271e3c1e84d8","Man",178,"Master's"],
    ["01a0a652-f963-7793-a4da-78dff528095e","Man",180,"Doctorate"],
    ["01a0a652-f983-72ec-95e5-6a2f6cafa0ce","Man",172,"Master's"],
    ["01a0a652-f9a1-736d-93cf-ac7f98096303","Man",176,"Bachelor's"],
    ["01a0a652-f9c1-70ff-9eef-ad297f2281b0","Woman",160,"Bachelor's"],
    ["01a0a652-f9e0-76ea-bb5b-13ce9e54cca5","Woman",165,"Master's"],
    ["01a0a652-f9ff-7f68-ad79-59442a3508bf","Woman",162,"Master's"],
    ["01a0a652-fa20-782a-9f96-1a38d12e7135","Woman",158,"Bachelor's"],
    ["01a0a652-fa40-7ce7-836a-e84608163af4","Woman",163,"Master's"],
  ] as const;
  await page.goto("/login");
  await page.getByTestId("login-email").fill(A.email);
  await page.getByTestId("login-password").fill(A.password);
  await page.getByTestId("login-submit").click();
  await expect(page).not.toHaveURL(/login/);

  const seed = Number(process.env.QA_RANDOM_SEED || "20260926");
  let state = seed >>> 0;
  const rnd = () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
  const pick = <T,>(values: readonly T[]) => values[Math.floor(rnd() * values.length)];

  for (let scenario = 1; scenario <= 30; scenario++) {
    await page.goto("/discover");
    await page.getByTestId("discover-filters-open").click();
    const gender = rnd() < .75 ? pick(["Man","Woman"] as const) : undefined;
    const education = rnd() < .65 ? pick(["Bachelor's","Master's","Doctorate"] as const) : undefined;
    const min = rnd() < .6 ? pick([158,160,163,170,175,178] as const) : undefined;
    const max = rnd() < .6 ? pick([160,163,165,175,180,185] as const) : undefined;
    const lo = min !== undefined && max !== undefined ? Math.min(min,max) : min;
    const hi = min !== undefined && max !== undefined ? Math.max(min,max) : max;
    const choose = async (testId: string, value: string) => {
      await page.getByTestId(testId).click();
      await page.getByRole("option", { name: value, exact: true }).click();
    };
    if (gender) await choose("discover-filter-gender", gender);
    if (education) await choose("discover-filter-education", education);
    if (lo !== undefined) await page.getByTestId("discover-filter-height-min").fill(String(lo));
    if (hi !== undefined) await page.getByTestId("discover-filter-height-max").fill(String(hi));
    const criteria = JSON.stringify({ seed, scenario, gender, education, lo, hi });
    for (const [id, profileGender, height, profileEducation] of cohort) {
      const expected = (!gender || gender === profileGender)
        && (!education || education === profileEducation)
        && (lo === undefined || height >= lo)
        && (hi === undefined || height <= hi);
      const card = page.getByTestId("discover-profile-" + id);
      const reason = criteria + " profile=" + id + " expected=" + expected;
      if (expected) await expect(card, reason).toBeVisible({ timeout: 12_000 });
      else await expect(card, reason).toHaveCount(0, { timeout: 12_000 });
    }
  }
});

// Regression: saved partner preferences may affect ranking but must not hide all profiles.
test("QA-R00 Find Matches shows published profiles before any manual filters and restores them on Clear", async ({ page }) => {
  test.setTimeout(90000);
  test.skip(!A.email || !A.password, "QA user required");
  await page.goto("/login");
  await page.getByTestId("login-email").fill(A.email);
  await page.getByTestId("login-password").fill(A.password);
  await page.getByTestId("login-submit").click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto("/discover");
  const known = page.getByTestId("discover-profile-01a0a652-f929-76ac-bbce-9b3f2c188d5a");
  await expect(known).toBeVisible({timeout:20000});
  await page.getByTestId("discover-filters-open").click();
  await page.getByTestId("discover-filter-gender").click();
  await page.getByRole("option",{name:"Woman",exact:true}).click();
  await expect(known).toHaveCount(0);
  await page.getByTestId("discover-filter-clear").click();
  await expect(known).toBeVisible({timeout:15000});
});
