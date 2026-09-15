import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMPTY_ONBOARDING_DRAFT,
  parseOnboardingDraft,
  validateForPublish,
  type OnboardingDraft,
} from "@/lib/onboarding/schema";
import { omitEmptyDefaults } from "@/lib/supabase/privileged";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function draftFromProfileRow(row: Record<string, unknown> | null): OnboardingDraft {
  const stored = parseOnboardingDraft(row?.onboarding_draft || {});
  const intentions = asRecord(row?.relationship_intentions);
  const values = asRecord(row?.values_lifestyle);
  const cultural = asRecord(row?.cultural_family);
  const settlement = asRecord(row?.settlement);
  return {
    ...EMPTY_ONBOARDING_DRAFT,
    ...stored,
    displayName: stored.displayName || String(row?.display_name || ""),
    dob: stored.dob || String(row?.dob || ""),
    profession: stored.profession || String(row?.profession || ""),
    height: stored.height || String(row?.height || ""),
    country: stored.country || String(row?.country || ""),
    region: stored.region || String(row?.region || row?.location || ""),
    languages: stored.languages?.length
      ? stored.languages
      : Array.isArray(row?.languages)
        ? (row?.languages as string[])
        : [],
    lookingFor: stored.lookingFor || String(intentions.lookingFor || ""),
    relationshipTimeline: stored.relationshipTimeline || String(intentions.relationshipTimeline || ""),
    partnershipStyle: stored.partnershipStyle || String(intentions.partnershipStyle || ""),
    bio: stored.bio || String(row?.bio || ""),
    educationLevel: stored.educationLevel || String(row?.education_level || ""),
    smokingHabits: stored.smokingHabits || String(row?.smoking_habits || ""),
    drinkingHabits: stored.drinkingHabits || String(row?.drinking_habits || ""),
    hobbies: stored.hobbies || String(row?.hobbies || ""),
    faithImportance: stored.faithImportance || String(values.faithImportance || ""),
    familyImportance: stored.familyImportance || String(values.familyImportance || ""),
    religion: stored.religion || String(row?.religion || ""),
    culturalBackground: stored.culturalBackground || String(cultural.culturalBackground || ""),
    familyInvolvement: stored.familyInvolvement || String(cultural.familyInvolvement || ""),
    festivalImportance: stored.festivalImportance || String(cultural.festivalImportance || ""),
    currentCountry: stored.currentCountry || String(settlement.currentCountry || row?.country || ""),
    preferredSettlement: stored.preferredSettlement?.length
      ? stored.preferredSettlement
      : Array.isArray(settlement.preferredSettlement)
        ? (settlement.preferredSettlement as string[])
        : [],
    relocationOpenness: stored.relocationOpenness || String(settlement.relocationOpenness || ""),
    longDistanceOk: stored.longDistanceOk || String(settlement.longDistanceOk || ""),
    familyResponsibilities:
      stored.familyResponsibilities || String(settlement.familyResponsibilities || ""),
    photoURL: stored.photoURL || String(row?.photo_url || ""),
    additionalPhotoUrls: stored.additionalPhotoUrls?.length
      ? stored.additionalPhotoUrls
      : Array.isArray(row?.additional_photo_urls)
        ? (row?.additional_photo_urls as OnboardingDraft["additionalPhotoUrls"])
        : [],
    photoPrivacy:
      stored.photoPrivacy ||
      (row?.photo_privacy as OnboardingDraft["photoPrivacy"]) ||
      "members",
  };
}

export function draftFromProfile(profile: {
  onboardingDraft?: Record<string, unknown>;
  displayName?: string;
  dob?: string;
  profession?: string;
  height?: string;
  country?: string;
  region?: string;
  location?: string;
  languages?: string[];
  relationshipIntentions?: Record<string, unknown>;
  valuesLifestyle?: Record<string, unknown>;
  culturalFamily?: Record<string, unknown>;
  settlement?: Record<string, unknown>;
  bio?: string;
  educationLevel?: string;
  smokingHabits?: string;
  drinkingHabits?: string;
  hobbies?: string;
  religion?: string;
  photoURL?: string;
  additionalPhotoUrls?: OnboardingDraft["additionalPhotoUrls"];
  photoPrivacy?: OnboardingDraft["photoPrivacy"];
}): OnboardingDraft {
  return draftFromProfileRow({
    onboarding_draft: profile.onboardingDraft,
    display_name: profile.displayName,
    dob: profile.dob,
    profession: profile.profession,
    height: profile.height,
    country: profile.country,
    region: profile.region,
    location: profile.location,
    languages: profile.languages,
    relationship_intentions: profile.relationshipIntentions,
    values_lifestyle: profile.valuesLifestyle,
    cultural_family: profile.culturalFamily,
    settlement: profile.settlement,
    bio: profile.bio,
    education_level: profile.educationLevel,
    smoking_habits: profile.smokingHabits,
    drinking_habits: profile.drinkingHabits,
    hobbies: profile.hobbies,
    religion: profile.religion,
    photo_url: profile.photoURL,
    additional_photo_urls: profile.additionalPhotoUrls,
    photo_privacy: profile.photoPrivacy,
  });
}

export function profilePatchFromDraft(draft: OnboardingDraft): Record<string, unknown> {
  const location = [draft.region, draft.country].filter(Boolean).join(", ");
  return omitEmptyDefaults({
    display_name: draft.displayName,
    dob: draft.dob,
    profession: draft.profession,
    height: draft.height,
    country: draft.country,
    region: draft.region,
    location,
    languages: draft.languages,
    bio: draft.bio,
    education_level: draft.educationLevel,
    smoking_habits: draft.smokingHabits,
    drinking_habits: draft.drinkingHabits,
    hobbies: draft.hobbies,
    religion: draft.religion,
    photo_url: draft.photoURL,
    additional_photo_urls: draft.additionalPhotoUrls,
    photo_privacy: draft.photoPrivacy,
    language: draft.languages?.join(", "),
    relationship_intentions: omitEmptyDefaults({
      lookingFor: draft.lookingFor,
      relationshipTimeline: draft.relationshipTimeline,
      partnershipStyle: draft.partnershipStyle,
    }),
    values_lifestyle: omitEmptyDefaults({
      faithImportance: draft.faithImportance,
      familyImportance: draft.familyImportance,
    }),
    cultural_family: omitEmptyDefaults({
      culturalBackground: draft.culturalBackground,
      familyInvolvement: draft.familyInvolvement,
      festivalImportance: draft.festivalImportance,
      skippedCultural: draft.skippedCultural,
    }),
    settlement: omitEmptyDefaults({
      currentCountry: draft.currentCountry,
      preferredSettlement: draft.preferredSettlement,
      relocationOpenness: draft.relocationOpenness,
      longDistanceOk: draft.longDistanceOk,
      familyResponsibilities: draft.familyResponsibilities,
    }),
  });
}

export async function loadOnboardingState(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return {
    profile: data as Record<string, unknown> | null,
    draft: draftFromProfileRow(data as Record<string, unknown> | null),
    step: Number(data?.onboarding_step || 0),
    isPublished: Boolean(data?.is_published),
  };
}

function isBlankDraftValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** True when a client payload has no meaningful progress (failed load / empty form). */
export function isEffectivelyEmptyDraft(draft: OnboardingDraft): boolean {
  return (
    isBlankDraftValue(draft.displayName) &&
    isBlankDraftValue(draft.dob) &&
    isBlankDraftValue(draft.country) &&
    isBlankDraftValue(draft.region) &&
    isBlankDraftValue(draft.languages) &&
    isBlankDraftValue(draft.lookingFor) &&
    isBlankDraftValue(draft.bio) &&
    isBlankDraftValue(draft.photoURL) &&
    isBlankDraftValue(draft.educationLevel) &&
    isBlankDraftValue(draft.relocationOpenness)
  );
}

/**
 * Merge client draft onto stored draft without letting an empty client wipe
 * already-saved fields (common after a failed load or cancelled autosave).
 * Non-empty client values always win so intentional edits still save.
 */
export function mergeOnboardingDrafts(
  existing: OnboardingDraft,
  incoming: OnboardingDraft
): OnboardingDraft {
  if (isEffectivelyEmptyDraft(incoming) && !isEffectivelyEmptyDraft(existing)) {
    return existing;
  }

  const merged: OnboardingDraft = { ...existing };
  (Object.keys(EMPTY_ONBOARDING_DRAFT) as Array<keyof OnboardingDraft>).forEach((key) => {
    const nextValue = incoming[key];
    if (nextValue === undefined) return;
    if (typeof nextValue === "boolean") {
      merged[key] = nextValue as never;
      return;
    }
    if (!isBlankDraftValue(nextValue) || isBlankDraftValue(existing[key])) {
      merged[key] = nextValue as never;
    }
  });
  return merged;
}

export async function saveOnboardingDraft(
  client: SupabaseClient,
  userId: string,
  input: {
    draft: unknown;
    step?: number;
    email?: string | null;
  }
) {
  const draft = parseOnboardingDraft(input.draft);
  const existing = await loadOnboardingState(client, userId);
  const mergedDraft = mergeOnboardingDrafts(existing.draft, draft);
  const nextStep =
    typeof input.step === "number"
      ? Math.min(8, Math.max(0, input.step))
      : existing.step;

  const patch: Record<string, unknown> = {
    id: userId,
    onboarding_draft: mergedDraft,
    onboarding_step: nextStep,
    ...profilePatchFromDraft(mergedDraft),
  };
  if (!existing.profile && input.email) {
    patch.email = input.email;
  }

  const { data, error } = await client
    .from("profiles")
    .upsert(patch, { onConflict: "id" })
    .select("id, onboarding_step, updated_at, is_published")
    .single();

  if (error) {
    const message = error.message || "Could not save onboarding.";
    if (/onboarding_draft|onboarding_step|is_published|relationship_intentions|column .* does not exist/i.test(message)) {
      throw new Error(
        "Your Supabase database is missing onboarding columns. Run supabase/fixups/bootstrap-onboarding.sql in the SQL Editor, then retry."
      );
    }
    if (/permission denied|42501|row-level security/i.test(message)) {
      throw new Error(
        "Profile save was blocked by database permissions. Run supabase/fixups/bootstrap-onboarding.sql in the SQL Editor, then sign out and back in."
      );
    }
    throw error;
  }
  return { ...data, draft: mergedDraft };
}

export async function publishOnboarding(
  client: SupabaseClient,
  userId: string,
  input: { draft: unknown }
) {
  const draft = parseOnboardingDraft(input.draft);
  const errors = validateForPublish(draft);
  if (errors.length > 0) {
    const err = new Error(errors[0]) as Error & { details: string[] };
    err.details = errors;
    throw err;
  }

  const patch = {
    id: userId,
    onboarding_draft: draft,
    onboarding_step: 8,
    is_published: true,
    ...profilePatchFromDraft(draft),
  };

  const { data, error } = await client
    .from("profiles")
    .upsert(patch, { onConflict: "id" })
    .select("id, is_published, onboarding_step, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export function jsonObject(value: unknown): Record<string, unknown> {
  return asRecord(value);
}
