import { LANGUAGE_OPTIONS, validateOnboardingStep, type OnboardingDraft } from "@/lib/onboarding/schema";

export type ProfilePublicationState = "draft" | "published";

export type ReadinessAction = {
  id: "photo" | "introduction" | "preferences" | "settlement";
  label: string;
  href: string;
};

export type ProfileReadiness = {
  percent: number;
  filled: number;
  total: number;
  isComplete: boolean;
  isPublished: boolean;
  state: ProfilePublicationState;
  primaryAction: { label: string; href: string };
  nextActions: ReadinessAction[];
  firstIncompleteStep: number;
};

const REQUIRED_CHECKS: Array<{
  filled: (draft: OnboardingDraft) => boolean;
}> = [
  { filled: (draft) => Boolean(draft.displayName?.trim() && draft.displayName.trim().length >= 2) },
  { filled: (draft) => Boolean(draft.dob?.trim()) },
  { filled: (draft) => Boolean(draft.country?.trim()) },
  { filled: (draft) => Boolean(draft.region?.trim()) },
  { filled: (draft) => Boolean(draft.languages && draft.languages.length > 0) },
  { filled: (draft) => Boolean(draft.lookingFor?.trim()) },
  { filled: (draft) => Boolean(draft.relationshipTimeline?.trim()) },
  { filled: (draft) => Boolean(draft.bio?.trim() && draft.bio.trim().length >= 20) },
  { filled: (draft) => Boolean(draft.educationLevel?.trim()) },
  { filled: (draft) => Boolean(draft.relocationOpenness?.trim()) },
];

const LOOKING_FOR_LABELS: Record<string, string> = {
  marriage: "Marriage",
  "long-term": "Long-term partnership",
  either: "Open to either",
};

const RELOCATION_LABELS: Record<string, string> = {
  open: "Open to relocating",
  partner: "Willing if my partner needs to stay",
  stay: "I need to stay where I am",
  unsure: "Not sure yet",
};

const PHOTO_PRIVACY_LABELS: Record<string, string> = {
  members: "Photos visible to members after you publish",
  connections: "Photos visible to accepted connections only",
  hidden: "Photos hidden for now",
};

export function hasRealPhoto(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return !trimmed.includes("placehold.co") && !trimmed.includes("placeholder");
}

export function isProfileComplete(draft: OnboardingDraft): boolean {
  return [0, 1, 2, 3, 5, 6].every((step) => validateOnboardingStep(step, draft).length === 0);
}

export function firstIncompleteOnboardingStep(draft: OnboardingDraft): number {
  for (const step of [0, 1, 2, 3, 5, 6]) {
    if (validateOnboardingStep(step, draft).length > 0) return step;
  }
  return 7;
}

export function computeProfileReadiness(
  draft: OnboardingDraft,
  isPublished: boolean
): ProfileReadiness {
  const filled = REQUIRED_CHECKS.filter((check) => check.filled(draft)).length;
  const total = REQUIRED_CHECKS.length;
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
  const complete = isProfileComplete(draft);
  const firstIncompleteStep = firstIncompleteOnboardingStep(draft);

  let primaryAction = {
    label: "Continue my profile",
    href: `/onboarding?step=${firstIncompleteStep}`,
  };
  if (!isPublished && complete) {
    primaryAction = { label: "Review and publish", href: "/onboarding?step=7" };
  } else if (isPublished) {
    primaryAction = { label: "Discover people", href: "/discover" };
  }

  const nextActions: ReadinessAction[] = [];
  if (!hasRealPhoto(draft.photoURL)) {
    nextActions.push({ id: "photo", label: "Add a profile photo", href: "/onboarding?step=6" });
  }
  if (!draft.bio?.trim() || draft.bio.trim().length < 20) {
    nextActions.push({
      id: "introduction",
      label: "Complete your introduction",
      href: "/onboarding?step=3",
    });
  }
  if (!draft.lookingFor?.trim() || !draft.relationshipTimeline?.trim()) {
    nextActions.push({
      id: "preferences",
      label: "Set partner preferences",
      href: "/onboarding?step=2",
    });
  }
  if (!draft.relocationOpenness?.trim() && !(draft.preferredSettlement && draft.preferredSettlement.length > 0)) {
    nextActions.push({
      id: "settlement",
      label: "Add future settlement plans",
      href: "/onboarding?step=5",
    });
  }

  return {
    percent,
    filled,
    total,
    isComplete: complete,
    isPublished,
    state: isPublished ? "published" : "draft",
    primaryAction,
    nextActions: nextActions.slice(0, 3),
    firstIncompleteStep,
  };
}

export function formatLanguageList(languages?: string[]): string | null {
  if (!languages?.length) return null;
  const labels = languages.map((value) => {
    const match = LANGUAGE_OPTIONS.find((option) => option.id === value || option.label === value);
    return match?.label || value;
  });
  return labels.join(", ");
}

export function formatLookingFor(value?: string): string | null {
  if (!value?.trim()) return null;
  return LOOKING_FOR_LABELS[value] || value;
}

export function formatRelocation(value?: string): string | null {
  if (!value?.trim()) return null;
  return RELOCATION_LABELS[value] || value;
}

export function formatPhotoPrivacy(value?: string): string {
  if (!value) return "Not set";
  return PHOTO_PRIVACY_LABELS[value] || value;
}

export function firstName(displayName?: string | null): string {
  const trimmed = displayName?.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

export function memberInitials(displayName?: string | null): string {
  const parts = (displayName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function sharedPreferenceText(
  self: { languages?: string[]; country?: string },
  other: { languages?: string[]; country?: string }
): string | null {
  const selfLangs = new Set((self.languages || []).map((value) => value.toLowerCase()));
  const shared = (other.languages || []).filter((value) => selfLangs.has(value.toLowerCase()));
  if (shared.length > 0) {
    const label = formatLanguageList(shared.slice(0, 2));
    return label ? `You both listed ${label}` : null;
  }
  if (self.country && other.country && self.country.trim().toLowerCase() === other.country.trim().toLowerCase()) {
    return `You both listed ${other.country}`;
  }
  return null;
}
