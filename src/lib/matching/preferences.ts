import type { Profile } from "@/lib/supabase/types";

export type PartnerPreferences = {
  ageMin?: number; ageMax?: number; countries: string[]; languages: string[]; religions: string[]; professions: string[]; smoking: string[]; drinking: string[];
  gender?: string; maritalStatuses?: string[]; heightMin?: string; heightMax?: string; education?: string[]; relocation?: string; wantsChildren?: string; familyInvolvement?: string; marriageTimeline?: string; mustHaves?: string[];
};
export type DiscoveryFilters = PartnerPreferences & { query: string };
export type PreferenceScore = { matched: number; total: number; percentage: number; reasons: string[]; missing: string[]; failedMustHaves: string[] };

const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && Boolean(v.trim())) : typeof value === "string" && value.trim() ? [value.trim()] : [];
const number = (value: unknown): number | undefined => { const parsed = Number(String(value ?? "").replace(/\D/g, "")); return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined; };
const same = (a?: string, b?: string) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
const neutral = (value?: string) => !value || ["no preference", "doesn't matter", "does not matter", "any", "prefer not to say"].some((v) => same(value, v));
const includes = (values: string[], value?: string) => !values.length || Boolean(value && values.some((v) => same(v, value)));
const record = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};

export function partnerPreferencesFromProfile(profile: Profile): PartnerPreferences {
  const extra = record(profile.extra); const draft = record(profile.onboardingDraft);
  const source = record(extra.partnerPreferences || extra.partner_preferences || draft.partnerPreferences || draft.partner_preferences);
  return {
    ageMin: number(source.ageMin ?? source.age_min ?? source.minAge ?? source.min_age), ageMax: number(source.ageMax ?? source.age_max ?? source.maxAge ?? source.max_age),
    countries: strings(source.countries || source.preferredCountries || source.preferred_countries), languages: strings(source.languages || source.preferredLanguages || source.preferred_languages), religions: strings(source.religions || source.religion), professions: strings(source.professions || source.profession), smoking: strings(source.smoking || source.smokingHabits || source.smoking_habits), drinking: strings(source.drinking || source.drinkingHabits || source.drinking_habits),
    gender: source.gender, maritalStatuses: strings(source.maritalStatuses || source.maritalStatus), heightMin: source.heightMin, heightMax: source.heightMax, education: strings(source.education), relocation: source.relocation, wantsChildren: source.wantsChildren, familyInvolvement: source.familyInvolvement, marriageTimeline: source.marriageTimeline, mustHaves: strings(source.mustHaves),
  };
}
export function filtersFromPreferences(prefs: PartnerPreferences): DiscoveryFilters { return { ...prefs, query: "" }; }

function candidateDetails(profile: Profile) {
  const extra = record(profile.extra); const relationship = record(profile.relationshipIntentions); const lifestyle = record(profile.valuesLifestyle); const family = record(profile.culturalFamily); const settlement = record(profile.settlement); const draft = record(profile.onboardingDraft);
  return {
    gender: String(extra.gender || draft.gender || ""), maritalStatus: String(extra.maritalStatus || relationship.maritalStatus || draft.maritalStatus || ""),
    education: profile.educationLevel || String(extra.education || ""), height: number(profile.height),
    wantsChildren: String(relationship.wantsChildren || relationship.children || extra.wantsChildren || ""), relocation: String(settlement.relocation || settlement.relocationOpenness || extra.relocation || ""),
    familyInvolvement: String(family.familyInvolvement || extra.familyInvolvement || ""), marriageTimeline: String(relationship.marriageTimeline || relationship.timeline || extra.marriageTimeline || ""),
    smoking: profile.smokingHabits || String(lifestyle.smoking || ""), drinking: profile.drinkingHabits || String(lifestyle.drinking || ""),
  };
}

export function profileMatchesFilters(profile: Profile, filters: DiscoveryFilters): boolean {
  const q = filters.query.trim().toLowerCase(); if (q && ![profile.displayName, profile.profession, profile.location, profile.country].some((v) => v?.toLowerCase().includes(q))) return false;
  if (filters.ageMin && profile.ageYears && profile.ageYears < filters.ageMin) return false; if (filters.ageMax && profile.ageYears && profile.ageYears > filters.ageMax) return false;
  if (!includes(filters.countries, profile.country)) return false; if (filters.languages.length && !filters.languages.some((language) => (profile.languages || [profile.language]).some((v) => same(v, language)))) return false;
  if (!includes(filters.religions, profile.religion)) return false;
  if (filters.professions.length && !filters.professions.some((wanted) => profile.profession?.toLowerCase().includes(wanted.toLowerCase()))) return false;
  if (!includes(filters.smoking, profile.smokingHabits)) return false; if (!includes(filters.drinking, profile.drinkingHabits)) return false; return true;
}

export function preferenceScore(profile: Profile, prefs: PartnerPreferences): PreferenceScore {
  const c = candidateDetails(profile); const checks: { key: string; label: string; applies: boolean; known: boolean; matched: boolean }[] = [];
  const add = (key: string, label: string, applies: boolean, known: boolean, matched: boolean) => checks.push({ key, label, applies, known, matched });
  add("Age", "Age", Boolean(prefs.ageMin || prefs.ageMax), Boolean(profile.ageYears), Boolean(profile.ageYears && (!prefs.ageMin || profile.ageYears >= prefs.ageMin) && (!prefs.ageMax || profile.ageYears <= prefs.ageMax)));
  add("Country", profile.country || "Country", prefs.countries.length > 0, Boolean(profile.country), includes(prefs.countries, profile.country));
  const profileLanguages = profile.languages?.length ? profile.languages : strings(profile.language); const language = prefs.languages.find((wanted) => profileLanguages.some((v) => same(v, wanted)));
  add("Language", language || "Language", prefs.languages.length > 0, profileLanguages.length > 0, Boolean(language));
  add("Religion", profile.religion || "Religion", prefs.religions.length > 0, Boolean(profile.religion), includes(prefs.religions, profile.religion));
  add("Profession", "Profession", prefs.professions.length > 0, Boolean(profile.profession), prefs.professions.some((wanted) => profile.profession?.toLowerCase().includes(wanted.toLowerCase())));
  add("Smoking", "Smoking", prefs.smoking.length > 0, Boolean(c.smoking), includes(prefs.smoking, c.smoking)); add("Drinking", "Drinking", prefs.drinking.length > 0, Boolean(c.drinking), includes(prefs.drinking, c.drinking));
  add("Gender", c.gender || "Gender", Boolean(prefs.gender && !neutral(prefs.gender)), Boolean(c.gender), same(prefs.gender, c.gender));
  add("Marital status", c.maritalStatus || "Marital status", Boolean(prefs.maritalStatuses?.length), Boolean(c.maritalStatus), Boolean(prefs.maritalStatuses?.some((v) => same(v, c.maritalStatus))));
  const minH = number(prefs.heightMin), maxH = number(prefs.heightMax); add("Height", "Height", Boolean(minH || maxH), Boolean(c.height), Boolean(c.height && (!minH || c.height >= minH) && (!maxH || c.height <= maxH)));
  add("Education", c.education || "Education", Boolean(prefs.education?.length), Boolean(c.education), Boolean(prefs.education?.some((v) => c.education.toLowerCase().includes(v.toLowerCase()))));
  add("Children", "Children plans", Boolean(prefs.wantsChildren && !neutral(prefs.wantsChildren)), Boolean(c.wantsChildren), same(prefs.wantsChildren, c.wantsChildren));
  add("Relocation", "Relocation", Boolean(prefs.relocation && !neutral(prefs.relocation)), Boolean(c.relocation), same(prefs.relocation, c.relocation));
  add("Family involvement", "Family values", Boolean(prefs.familyInvolvement && !neutral(prefs.familyInvolvement)), Boolean(c.familyInvolvement), same(prefs.familyInvolvement, c.familyInvolvement));
  add("Marriage timeline", "Marriage timeline", Boolean(prefs.marriageTimeline && !neutral(prefs.marriageTimeline)), Boolean(c.marriageTimeline), same(prefs.marriageTimeline, c.marriageTimeline));
  const applicable = checks.filter((x) => x.applies); const known = applicable.filter((x) => x.known); const matched = known.filter((x) => x.matched);
  const must = prefs.mustHaves || []; const failedMustHaves = applicable.filter((x) => must.some((m) => same(m, x.key)) && (!x.known || !x.matched)).map((x) => x.key);
  return { matched: matched.length, total: known.length, percentage: known.length ? Math.round((matched.length / known.length) * 100) : 0, reasons: matched.map((x) => x.label).slice(0, 5), missing: applicable.filter((x) => !x.known).map((x) => x.key), failedMustHaves };
}
export function preferenceReasons(profile: Profile, prefs: PartnerPreferences): string[] { return preferenceScore(profile, prefs).reasons; }
export function preferenceMatchCount(profile: Profile, prefs: PartnerPreferences): { matched: number; total: number } { const score = preferenceScore(profile, prefs); return { matched: score.matched, total: score.total }; }
