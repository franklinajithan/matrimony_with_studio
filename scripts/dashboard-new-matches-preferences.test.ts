import assert from "node:assert/strict";
import test from "node:test";
import { hasPartnerPreferences, matchesNewProfile, partnerPreferencesFromProfile } from "../src/lib/matching/preferences";
import type { Profile } from "../src/lib/supabase/types";

test("new matches use saved preferences, Discover gender and strict age evidence", () => {
  const member = { extra: { gender: "Man", partnerPreferences: {
    countries: ["United Kingdom"], languages: ["Tamil"], ageMin: 24, ageMax: 32,
  } } } as Profile;
  const candidate = { extra: { gender: "Woman" }, country: "United Kingdom", languages: ["Tamil"], ageYears: 28 } as Profile;
  const preferences = partnerPreferencesFromProfile(member);
  assert.ok(hasPartnerPreferences(preferences));
  assert.ok(matchesNewProfile(candidate, member, preferences));
  assert.ok(!matchesNewProfile({ ...candidate, ageYears: undefined }, member, preferences));
  assert.ok(!matchesNewProfile({ ...candidate, languages: ["English"] }, member, preferences));
  assert.ok(!matchesNewProfile({ ...candidate, extra: { gender: "Man" } }, member, preferences));
  assert.ok(matchesNewProfile(candidate, member, { ...preferences, gender: "Woman" }));
  assert.ok(!hasPartnerPreferences(partnerPreferencesFromProfile({ extra: { partnerPreferences: {
    gender: "No preference", relocation: "Doesn't matter",
  } } } as Profile)));
});
