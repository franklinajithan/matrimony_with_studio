import { z } from "zod";
export const fieldDefinitions = [
  ["dateOfBirth", "Date of birth", "basic"],
  ["timeOfBirth", "Time of birth", "basic"],
  ["timeQuality", "Birth time quality", "basic"],
  ["birthCity", "Birth city", "basic"],
  ["birthCountry", "Birth country", "basic"],
  ["timezone", "Birth timezone (IANA)", "basic"],
  ["language", "Native language", "basic"],
  ["chartName", "Name on chart (optional)", "basic"],
  ["rasi", "Rasi / ராசி (Moon sign)", "basic"],
  ["nakshatra", "Nakshatra / நட்சத்திரம்", "basic"],
  ["pada", "Pada / பாதம்", "basic"],
  ["lagna", "Lagna / லக்னம்", "advanced"],
  ["ayanamsa", "Ayanamsa", "advanced"],
  ["calculationSource", "Calculation system / source", "advanced"],
  ["tithi", "Tithi", "advanced"],
  ["yoga", "Yoga", "advanced"],
  ["karana", "Karana", "advanced"],
  ["dosha", "Dosha classifications (as recorded)", "advanced"],
  ["dasha", "Dasha periods (as recorded)", "advanced"],
  ["notes", "Additional chart notes", "advanced"],
] as const;
export type FieldKey = (typeof fieldDefinitions)[number][0];
export const fieldKeys = fieldDefinitions.map((f) => f[0]) as [
  FieldKey,
  ...FieldKey[],
];
const short = z.string().trim().max(200);
export const fieldsSchema = z
  .object(
    Object.fromEntries(
      fieldKeys.map((k) => [
        k,
        k === "notes"
          ? z.string().trim().max(2000).optional()
          : short.optional(),
      ]),
    ) as Record<FieldKey, z.ZodOptional<z.ZodString>>,
  )
  .strict()
  .superRefine((f, ctx) => {
    if (
      !f.dateOfBirth ||
      !/^\d{4}-\d{2}-\d{2}$/.test(f.dateOfBirth) ||
      Number.isNaN(Date.parse(f.dateOfBirth)) ||
      new Date(f.dateOfBirth).toISOString().slice(0, 10) !== f.dateOfBirth ||
      f.dateOfBirth > new Date().toISOString().slice(0, 10) ||
      f.dateOfBirth < "1900-01-01"
    )
      ctx.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "Enter a valid date of birth.",
      });
    if (!["exact", "approximate", "unknown"].includes(f.timeQuality || ""))
      ctx.addIssue({
        code: "custom",
        path: ["timeQuality"],
        message: "Choose birth time quality.",
      });
    if (f.timeQuality === "unknown" && f.timeOfBirth)
      ctx.addIssue({
        code: "custom",
        path: ["timeOfBirth"],
        message: "Clear the time when it is unknown.",
      });
    if (
      f.timeQuality !== "unknown" &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.timeOfBirth || "")
    )
      ctx.addIssue({
        code: "custom",
        path: ["timeOfBirth"],
        message: "Enter a 24-hour birth time.",
      });
    if (!f.birthCity || !f.birthCountry || !f.timezone || !f.language)
      ctx.addIssue({
        code: "custom",
        message:
          "Birth city, country, timezone and native language are required.",
      });
    if (f.timezone)
      try {
        new Intl.DateTimeFormat("en", { timeZone: f.timezone });
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["timezone"],
          message: "Use an IANA timezone such as Europe/London.",
        });
      }
    if (f.pada && !/^[1-4]$/.test(f.pada))
      ctx.addIssue({
        code: "custom",
        path: ["pada"],
        message: "Pada must be 1–4.",
      });
  });
export const planetSchema = z
  .object({
    planet: z.enum([
      "Sun",
      "Moon",
      "Mars",
      "Mercury",
      "Jupiter",
      "Venus",
      "Saturn",
      "Rahu",
      "Ketu",
    ]),
    chart: z.enum(["D1", "D9"]),
    sign: z.number().int().min(1).max(12),
    house: z.number().int().min(1).max(12).optional(),
    degrees: z.number().min(0).lt(30).optional(),
  })
  .strict();
export const saveSchema = z
  .object({
    revision: z.number().int().min(0),
    tradition: z.enum(["tamil", "vedic", "western", "other"]),
    visibility: z.enum(["private", "connections", "members"]),
    fields: fieldsSchema,
    shared_fields: z.array(z.enum(fieldKeys)).max(fieldKeys.length),
    comparison_consent: z.boolean(),
    ai_consent: z.boolean(),
    planets: z.array(planetSchema).max(18).default([]),
    extraction_id: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (
      v.fields.timeQuality === "unknown" &&
      (v.fields.lagna || v.planets.some((p) => p.house !== undefined))
    )
      c.addIssue({
        code: "custom",
        message: "Unknown birth time: remove lagna and time-sensitive houses.",
      });
    if (
      new Set(v.planets.map((p) => p.chart + p.planet)).size !==
      v.planets.length
    )
      c.addIssue({
        code: "custom",
        message: "Each planet can appear once in each chart.",
      });
  });
export const candidateSchema = z
  .object({
    field: z.enum(fieldKeys),
    value: z.string().max(2000).nullable(),
    confidence: z.enum(["high", "medium", "low", "not_found"]),
    excerpt: z.string().max(500),
    page: z.number().int().min(1).max(5).nullable(),
  })
  .strict();
export const extractionSchema = z
  .object({
    fields: z.array(candidateSchema).max(fieldKeys.length),
    warnings: z.array(z.string().max(500)).max(20),
  })
  .strict()
  .superRefine((v, c) => {
    if (new Set(v.fields.map((x) => x.field)).size !== v.fields.length)
      c.addIssue({ code: "custom", message: "Duplicate extracted field." });
    for (const f of v.fields)
      if (f.value && (!f.excerpt || !f.page))
        c.addIssue({
          code: "custom",
          message: "Extracted values require source text and page.",
        });
  });
export type HoroscopeFields = z.infer<typeof fieldsSchema>;
export type HoroscopeSave = z.infer<typeof saveSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type HoroscopeRecord = {
  user_id: string;
  tradition: string;
  visibility: string;
  fields: HoroscopeFields;
  shared_fields: FieldKey[];
  comparison_consent: boolean;
  ai_consent: boolean;
  revision: number;
  provenance: Record<string, unknown>;
  planets?: z.infer<typeof planetSchema>[];
  updated_at: string;
};
