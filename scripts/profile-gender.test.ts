import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeProfileGender, readProfileGender, profileGenderPatch } from "../src/lib/profile-gender";

test("loads canonical and legacy genders without guessing a missing value", () => {
  assert.equal(normalizeProfileGender(" Woman "), "female");
  assert.equal(readProfileGender({extra:{matchDetails:{gender:"Man"}}}), "male");
  assert.equal(readProfileGender({onboardingDraft:{gender:"female"}}), "female");
  assert.equal(readProfileGender({}), "");
  assert.equal(readProfileGender({extra:{gender:"female",matchDetails:{gender:"Man"}}}), "female");
});
test("a gender edit keeps matching and onboarding consistent and preserves other details", () => {
  const profile = {extra:{aliasName:"Member",matchDetails:{gender:"Woman",country:"UK"}},onboardingDraft:{gender:"female",country:"UK"}};
  const original = JSON.stringify(profile);
  const patch = profileGenderPatch(profile,"male");
  assert.equal(patch.extra?.gender,"male");
  assert.equal(patch.extra?.matchDetails.gender,"Man");
  assert.equal((patch.extra?.matchDetails as Record<string, unknown>)?.country,"UK");
  assert.equal((patch.extra as Record<string, unknown>)?.aliasName,"Member");
  assert.equal(patch.onboardingDraft?.gender,"male");
  assert.equal(readProfileGender(patch),"male");
  assert.equal(JSON.stringify(profile),original);
});
test("non-binary does not leave a stale binary gender in onboarding", () => {
  const patch = profileGenderPatch({onboardingDraft:{gender:"male",country:"UK"}},"Non-binary");
  assert.equal(readProfileGender(patch),"non-binary");
  assert.equal(patch.onboardingDraft?.gender,undefined);
  assert.equal(patch.onboardingDraft?.country,"UK");
});
test("an unspecified value does not erase existing profile information", () => {
  assert.deepEqual(profileGenderPatch({extra:{aliasName:"Member"}},""),{});
});
