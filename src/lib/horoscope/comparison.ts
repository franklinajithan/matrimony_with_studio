import { fieldDefinitions, type HoroscopeFields } from "./schema";
// A field comparison, deliberately not a traditional astrology calculation.
export function compareSharedFields(
  a: { tradition: string; fields: HoroscopeFields },
  b: { tradition: string; fields: HoroscopeFields },
) {
  const keys = [
    "rasi",
    "nakshatra",
    "pada",
    "lagna",
    "ayanamsa",
    "dosha",
    "dasha",
  ] as const;
  const timeKnown =
    a.fields.timeQuality &&
    a.fields.timeQuality !== "unknown" &&
    b.fields.timeQuality &&
    b.fields.timeQuality !== "unknown";
  return {
    version: "shared-fields-v1",
    tradition: a.tradition === b.tradition ? a.tradition : "different",
    traditionalResult: {
      status: "unavailable",
      score: null,
      reason:
        a.tradition !== b.tradition
          ? "Different traditions: scoring methods cannot be combined."
          : "No independently validated traditional rule set is enabled.",
    },
    completeness: timeKnown
      ? "Shared birth time quality recorded; no time-sensitive calculations performed."
      : "Birth time quality is unknown or hidden: time-sensitive comparisons excluded.",
    criteria: keys.map((key) => ({
      field: key,
      label: fieldDefinitions.find((f) => f[0] === key)![1],
      first: key === "lagna" && !timeKnown ? null : a.fields[key] || null,
      second: key === "lagna" && !timeKnown ? null : b.fields[key] || null,
      status:
        key === "lagna" && !timeKnown
          ? "excluded"
          : !a.fields[key] || !b.fields[key]
            ? "missing"
            : "recorded",
      result: "No traditional rule result calculated",
    })),
    questions: [
      "Which tradition and documented rule set should an independent astrologer use?",
      "Are the recorded birth details and chart source reliable?",
      "Which relationship values and practical expectations would you like to discuss?",
    ],
  };
}
