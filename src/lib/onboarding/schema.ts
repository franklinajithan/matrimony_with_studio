import { z } from "zod";
import { calculateAge } from "@/lib/utils";

export const ONBOARDING_STEP_COUNT = 8;

export const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "si", label: "Sinhala" },
  { id: "ta", label: "Tamil" },
  { id: "hi", label: "Hindi" },
  { id: "other", label: "Other" },
] as const;

export const COUNTRY_OPTIONS = [
  "Sri Lanka",
  "India",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Other",
] as const;

const optionalText = z.string().max(500).optional().or(z.literal(""));
const optionalLongText = z.string().max(2000).optional().or(z.literal(""));
/** Signed storage URLs and OAuth avatars regularly exceed 500 chars. */
const optionalUrl = z.string().max(4000).optional().or(z.literal(""));
const optionalPath = z.string().max(1000).optional().or(z.literal(""));

export const onboardingDraftSchema = z.object({
  displayName: z.string().max(80).optional().or(z.literal("")),
  dob: z.string().max(32).optional().or(z.literal("")),
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
  additionalPhotoUrls: z
    .array(
      z.object({
        id: z.string().max(500),
        url: z.string().max(4000),
        hint: z.string().max(120).optional().default("profile photo"),
        storagePath: z.string().max(1000).optional(),
      })
    )
    .max(8)
    .optional(),
  photoPrivacy: z.enum(["members", "connections", "hidden"]).optional(),

  reviewConfirmed: z.boolean().optional(),
});

export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  displayName: "",
  dob: "",
  confirmedAdult: false,
  height: "",
  profession: "",
  country: "",
  region: "",
  languages: [],
  lookingFor: "",
  relationshipTimeline: "",
  partnershipStyle: "",
  bio: "",
  educationLevel: "",
  smokingHabits: "",
  drinkingHabits: "",
  hobbies: "",
  faithImportance: "",
  familyImportance: "",
  religion: "",
  culturalBackground: "",
  familyInvolvement: "",
  festivalImportance: "",
  skippedCultural: false,
  currentCountry: "",
  preferredSettlement: [],
  relocationOpenness: "",
  longDistanceOk: "",
  familyResponsibilities: "",
  photoURL: "",
  photoStoragePath: "",
  additionalPhotoUrls: [],
  photoPrivacy: "members",
  reviewConfirmed: false,
};

export function isAdult(dob: string, now = new Date()): boolean {
  const age = calculateAge(dob);
  if (age === undefined) return false;
  if (age > 18) return true;
  if (age < 18) return false;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return false;
  const eighteenth = new Date(birth);
  eighteenth.setFullYear(eighteenth.getFullYear() + 18);
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

/** Keep draft saves working when profile/photo URLs are longer than older limits. */
function sanitizeDraftInput(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input ?? {};
  const row = { ...(input as Record<string, unknown>) };

  const clamp = (value: unknown, max: number) =>
    typeof value === "string" && value.length > max ? value.slice(0, max) : value;

  row.displayName = clamp(row.displayName, 80);
  row.dob = clamp(row.dob, 32);
  row.bio = clamp(row.bio, 2000);
  row.familyResponsibilities = clamp(row.familyResponsibilities, 2000);
  row.photoURL = clamp(row.photoURL, 4000);
  row.photoStoragePath = clamp(row.photoStoragePath, 1000);

  for (const key of Object.keys(row)) {
    if (
      [
        "displayName",
        "dob",
        "bio",
        "familyResponsibilities",
        "photoURL",
        "photoStoragePath",
        "languages",
        "preferredSettlement",
        "additionalPhotoUrls",
        "confirmedAdult",
        "skippedCultural",
        "photoPrivacy",
        "reviewConfirmed",
      ].includes(key)
    ) {
      continue;
    }
    if (typeof row[key] === "string") {
      row[key] = clamp(row[key], 500);
    }
  }

  if (Array.isArray(row.additionalPhotoUrls)) {
    row.additionalPhotoUrls = row.additionalPhotoUrls.map((item) => {
      if (!item || typeof item !== "object") return item;
      const photo = { ...(item as Record<string, unknown>) };
      photo.id = clamp(photo.id, 500);
      photo.url = clamp(photo.url, 4000);
      photo.hint = clamp(photo.hint, 120);
      photo.storagePath = clamp(photo.storagePath, 1000);
      return photo;
    });
  }

  return row;
}

const stepSchemas: Record<number, z.ZodTypeAny> = {
  0: z
    .object({
      displayName: z.string().trim().min(2, "Please enter your name."),
      dob: z.string().min(8, "Date of birth is required."),
      confirmedAdult: z.literal(true, {
        errorMap: () => ({ message: "You must confirm you are 18 or older." }),
      }),
    })
    .superRefine((value, ctx) => {
      if (!isAdult(value.dob)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "You must be 18 or older to create a profile.",
          path: ["dob"],
        });
      }
    }),
  1: z.object({
    country: z.string().trim().min(2, "Select your country."),
    region: z.string().trim().min(2, "Add a city or region, not a street address."),
    languages: z.array(z.string()).min(1, "Select at least one language."),
  }),
  2: z.object({
    lookingFor: z.string().trim().min(2, "Tell us what you are looking for."),
    relationshipTimeline: z.string().trim().min(2, "Choose a timeline."),
  }),
  3: z.object({
    bio: z.string().trim().min(20, "Write at least a short introduction (20 characters)."),
    educationLevel: z.string().trim().min(1, "Select your education level."),
  }),
  4: z.object({}).optional(),
  5: z.object({
    relocationOpenness: z.string().trim().min(2, "Tell us how open you are to relocating."),
  }),
  6: z.object({
    photoPrivacy: z.enum(["members", "connections", "hidden"], {
      errorMap: () => ({ message: "Choose a photo privacy option." }),
    }),
  }),
  7: z.object({
    reviewConfirmed: z.literal(true, {
      errorMap: () => ({ message: "Please confirm your details before publishing." }),
    }),
  }),
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
  for (const step of [0, 1, 2, 3, 5, 6, 7]) {
    errors.push(...validateOnboardingStep(step, draft));
  }
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
