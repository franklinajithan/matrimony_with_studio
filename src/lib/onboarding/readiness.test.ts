import { describe, expect, it } from "vitest";
import { parseOnboardingDraft } from "@/lib/onboarding/schema";
import { computeProfileReadiness, isProfileComplete } from "@/lib/onboarding/readiness";

const completeDraft = {
  displayName: "Amina Perera",
  dob: "1995-03-12",
  confirmedAdult: true,
  country: "Sri Lanka",
  region: "Colombo",
  languages: ["English"],
  lookingFor: "marriage",
  relationshipTimeline: "ready",
  bio: "I care about kindness, family, and building a life that spans countries.",
  educationLevel: "Bachelor's",
  relocationOpenness: "open",
  photoPrivacy: "members" as const,
};

describe("profile readiness", () => {
  it("matches the filled portion to the displayed percentage", () => {
    const draft = parseOnboardingDraft({
      displayName: "Amina",
      dob: "1995-03-12",
      confirmedAdult: true,
      country: "Sri Lanka",
      region: "Colombo",
    });
    const readiness = computeProfileReadiness(draft, false);
    expect(readiness.percent).toBe(Math.round((readiness.filled / readiness.total) * 100));
    expect(readiness.percent).toBe(40);
    expect(readiness.state).toBe("draft");
    expect(readiness.primaryAction.label).toBe("Continue my profile");
  });

  it("does not treat a missing photo as blocking publication completeness", () => {
    const draft = parseOnboardingDraft(completeDraft);
    expect(isProfileComplete(draft)).toBe(true);
    const readiness = computeProfileReadiness(draft, false);
    expect(readiness.isComplete).toBe(true);
    expect(readiness.primaryAction.label).toBe("Review and publish");
    expect(readiness.nextActions.some((action) => action.id === "photo")).toBe(true);
  });

  it("uses discover as the primary action for published profiles", () => {
    const readiness = computeProfileReadiness(parseOnboardingDraft(completeDraft), true);
    expect(readiness.state).toBe("published");
    expect(readiness.primaryAction).toEqual({ label: "Discover people", href: "/discover" });
  });

  it("only lists next actions that still apply", () => {
    const readiness = computeProfileReadiness(
      parseOnboardingDraft({
        ...completeDraft,
        photoURL: "https://cdn.example.com/amina.jpg",
        preferredSettlement: ["United Kingdom"],
      }),
      false
    );
    expect(readiness.nextActions.map((action) => action.id)).toEqual([]);
  });
});
