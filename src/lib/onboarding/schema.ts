import { z } from "zod";

export const ONBOARDING_STEP_COUNT = 8;

export const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "si", label: "Sinhala" },
  { id: "ta", label: "Tamil" },
  { id: "hi", label: "Hindi" },
  { id: "other", label: "Other" },
] as const;

// ISO 3166-1 alpha-2 countries and territories. Keep the existing profile
// display-name values compatible with the database and older onboarding drafts.
// The list intentionally includes territories rather than limiting registration
// to a handful of launch markets.
const ISO_COUNTRY_CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
const englishCountryNames = new Intl.DisplayNames(["en"], { type: "region" });
export const COUNTRY_OPTIONS: string[] = ISO_COUNTRY_CODES
  .map((code) => englishCountryNames.of(code))
  .filter((name): name is string => Boolean(name))
  .sort((a, b) => a.localeCompare(b, "en"));

const optionalText = z.string().max(500).optional().or(z.literal(""));
const optionalLongText = z.string().max(2000).optional().or(z.literal(""));
const optionalUrl = z.string().max(4000).optional().or(z.literal(""));
const optionalPath = z.string().max(1000).optional().or(z.literal(""));

export const onboardingDraftSchema = z.object({
  displayName: z.string().max(80).optional().or(z.literal("")),
  gender: z.enum(["male", "female"]).optional(),
  hideName: z.boolean().optional(),
  aliasName: z.string().max(80).optional().or(z.literal("")),
  profilePhotoGrayscale: z.boolean().optional(),
  dob: z.string().max(32).optional().or(z.literal("")),
  // Kept for backwards compatibility with drafts saved before DOB became the sole age check.
  confirmedAdult: z.boolean().optional(),
  height: optionalText,
  profession: optionalText,
  country: optionalText,
  region: optionalText,
  languages: z.array(z.string().max(40)).max(12).optional(),
  lookingFor: optionalText,
  relationshipTimeline: optionalText,
  partnershipStyle: optionalText,
  bio: optionalLongText,
  educationLevel: optionalText,
  smokingHabits: optionalText,
  drinkingHabits: optionalText,
  hobbies: optionalText,
  faithImportance: optionalText,
  familyImportance: optionalText,
  religion: optionalText,
  culturalBackground: optionalText,
  familyInvolvement: optionalText,
  festivalImportance: optionalText,
  skippedCultural: z.boolean().optional(),
  currentCountry: optionalText,
  preferredSettlement: z.array(z.string().max(80)).max(12).optional(),
  relocationOpenness: optionalText,
  longDistanceOk: optionalText,
  familyResponsibilities: optionalLongText,
  photoURL: optionalUrl,
  photoStoragePath: optionalPath,
  additionalPhotoUrls: z.array(z.object({
    id: z.string().max(500),
    url: z.string().max(4000),
    hint: z.string().max(120).optional().default("profile photo"),
    storagePath: z.string().max(1000).optional(),
  })).max(8).optional(),
  photoPrivacy: z.enum(["members", "connections", "hidden"]).optional(),
  reviewConfirmed: z.boolean().optional(),
});

export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  displayName: "", gender: undefined, hideName: false, aliasName: "", profilePhotoGrayscale: false, dob: "", confirmedAdult: false, height: "", profession: "", country: "", region: "", languages: [],
  lookingFor: "", relationshipTimeline: "", partnershipStyle: "", bio: "", educationLevel: "", smokingHabits: "",
  drinkingHabits: "", hobbies: "", faithImportance: "", familyImportance: "", religion: "", culturalBackground: "",
  familyInvolvement: "", festivalImportance: "", skippedCultural: false, currentCountry: "", preferredSettlement: [],
  relocationOpenness: "", longDistanceOk: "", familyResponsibilities: "", photoURL: "", photoStoragePath: "",
  additionalPhotoUrls: [], photoPrivacy: "members", reviewConfirmed: false,
};

/** Exact calendar-date adult check. DOB is parsed locally to avoid UTC timezone boundary errors. */
export function isAdult(dob: string, now = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return false;
  const eighteenth = new Date(year + 18, month - 1, day);
  return now.getTime() >= eighteenth.getTime();
}

export function parseOnboardingDraft(input: unknown): OnboardingDraft {
  const parsed = onboardingDraftSchema.safeParse(sanitizeDraftInput(input));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.length ? issue.path.join(".") : "draft";
    throw new Error(`${path}: ${issue?.message || "Invalid onboarding data."}`);
  }
  return { ...EMPTY_ONBOARDING_DRAFT, ...parsed.data };
}

function sanitizeDraftInput(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input ?? {};
  const row = { ...(input as Record<string, unknown>) };
  const clamp = (value: unknown, max: number) => typeof value === "string" && value.length > max ? value.slice(0, max) : value;
  row.displayName = clamp(row.displayName, 80);
  row.dob = clamp(row.dob, 32);
  row.bio = clamp(row.bio, 2000);
  row.familyResponsibilities = clamp(row.familyResponsibilities, 2000);
  row.photoURL = clamp(row.photoURL, 4000);
  row.photoStoragePath = clamp(row.photoStoragePath, 1000);
  for (const key of Object.keys(row)) {
    if (["displayName", "gender", "hideName", "aliasName", "profilePhotoGrayscale", "dob", "bio", "familyResponsibilities", "photoURL", "photoStoragePath", "languages", "preferredSettlement", "additionalPhotoUrls", "confirmedAdult", "skippedCultural", "photoPrivacy", "reviewConfirmed"].includes(key)) continue;
    if (typeof row[key] === "string") row[key] = clamp(row[key], 500);
  }
  if (Array.isArray(row.additionalPhotoUrls)) {
    row.additionalPhotoUrls = row.additionalPhotoUrls.map((item) => {
      if (!item || typeof item !== "object") return item;
      const photo = { ...(item as Record<string, unknown>) };
      photo.id = clamp(photo.id, 500); photo.url = clamp(photo.url, 4000); photo.hint = clamp(photo.hint, 120); photo.storagePath = clamp(photo.storagePath, 1000);
      return photo;
    });
  }
  return row;
}

const stepSchemas: Record<number, z.ZodTypeAny> = {
  0: z.object({
    displayName: z.string().trim().min(2, "Please enter your name."),
    gender: z.enum(["male", "female"], { errorMap: () => ({ message: "Please select Male or Female." }) }),
    dob: z.string().min(8, "Date of birth is required."),
  }).superRefine((value, ctx) => {
    if (!isAdult(value.dob)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "You must be 18 or older to create a profile.", path: ["dob"] });
    }
  }),
  1: z.object({ country: z.string().trim().min(2, "Select your country."), region: z.string().trim().min(2, "Add a city or region, not a street address."), languages: z.array(z.string()).min(1, "Select at least one language.") }),
  2: z.object({ lookingFor: z.string().trim().min(2, "Tell us what you are looking for."), relationshipTimeline: z.string().trim().min(2, "Choose a timeline.") }),
  3: z.object({ bio: z.string().trim().min(20, "Write at least a short introduction (20 characters)."), educationLevel: z.string().trim().min(1, "Select your education level.") }),
  4: z.object({}).optional(),
  5: z.object({ relocationOpenness: z.string().trim().min(2, "Tell us how open you are to relocating.") }),
  6: z.object({ photoPrivacy: z.enum(["members", "connections", "hidden"], { errorMap: () => ({ message: "Choose a photo privacy option." }) }) }),
  7: z.object({ reviewConfirmed: z.literal(true, { errorMap: () => ({ message: "Please confirm your details before publishing." }) }) }),
};

export function validateOnboardingStep(step: number, draft: OnboardingDraft): string[] {
  const schema = stepSchemas[step];
  if (!schema) return ["Unknown step."];
  const parsed = schema.safeParse(draft);
  if (parsed.success) return [];
  return parsed.error.issues.map((issue) => issue.message);
}

export function validateForPublish(draft: OnboardingDraft): string[] {
  const errors: string[] = [];
  for (const step of [0, 1, 2, 3, 5, 6, 7]) errors.push(...validateOnboardingStep(step, draft));
  return errors;
}

export const ONBOARDING_STEPS = [
  { id: 0, title: "About you", description: "Basic details and adult eligibility" },
  { id: 1, title: "Where you live", description: "Country, region and languages" },
  { id: 2, title: "Intentions", description: "What you are looking for" },
  { id: 3, title: "Values", description: "Lifestyle and what matters" },
  { id: 4, title: "Culture", description: "Optional family and cultural preferences" },
  { id: 5, title: "Future", description: "Settlement and relocation" },
  { id: 6, title: "Photos", description: "Photos and privacy" },
  { id: 7, title: "Review", description: "Check and publish when you are ready" },
] as const;
