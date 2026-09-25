import type { Profile } from "@/lib/supabase/types";

export type PartnerPreferences = {
  ageMin?: number; ageMax?: number; countries: string[]; languages: string[]; religions: string[]; professions: string[]; smoking: string[]; drinking: string[];
  gender?: string; maritalStatuses?: string[]; heightMin?: string; heightMax?: string; education?: string[]; relocation?: string; wantsChildren?: string; familyInvolvement?: string; marriageTimeline?: string; mustHaves?: string[];
};
export type DiscoveryFilters = PartnerPreferences & { query: string };
export type PreferenceScore = { matched: number; total: number; percentage: number; reasons: string[]; missing: string[]; failedMustHaves: string[] };

const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && Boolean(v.trim())) : typeof value === "string" && value.trim() ? [value.trim()] : [];
const number = (value: unknown): number | undefined => { const parsed = Number(String(value ?? "").replace(/\D/g, "")); return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined; };
const canonical = (value?: string) => {
  const normalized = String(value || "").trim().toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ");
  const aliases: Record<string, string> = {
    hindu: "hinduism", buddhist: "buddhism", catholic: "christianity", christian: "christianity",
    muslim: "islam", islamic: "islam", sikh: "sikhism", jain: "jainism",
    male: "man", female: "woman",
    bachelors: "bachelor's", bachelor: "bachelor's", masters: "master's", master: "master's",
  };
  return aliases[normalized] || normalized;
};
const same = (a?: string, b?: string) => Boolean(a && b && canonical(a) === canonical(b));
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
  const extra = record(profile.extra); const match = record(extra.matchDetails); const relationship = record(profile.relationshipIntentions); const lifestyle = record(profile.valuesLifestyle); const family = record(profile.culturalFamily); const settlement = record(profile.settlement); const draft = record(profile.onboardingDraft);
  return {
    gender: String(match.gender || extra.gender || draft.gender || ""), maritalStatus: String(match.maritalStatus || extra.maritalStatus || relationship.maritalStatus || draft.maritalStatus || ""),
    country: String(match.country || profile.country || ""), languages: strings(match.languages).length ? strings(match.languages) : (profile.languages?.length ? profile.languages : strings(profile.language)),
    education: profile.educationLevel || String(match.education || extra.education || ""), height: number(profile.height || match.height),
    wantsChildren: String(match.wantsChildren || relationship.wantsChildren || relationship.children || extra.wantsChildren || ""), relocation: String(match.relocation || settlement.relocation || settlement.relocationOpenness || extra.relocation || ""),
    familyInvolvement: String(match.familyInvolvement || family.familyInvolvement || extra.familyInvolvement || ""), marriageTimeline: String(match.marriageTimeline || relationship.marriageTimeline || relationship.timeline || extra.marriageTimeline || ""),
    smoking: profile.smokingHabits || String(match.smoking || lifestyle.smoking || ""), drinking: profile.drinkingHabits || String(match.drinking || lifestyle.drinking || ""),
  };
}

export function profileMatchesFilters(profile: Profile, filters: DiscoveryFilters): boolean {
  const c = candidateDetails(profile); const q = filters.query.trim().toLowerCase(); if (q && ![profile.displayName, profile.profession, profile.location, c.country].some((v) => v?.toLowerCase().includes(q))) return false;
  if (filters.ageMin && profile.ageYears && profile.ageYears < filters.ageMin) return false; if (filters.ageMax && profile.ageYears && profile.ageYears > filters.ageMax) return false;
  if (!includes(filters.countries, c.country)) return false; if (filters.languages.length && !filters.languages.some((language) => c.languages.some((v) => same(v, language)))) return false;
  if (!includes(filters.religions, profile.religion)) return false;
  if (filters.professions.length && !filters.professions.some((wanted) => profile.profession?.toLowerCase().includes(wanted.toLowerCase()))) return false;
  if (!includes(filters.smoking, c.smoking)) return false; if (!includes(filters.drinking, c.drinking)) return false;
  if (filters.gender && !neutral(filters.gender) && !same(filters.gender, c.gender)) return false;
  if (filters.maritalStatuses?.length && !filters.maritalStatuses.some((v) => neutral(v) || same(v, c.maritalStatus))) return false;
  const minH = number(filters.heightMin), maxH = number(filters.heightMax);
  if (minH && (!c.height || c.height < minH)) return false;
  if (maxH && (!c.height || c.height > maxH)) return false;
  if (filters.education?.length && !filters.education.some((v) => c.education && (same(v, c.education) || canonical(c.education).includes(canonical(v))))) return false;
  if (filters.wantsChildren && !neutral(filters.wantsChildren) && !same(filters.wantsChildren, c.wantsChildren)) return false;
  if (filters.relocation && !neutral(filters.relocation) && !same(filters.relocation, c.relocation)) return false;
  if (filters.familyInvolvement && !neutral(filters.familyInvolvement) && !same(filters.familyInvolvement, c.familyInvolvement)) return false;
  if (filters.marriageTimeline && !neutral(filters.marriageTimeline) && !same(filters.marriageTimeline, c.marriageTimeline)) return false;
  return true;
}

export function preferenceScore(profile: Profile, prefs: PartnerPreferences): PreferenceScore {
  const c = candidateDetails(profile); const checks: { key: string; label: string; applies: boolean; known: boolean; matched: boolean }[] = [];
  const add = (key: string, label: string, applies: boolean, known: boolean, matched: boolean) => checks.push({ key, label, applies, known, matched });
  add("Age", "Age", Boolean(prefs.ageMin || prefs.ageMax), Boolean(profile.ageYears), Boolean(profile.ageYears && (!prefs.ageMin || profile.ageYears >= prefs.ageMin) && (!prefs.ageMax || profile.ageYears <= prefs.ageMax)));
  add("Country", c.country || "Country", prefs.countries.length > 0, Boolean(c.country), includes(prefs.countries, c.country));
  const language = prefs.languages.find((wanted) => c.languages.some((v) => same(v, wanted))); add("Language", language || "Language", prefs.languages.length > 0, c.languages.length > 0, Boolean(language));
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