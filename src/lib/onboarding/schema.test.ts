import { describe, expect, it } from "vitest";
import {
  isAdult,
  parseOnboardingDraft,
  validateForPublish,
  validateOnboardingStep,
} from "@/lib/onboarding/schema";
import { profilePatchFromDraft } from "@/lib/onboarding/persist";

const adultDraft = {
  displayName: "Amina Perera",
  dob: "1995-03-12",
  confirmedAdult: true,
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
  it("requires adult eligibility from date of birth", () => {
    expect(isAdult("2015-01-01")).toBe(false);
    expect(isAdult("1990-01-01")).toBe(true);
    expect(validateOnboardingStep(0, parseOnboardingDraft({ displayName: "A", dob: "2015-01-01", confirmedAdult: true }))).not.toEqual([]);
  });

  it("does not publish without explicit confirmation", () => {
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
});
