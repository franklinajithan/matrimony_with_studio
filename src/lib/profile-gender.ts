/** Read older display labels as well as the canonical values used by matching. */
export function normalizeProfileGender(value: unknown): "male" | "female" | "non-binary" | "" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "male" || normalized === "man") return "male";
  if (normalized === "female" || normalized === "woman") return "female";
  if (normalized === "non-binary" || normalized === "nonbinary") return "non-binary";
  return "";
}
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function readProfileGender(profile: { extra?: unknown; onboardingDraft?: unknown }): ReturnType<typeof normalizeProfileGender> {
  const extra = record(profile.extra);
  return normalizeProfileGender(extra.gender) || normalizeProfileGender(record(extra.matchDetails).gender) || normalizeProfileGender(record(profile.onboardingDraft).gender);
}

export function profileGenderPatch(profile: { extra?: unknown; onboardingDraft?: unknown }, value: unknown) {
  const gender = normalizeProfileGender(value);
  if (!gender) return {};
  const extra = record(profile.extra);
  const label = gender === "male" ? "Man" : gender === "female" ? "Woman" : "Non-binary";
  const onboardingDraft = { ...record(profile.onboardingDraft) };
  // The onboarding wizard currently accepts only male/female. Keep its draft valid.
  if (gender === "male" || gender === "female") onboardingDraft.gender = gender;
  else delete onboardingDraft.gender;
  return {
    extra: { ...extra, gender, matchDetails: { ...record(extra.matchDetails), gender: label } },
    onboardingDraft,
  };
}
