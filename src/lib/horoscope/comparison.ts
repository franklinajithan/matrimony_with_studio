import { fieldDefinitions, type HoroscopeFields } from "./schema";
// Nakshatras in zodiac order. Match complete names to avoid guessing from free text.
const nakshatras = [
  "ashwini aswini அசுவினி அஸ்வினி", "bharani பரணி", "krittika karthigai கார்த்திகை",
  "rohini ரோகிணி", "mrigashira mrigasirisham மிருகசீரிடம்", "ardra thiruvathirai திருவாதிரை",
  "punarvasu punarpoosam புனர்பூசம்", "pushya poosam பூசம்", "ashlesha ayilyam ஆயில்யம்",
  "magha magam மகம்", "purvaphalguni pooram பூரம்", "uttaraphalguni uthiram உத்திரம்",
  "hasta hastham அஸ்தம் ஹஸ்தம்", "chitra chithirai சித்திரை", "swati swathi சுவாதி",
  "vishakha visagam விசாகம்", "anuradha anusham அனுஷம்", "jyeshtha kettai கேட்டை",
  "mula moola moolam மூலம்", "purvaashadha pooradam பூராடம்", "uttaraashadha uthiradam உத்திராடம்",
  "shravana thiruvonam திருவோணம்", "dhanishtha avittam அவிட்டம்",
  "shatabhisha sathayam சதயம்", "purvabhadrapada poorattathi பூரட்டாதி",
  "uttarabhadrapada uthirattathi உத்திரட்டாதி", "revati revathi ரேவதி",
].map((names) => names.split(" "));

// Tamil Vedha rule: twelve opposing pairs and three mutually opposing stars.
// https://jathagaporutham.com/poruthams/vedha-porutham
const vedhaGroups = [
  [1, 18], [2, 17], [3, 16], [4, 15], [6, 22], [7, 21],
  [8, 20], [9, 19], [10, 27], [11, 26], [12, 25], [13, 24], [5, 14, 23],
];

function nakshatraNumber(value: string | undefined) {
  const name = value?.normalize("NFC").toLowerCase().replace(/[\s-]+/g, "");
  return nakshatras.findIndex((aliases) => name && aliases.includes(name)) + 1;
}

function tamilVedha(first: string | undefined, second: string | undefined) {
  const a = nakshatraNumber(first);
  const b = nakshatraNumber(second);
  const label = "Vedha Porutham / வேதை பொருத்தம்";
  if (!a || !b) return { label, status: "unavailable", explanation: "Both members must share a recognized Nakshatra." };
  const opposing = a !== b && vedhaGroups.some((group) => group.includes(a) && group.includes(b));
  return {
    label,
    status: opposing ? "opposing" : "clear",
    explanation: opposing
      ? "The recorded birth stars form an opposing pair under the Tamil Vedha rule."
      : "The recorded birth stars do not form an opposing pair under the Tamil Vedha rule.",
  };
}

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
    version: "shared-fields-v2",
    vedha: a.tradition === "tamil" && b.tradition === "tamil"
      ? tamilVedha(a.fields.nakshatra, b.fields.nakshatra)
      : null,
    tradition: a.tradition === b.tradition ? a.tradition : "different",
    traditionalResult: {
      status: "unavailable",
      score: null,
      reason:
        a.tradition !== b.tradition
          ? "Different traditions: scoring methods cannot be combined."
          : "An overall traditional score is unavailable.",
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
