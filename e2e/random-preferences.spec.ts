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
