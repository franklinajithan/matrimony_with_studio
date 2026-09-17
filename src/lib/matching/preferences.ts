import type { Profile } from "@/lib/supabase/types";

export type PartnerPreferences = {
  ageMin?: number;
  ageMax?: number;
  countries: string[];
  languages: string[];
  religions: string[];
  professions: string[];
  smoking: string[];
  drinking: string[];
};

export type DiscoveryFilters = PartnerPreferences & { query: string };

const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && Boolean(v.trim())) : [];
const number = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

/**
 * Reads partner preferences without requiring a schema migration. New onboarding
 * stores can use extra.partnerPreferences; legacy drafts are also understood.
 */
export function partnerPreferencesFromProfile(profile: Profile): PartnerPreferences {
  const extra = (profile.extra || {}) as Record<string, any>;
  const draft = (profile.onboardingDraft || {}) as Record<string, any>;
  const source = (extra.partnerPreferences || extra.partner_preferences || draft.partnerPreferences || draft.partner_preferences || {}) as Record<string, any>;
  const preferredCountries = strings(source.countries || source.preferredCountries || source.preferred_countries);
  const preferredLanguages = strings(source.languages || source.preferredLanguages || source.preferred_languages);
  return {
    ageMin: number(source.ageMin ?? source.age_min ?? source.minAge ?? source.min_age),
    ageMax: number(source.ageMax ?? source.age_max ?? source.maxAge ?? source.max_age),
    countries: preferredCountries,
    languages: preferredLanguages,
    religions: strings(source.religions || source.religion),
    professions: strings(source.professions || source.profession),
    smoking: strings(source.smoking || source.smokingHabits || source.smoking_habits),
    drinking: strings(source.drinking || source.drinkingHabits || source.drinking_habits),
  };
}

export function filtersFromPreferences(prefs: PartnerPreferences): DiscoveryFilters {
  return { ...prefs, query: "" };
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const includes = (values: string[], value?: string) => !values.length || Boolean(value && values.some((v) => same(v, value)));

export function profileMatchesFilters(profile: Profile, filters: DiscoveryFilters): boolean {
  const q = filters.query.trim().toLowerCase();
  if (q && ![profile.displayName, profile.profession, profile.location, profile.country].some((v) => v?.toLowerCase().includes(q))) return false;
  if (filters.ageMin && profile.ageYears && profile.ageYears < filters.ageMin) return false;
  if (filters.ageMax && profile.ageYears && profile.ageYears > filters.ageMax) return false;
  if (!includes(filters.countries, profile.country)) return false;
  if (filters.languages.length && !filters.languages.some((language) => (profile.languages || []).some((v) => same(v, language)))) return false;
  if (!includes(filters.religions, profile.religion)) return false;
  if (!includes(filters.professions, profile.profession)) return false;
  if (!includes(filters.smoking, profile.smokingHabits)) return false;
  if (!includes(filters.drinking, profile.drinkingHabits)) return false;
  return true;
}

export function preferenceReasons(profile: Profile, prefs: PartnerPreferences): string[] {
  const reasons: string[] = [];
  if ((prefs.ageMin || prefs.ageMax) && profile.ageYears && (!prefs.ageMin || profile.ageYears >= prefs.ageMin) && (!prefs.ageMax || profile.ageYears <= prefs.ageMax)) reasons.push("Age preference");
  if (prefs.countries.length && includes(prefs.countries, profile.country)) reasons.push(profile.country || "Location");
  if (prefs.languages.length) {
    const language = prefs.languages.find((wanted) => (profile.languages || []).some((v) => same(v, wanted)));
    if (language) reasons.push(language);
  }
  if (prefs.religions.length && includes(prefs.religions, profile.religion)) reasons.push(profile.religion);
  if (prefs.professions.length && includes(prefs.professions, profile.profession)) reasons.push("Profession preference");
  return reasons.slice(0, 4);
}

export function preferenceMatchCount(profile: Profile, prefs: PartnerPreferences): { matched: number; total: number } {
  const checks: boolean[] = [];
  if (prefs.ageMin || prefs.ageMax) checks.push(Boolean(profile.ageYears && (!prefs.ageMin || profile.ageYears >= prefs.ageMin) && (!prefs.ageMax || profile.ageYears <= prefs.ageMax)));
  if (prefs.countries.length) checks.push(includes(prefs.countries, profile.country));
  if (prefs.languages.length) checks.push(prefs.languages.some((wanted) => (profile.languages || []).some((v) => same(v, wanted))));
  if (prefs.religions.length) checks.push(includes(prefs.religions, profile.religion));
  if (prefs.professions.length) checks.push(includes(prefs.professions, profile.profession));
  if (prefs.smoking.length) checks.push(includes(prefs.smoking, profile.smokingHabits));
  if (prefs.drinking.length) checks.push(includes(prefs.drinking, profile.drinkingHabits));
  return { matched: checks.filter(Boolean).length, total: checks.length };
}
