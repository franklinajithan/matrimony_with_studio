import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDiscoveryGender } from "../src/lib/profile-gender";
import { profileMatchesFilters, preferenceScore, type DiscoveryFilters } from "../src/lib/matching/preferences";
import { createMemberActionRunner } from "../src/lib/matching/member-actions";
import type { Profile } from "../src/lib/supabase/types";

const empty: DiscoveryFilters = { query: "", countries: [], languages: [], religions: [], professions: [], smoking: [], drinking: [] };
const member = (extra: unknown, onboardingDraft?: unknown) => ({ extra, onboardingDraft }) as Profile;

test("discovery and scores use canonical gender before stale legacy data", () => {
  const profile = member({ gender: "female", matchDetails: { gender: "Man" } });
  assert.equal(profileMatchesFilters(profile, { ...empty, gender: "Woman" }), true);
  assert.equal(profileMatchesFilters(profile, { ...empty, gender: "Man" }), false);
  assert.equal(preferenceScore(profile, { ...empty, gender: "Woman" }).percentage, 100);
  assert.equal(defaultDiscoveryGender(profile), "Man");
});
test("legacy, draft, invalid and non-binary gender values remain compatible", () => {
  for (const profile of [member({ matchDetails: { gender: " Woman " } }), member({}, { gender: "female" }), member({ gender: "unknown", matchDetails: { gender: "Woman" } })]) {
    assert.equal(profileMatchesFilters(profile, { ...empty, gender: "female" }), true);
    assert.equal(defaultDiscoveryGender(profile), "Man");
  }
  assert.equal(defaultDiscoveryGender(member({gender:"non-binary"})), undefined);
  assert.equal(defaultDiscoveryGender(member({})), undefined);
  assert.equal(profileMatchesFilters(member({}), { ...empty, gender: "Woman" }), false);
});
test("saved partner gender keeps precedence over default", () => {
  assert.equal(defaultDiscoveryGender(member({gender:"male"}), " Man "), "Man");
  assert.equal(defaultDiscoveryGender(member({gender:"male"}), "No preference"), "Woman");
});
test("repeat click while auth is pending performs only one mutation", async () => {
  const run = createMemberActionRunner();
  let resolve!: (id: string) => void;
  const auth = new Promise<string>(r => { resolve = r; });
  const busy: boolean[] = []; let writes = 0;
  const options = { getUserId: () => auth, action: async (id: string) => { assert.equal(id, "member"); writes++; }, setBusy: (v: boolean) => busy.push(v), onError: () => assert.fail("unexpected failure") };
  const first = run("shortlist:target", options);
  await run("shortlist:target", options);
  resolve("member"); await first;
  assert.equal(writes, 1); assert.deepEqual(busy, [true, false]);
});
test("auth failures report feedback, skip mutations and release the lock for retry", async () => {
  const run = createMemberActionRunner(); let errors = 0; let writes = 0;
  const busy: boolean[] = [];
  const options = { getUserId: async () => { throw new Error("expired"); }, action: async () => { writes++; }, setBusy: (v: boolean) => busy.push(v), onError: () => { errors++; } };
  await run("interest:target", options);
  await run("interest:target", { ...options, getUserId: async () => "member" });
  assert.equal(errors, 1); assert.equal(writes, 1); assert.deepEqual(busy, [true, false, true, false]);
});
test("database failures do not commit success state and independent members can proceed", async () => {
  const run = createMemberActionRunner(); let commits = 0; let errors = 0;
  const options = { getUserId: async () => "member", action: async () => { throw { message: "RLS denied" }; commits++; }, setBusy: () => {}, onError: () => { errors++; } };
  await run("shortlist:a", options);
  await Promise.all(["shortlist:a", "interest:b"].map(key => run(key, {...options, action: async () => { commits++; }})));
  assert.equal(errors, 1); assert.equal(commits, 2);
});
