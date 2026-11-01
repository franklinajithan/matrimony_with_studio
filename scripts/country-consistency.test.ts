import assert from "node:assert/strict";
import { test } from "node:test";
import { ISO_COUNTRY_CODES, WORLD_COUNTRIES, WORLD_COUNTRY_NAMES, countryCodeForName, sameCountry } from "../src/data/world-countries";
import { COUNTRY_OPTIONS, onboardingDraftSchema } from "../src/lib/onboarding/schema";
import { profileMatchesFilters, preferenceScore, type DiscoveryFilters } from "../src/lib/matching/preferences";
import type { Profile } from "../src/lib/supabase/types";
const filters: DiscoveryFilters = {query:"", countries:[], languages:[], religions:[], professions:[], smoking:[], drinking:[]};
test("all selectors share 249 unique ISO countries and territories", () => {
  assert.equal(ISO_COUNTRY_CODES.length, 249);
  assert.equal(new Set(ISO_COUNTRY_CODES).size, 249);
  assert.equal(WORLD_COUNTRIES.length, 249);
  assert.equal(new Set(WORLD_COUNTRY_NAMES).size, 249);
  assert.equal(COUNTRY_OPTIONS, WORLD_COUNTRY_NAMES);
  for (const code of ["LK","GB","AU","CA","FR","DE","CH","IN","AE","US","NR","AX","CI"]) assert.ok(ISO_COUNTRY_CODES.includes(code));
});
test("every country roundtrips by display name and code", () => {
  for (const {code,name} of WORLD_COUNTRIES) {
    assert.equal(countryCodeForName(name),code);
    assert.equal(countryCodeForName(code.toLowerCase()),code);
    assert.equal(sameCountry(name, code),true);
  }
});
test("legacy names and accented names preserve country identity", () => {
  assert.equal(countryCodeForName(" UK "),"GB");
  assert.equal(sameCountry("USA", "United States"),true);
  assert.equal(sameCountry("UAE", "United Arab Emirates"),true);
  assert.equal(sameCountry("Åland Islands", "AX"),true);
  assert.equal(sameCountry("Unknown place", "unknown place"),true);
  assert.equal(sameCountry("", "GB"),false);
  assert.equal(countryCodeForName("Unknown place"),undefined);
});
test("onboarding accepts legacy and manual locations without overwriting data", () => {
  for (const country of ["Other", "UK", "Côte d’Ivoire", "Previously saved country"]) {
    const draft = {country,region:"Small village / retained legacy region"};
    const result = onboardingDraftSchema.parse(draft);
    assert.equal(result.country,country);
    assert.equal(result.region,draft.region);
  }
});
test("discovery and ranking match compatible country values without mutating profiles", () => {
  for (const country of ["UK", "GB", "United Kingdom"]) {
    const profile = { country, extra:{} } as Profile;
    assert.equal(profileMatchesFilters(profile,{...filters,countries:["United Kingdom"]}),true);
    assert.equal(profileMatchesFilters(profile,{...filters,countries:["Canada"]}),false);
    assert.equal(preferenceScore(profile,{...filters,countries:["GB"]}).percentage,100);
    assert.equal(profile.country,country);
  }
  assert.equal(profileMatchesFilters({ country:"Nauru",extra:{} } as Profile,filters),true);
});
