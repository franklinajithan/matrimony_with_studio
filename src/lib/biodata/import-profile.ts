import type { Profile } from "@/lib/supabase/types";
import { calculateAge } from "@/lib/utils";
import { sectionTitle, t, type LabelKey } from "./labels";
import type {
  BiodataContent,
  BiodataField,
  BiodataLanguage,
  BiodataSection,
  BiodataVisibility,
} from "./types";

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlaceholderPhoto(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("placehold.co") ||
    lower.includes("placeholder") ||
    lower.includes("default-avatar") ||
    lower.includes("/path/to/default")
  );
}

function field(
  id: string,
  lang: BiodataLanguage,
  labelKey: LabelKey,
  value: string
): BiodataField {
  return {
    id,
    label: t(lang, labelKey),
    value: value.trim(),
    visible: true,
  };
}

function buildSection(
  id: string,
  lang: BiodataLanguage,
  fields: BiodataField[],
  visible = true
): BiodataSection | null {
  const kept = fields.filter((f) => isNonEmpty(f.value));
  if (kept.length === 0) return null;
  return {
    id,
    title: sectionTitle(lang, id),
    visible,
    fields: kept,
  };
}

function resolveAge(profile: Profile): string | null {
  if (typeof profile.ageYears === "number" && profile.ageYears > 0) {
    return String(profile.ageYears);
  }
  const fromDob = calculateAge(profile.dob);
  return typeof fromDob === "number" && fromDob > 0 ? String(fromDob) : null;
}

function resolveLocation(profile: Profile): string | null {
  const parts = [profile.location, profile.region].filter(isNonEmpty);
  if (parts.length > 0) return parts.join(", ");
  return null;
}

function resolveLanguages(profile: Profile): string | null {
  if (Array.isArray(profile.languages) && profile.languages.length > 0) {
    const cleaned = profile.languages.map((l) => l.trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned.join(", ");
  }
  if (isNonEmpty(profile.language)) return profile.language.trim();
  return null;
}

/**
 * Snapshot profile fields into biodata content.
 * Omits empty values; never fabricates caste/income/complexion or sensitive contacts.
 */
export function importProfileToContent(
  profile: Profile,
  lang: BiodataLanguage
): {
  content: BiodataContent;
  visibility: BiodataVisibility;
  sectionOrder: string[];
} {
  const sections: BiodataSection[] = [];

  const personalFields: BiodataField[] = [];
  if (isNonEmpty(profile.displayName)) {
    personalFields.push(field("name", lang, "name", profile.displayName));
  }
  const age = resolveAge(profile);
  if (age) personalFields.push(field("age", lang, "age", age));
  if (isNonEmpty(profile.height)) {
    personalFields.push(field("height", lang, "height", profile.height));
  }
  const personal = buildSection("personal", lang, personalFields);
  if (personal) sections.push(personal);

  const careerFields: BiodataField[] = [];
  if (isNonEmpty(profile.educationLevel)) {
    careerFields.push(field("education", lang, "education", profile.educationLevel));
  }
  if (isNonEmpty(profile.profession)) {
    careerFields.push(field("profession", lang, "profession", profile.profession));
  }
  const career = buildSection("education-career", lang, careerFields);
  if (career) sections.push(career);

  const locationFields: BiodataField[] = [];
  const location = resolveLocation(profile);
  if (location) locationFields.push(field("location", lang, "location", location));
  if (isNonEmpty(profile.country)) {
    locationFields.push(field("country", lang, "country", profile.country));
  }
  const locationSection = buildSection("location", lang, locationFields);
  if (locationSection) sections.push(locationSection);

  const languagesValue = resolveLanguages(profile);
  const languagesSection = buildSection("languages", lang, [
    ...(languagesValue ? [field("languages", lang, "languages", languagesValue)] : []),
  ]);
  if (languagesSection) sections.push(languagesSection);

  const interestFields: BiodataField[] = [];
  if (isNonEmpty(profile.hobbies)) {
    interestFields.push(field("hobbies", lang, "hobbies", profile.hobbies));
  }
  const interests = buildSection("interests", lang, interestFields);
  if (interests) sections.push(interests);

  // Optional cultural section — only when member entered religion; not mandatory / not auto-shown.
  if (isNonEmpty(profile.religion)) {
    const cultural = buildSection(
      "cultural",
      lang,
      [field("religion", lang, "religion", profile.religion)],
      false
    );
    if (cultural) sections.push(cultural);
  }

  const horoscopeFields: BiodataField[] = [];
  if (isNonEmpty(profile.sunSign)) {
    horoscopeFields.push(field("sunSign", lang, "sunSign", profile.sunSign));
  }
  if (isNonEmpty(profile.moonSign)) {
    horoscopeFields.push(field("moonSign", lang, "moonSign", profile.moonSign));
  }
  if (isNonEmpty(profile.nakshatra)) {
    horoscopeFields.push(field("nakshatra", lang, "nakshatra", profile.nakshatra));
  }
  if (isNonEmpty(profile.horoscopeInfo)) {
    horoscopeFields.push(field("horoscopeInfo", lang, "horoscopeInfo", profile.horoscopeInfo));
  }
  const horoscope = buildSection("horoscope", lang, horoscopeFields, false);
  if (horoscope) sections.push(horoscope);

  const hasRealPhoto = !isPlaceholderPhoto(profile.photoURL);

  const content: BiodataContent = {
    introduction: isNonEmpty(profile.bio) ? profile.bio.trim() : "",
    sections,
    ...(hasRealPhoto ? { photoUrl: profile.photoURL.trim() } : {}),
  };

  const visibility: BiodataVisibility = {
    includePhoto: hasRealPhoto,
    includeDob: false,
    includePhone: false,
    includeEmail: false,
    includeExactAddress: false,
    includeFamilyContacts: false,
    includeReligious: false,
    includeHoroscope: false,
  };

  return {
    content,
    visibility,
    sectionOrder: sections.map((s) => s.id),
  };
}
