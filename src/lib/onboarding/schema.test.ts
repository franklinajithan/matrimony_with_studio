import { describe, expect, it } from "vitest";
import {
  isAdult,
  parseOnboardingDraft,
  validateForPublish,
  validateOnboardingStep,
} from "@/lib/onboarding/schema";
import { profilePatchFromDraft, mergeOnboardingDrafts, isEffectivelyEmptyDraft } from "@/lib/onboarding/persist";
import { EMPTY_ONBOARDING_DRAFT } from "@/lib/onboarding/schema";

const adultDraft = {
  displayName: "Amina Perera",
  dob: "1995-03-12",
  country: "Sri Lanka",
  region: "Colombo",
  languages: ["English", "Sinhala"],
  lookingFor: "marriage",
  relationshipTimeline: "ready",
  bio: "I care about kindness, family, and building a life that spans countries.",
  educationLevel: "Bachelor's",
  relocationOpenness: "open",
  photoPrivacy: "members" as const,
  reviewConfirmed: true,
};

describe("onboarding validation", () => {
  it("uses DOB itself for adult eligibility without a second checkbox", () => {
    expect(isAdult("2015-01-01")).toBe(false);
    expect(isAdult("1980-06-29")).toBe(true);
    expect(validateOnboardingStep(0, parseOnboardingDraft({ displayName: "Ajithan", dob: "1980-06-29", confirmedAdult: false }))).toEqual([]);
    expect(validateOnboardingStep(0, parseOnboardingDraft({ displayName: "Amina", dob: "2015-01-01", confirmedAdult: true }))).not.toEqual([]);
  });

  it("checks the exact 18th birthday boundary", () => {
    expect(isAdult("2008-09-16", new Date(2026, 8, 16, 12))).toBe(true);
    expect(isAdult("2008-09-17", new Date(2026, 8, 16, 12))).toBe(false);
    expect(isAdult("not-a-date")).toBe(false);
  });

  it("does not publish without final review confirmation", () => {
    const errors = validateForPublish(parseOnboardingDraft({ ...adultDraft, reviewConfirmed: false }));
    expect(errors.some((error) => error.toLowerCase().includes("confirm"))).toBe(true);
  });

  it("accepts a complete confirmed draft", () => {
    expect(validateForPublish(parseOnboardingDraft(adultDraft))).toEqual([]);
  });

  it("does not copy empty defaults onto profile columns", () => {
    const patch = profilePatchFromDraft(parseOnboardingDraft({ displayName: "Amina", bio: "" }));
    expect(patch.display_name).toBe("Amina");
    expect(patch.bio).toBeUndefined();
    expect(patch.is_admin).toBeUndefined();
    expect(patch.email).toBeUndefined();
  });

  it("accepts long signed photo URLs in drafts", () => {
    const longUrl = `https://ztuquqsmmfkoqhobfgyt.supabase.co/storage/v1/object/sign/media/users/abc/profile/photo.jpg?token=${"x".repeat(600)}`;
    expect(longUrl.length).toBeGreaterThan(500);
    expect(() => parseOnboardingDraft({ ...adultDraft, photoURL: longUrl })).not.toThrow();
  });

  it("does not let an empty client draft wipe saved fields", () => {
    const saved = parseOnboardingDraft(adultDraft);
    const empty = parseOnboardingDraft(EMPTY_ONBOARDING_DRAFT);
    expect(isEffectivelyEmptyDraft(empty)).toBe(true);
    const merged = mergeOnboardingDrafts(saved, empty);
    expect(merged.displayName).toBe("Amina Perera");
    expect(merged.bio).toContain("kindness");
  });

  it("lets non-empty client edits overwrite saved fields", () => {
    const saved = parseOnboardingDraft(adultDraft);
    const edited = parseOnboardingDraft({ ...adultDraft, displayName: "Amina Silva" });
    const merged = mergeOnboardingDrafts(saved, edited);
    expect(merged.displayName).toBe("Amina Silva");
  });
});
