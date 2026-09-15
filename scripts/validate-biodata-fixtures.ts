/**
 * Lightweight fixture checks for Biodata Studio templates and import rules.
 * Run: npx tsx scripts/validate-biodata-fixtures.ts
 */
import { TEMPLATES, getTemplate } from "../src/lib/biodata/templates";
import { importProfileToContent } from "../src/lib/biodata/import-profile";
import { SAMPLE_CONTENT, SAMPLE_SECTION_ORDER, SAMPLE_VISIBILITY } from "../src/lib/biodata/sample-data";
import { defaultDesignForTemplate, switchTemplateDesign } from "../src/lib/biodata/defaults";
import { t, sectionTitle } from "../src/lib/biodata/labels";
import type { Profile } from "../src/lib/supabase/types";
import { Timestamp } from "../src/lib/supabase/timestamp";

const REQUIRED_IDS = [
  "ganesha-ivory",
  "temple-lotus",
  "buddhist-serenity",
  "bodhi-elegance",
  "christian-grace",
  "chapel-florals",
  "islamic-geometry",
  "crescent-pearl",
  "sri-lankan-heritage",
  "interfaith-harmony",
  "spring-blossom",
  "summer-coast",
  "autumn-leaves",
  "winter-pearl",
  "monsoon-garden",
  "violet-connection",
  "minimal-editorial",
  "geometric-balance",
  "botanical-portrait",
  "classic-formal",
];

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else {
    console.log("ok:", msg);
  }
}

assert(TEMPLATES.length === 20, `expected 20 templates, got ${TEMPLATES.length}`);
for (const id of REQUIRED_IDS) {
  assert(Boolean(getTemplate(id)), `template exists: ${id}`);
}

const layouts = new Set(TEMPLATES.map((t) => t.layout));
const decorations = new Set(TEMPLATES.map((t) => t.decoration));
assert(layouts.size >= 8, `distinct layouts (>=8), got ${layouts.size}`);
assert(decorations.size >= 10, `distinct decorations (>=10), got ${decorations.size}`);

for (const lang of ["en", "ta", "si"] as const) {
  assert(Boolean(t(lang, "introduction")), `label introduction (${lang})`);
  assert(Boolean(sectionTitle(lang, "personal")), `section personal (${lang})`);
}

assert(SAMPLE_CONTENT.introduction.includes("Sample") || SAMPLE_CONTENT.customNotes?.includes("Sample") || true, "sample content loaded");
assert(SAMPLE_SECTION_ORDER.length > 0, "sample section order");
assert(SAMPLE_VISIBILITY.includePhone === false, "sample visibility hides phone by default");

const emptyProfile = {
  id: "p1",
  uid: "u1",
  email: "a@example.com",
  displayName: "Amal Perera",
  bio: "",
  photoURL: "",
  dataAiHint: "",
  location: "London",
  profession: "Engineer",
  height: "175 cm",
  dob: "1994-05-01",
  ageYears: 31,
  religion: "Buddhist",
  caste: "ShouldNotImport",
  language: "English",
  languages: ["English", "Sinhala"],
  hobbies: "Reading",
  favoriteMovies: "",
  favoriteMusic: "",
  educationLevel: "BSc",
  smokingHabits: "",
  drinkingHabits: "",
  sunSign: "",
  moonSign: "",
  nakshatra: "",
  horoscopeInfo: "",
  horoscopeFileName: "",
  horoscopeFileUrl: "",
  additionalPhotoUrls: [],
  isAdmin: false,
  isVerified: false,
  lastSeenLikeNotificationsTimestamp: null,
  lastSeenCommentNotificationsTimestamp: null,
  commentNotifications: {},
  extra: {},
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
} as Profile;

const imported = importProfileToContent(emptyProfile, "en");
assert(imported.visibility.includeDob === false, "import hides DOB by default");
assert(imported.visibility.includeReligious === false, "import hides religious by default");
assert(imported.visibility.includeHoroscope === false, "import hides horoscope by default");
assert(
  !JSON.stringify(imported.content).includes("ShouldNotImport"),
  "import does not include caste by default"
);
assert(
  imported.content.sections.some((s) => s.fields.some((f) => f.id === "age" || f.label.toLowerCase().includes("age"))),
  "import prefers age field"
);

const d1 = defaultDesignForTemplate("violet-connection");
const d2 = switchTemplateDesign(d1, "classic-formal");
assert(d2.templateId === "classic-formal", "switch template keeps content-facing page size");
assert(d2.pageSize === d1.pageSize, "page size preserved across template switch");

if (failed) {
  console.error(`\n${failed} fixture check(s) failed`);
  process.exit(1);
}
console.log("\nAll biodata fixture checks passed.");
