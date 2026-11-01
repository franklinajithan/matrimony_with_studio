import test from "node:test";
import assert from "node:assert/strict";
import { defaultDiscoveryGender, profileMatchesFilters, preferenceScore } from "../src/lib/matching/preferences";
import type { Profile } from "../src/lib/supabase/types";
const profile = (extra = {}, onboardingDraft = {}) => ({ extra, onboardingDraft, displayName: "Member" } as Profile);
const filters = { query: "", countries: [], languages: [], religions: [], professions: [], smoking: [], drinking: [] };

test("canonical gender wins over a stale legacy value for filtering and scoring", () => {
  const member = profile({ gender: "female", matchDetails: { gender: "Man" } });
  assert.equal(profileMatchesFilters(member, { ...filters, gender: "Woman" }), true);
  assert.equal(profileMatchesFilters(member, { ...filters, gender: "Man" }), false);
  assert.equal(preferenceScore(member, { ...filters, gender: "Woman" }).percentage, 100);
});
test("legacy and onboarding-only profiles remain discoverable", () => {
  assert.equal(profileMatchesFilters(profile({ matchDetails: { gender: "Woman" } }), { ...filters, gender: "female" }), true);
  assert.equal(profileMatchesFilters(profile({}, { gender: "male" }), { ...filters, gender: "Man" }), true);
  assert.equal(profileMatchesFilters(profile(), { ...filters, gender: "Woman" }), false);
  assert.equal(profileMatchesFilters(profile(), { ...filters, gender: "No preference" }), true);
});
test("default uses canonical own gender and preserves explicit partner choice", () => {
  const member = profile({ gender: "female", matchDetails: { gender: "Man" } });
  assert.equal(defaultDiscoveryGender(member), "Man");
  assert.equal(defaultDiscoveryGender(member, "female"), "Woman");
  for (const choice of ["No preference", "Any", "All"]) assert.equal(defaultDiscoveryGender(member, choice), undefined);
  assert.equal(defaultDiscoveryGender(profile()), undefined);
  assert.equal(defaultDiscoveryGender(profile({ gender: "nonbinary" })), undefined);
  assert.equal(defaultDiscoveryGender(member, "nonbinary"), "Non-binary");
});
