const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseOnboardingDraft } = require("../src/lib/onboarding/schema.ts");
const {
  draftFromProfileRow,
  mergeOnboardingDrafts,
  profilePatchFromDraft,
  saveOnboardingDraft,
} = require("../src/lib/onboarding/persist.ts");

const photo = { id: "users/member/gallery/photo.jpg", url: "users/member/gallery/photo.jpg", storagePath: "users/member/gallery/photo.jpg" };
const base = { displayName: "Gallery Member", gender: "female", dob: "1994-01-01", height: "165" };

test("removing the final additional photo is an intentional saved edit", () => {
  const oldDraft = parseOnboardingDraft({ ...base, additionalPhotoUrls: [photo] });
  const newDraft = parseOnboardingDraft({ ...base, additionalPhotoUrls: [] });
  const merged = mergeOnboardingDrafts(oldDraft, newDraft);
  assert.deepEqual(merged.additionalPhotoUrls, []);
  const patch = profilePatchFromDraft(merged);
  assert.deepEqual(patch.additional_photo_urls, []);
  const reloaded = draftFromProfileRow({
    onboarding_draft: merged,
    additional_photo_urls: [photo],
  });
  assert.deepEqual(reloaded.additionalPhotoUrls, []);
});

test("legacy profiles still load gallery when onboarding draft lacks the field", () => {
  const reloaded = draftFromProfileRow({
    onboarding_draft: { displayName: "Legacy" },
    additional_photo_urls: [photo],
  });
  assert.deepEqual(reloaded.additionalPhotoUrls, [photo]);
});

test("deleting one of multiple gallery photos preserves the other", () => {
  const other = { id: "users/member/gallery/other.jpg", url: "users/member/gallery/other.jpg" };
  const oldDraft = parseOnboardingDraft({ ...base, additionalPhotoUrls: [photo, other] });
  const newDraft = parseOnboardingDraft({ ...base, additionalPhotoUrls: [other] });
  assert.deepEqual(mergeOnboardingDrafts(oldDraft, newDraft).additionalPhotoUrls, [other]);
});

test("save round-trip persists an empty gallery to both draft and profile column", async () => {
  const existing = { id: "fixture-user", onboarding_draft: { ...base, additionalPhotoUrls: [photo] }, additional_photo_urls: [photo], onboarding_step: 6 };
  let saved;
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: existing, error: null }) }),
      }),
      upsert: (patch) => {
        saved = patch;
        return { select: () => ({ single: async () => ({ data: { id: "fixture-user", onboarding_step: 6 }, error: null }) }) };
      },
    }),
  };
  await saveOnboardingDraft(client, "fixture-user", {
    draft: { ...base, additionalPhotoUrls: [] },
    step: 6,
  });
  assert.deepEqual(saved.onboarding_draft.additionalPhotoUrls, []);
  assert.deepEqual(saved.additional_photo_urls, []);
});
