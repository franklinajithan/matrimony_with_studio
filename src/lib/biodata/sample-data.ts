import type { BiodataContent, BiodataLanguage, BiodataVisibility } from "./types";
import { sectionTitle, t } from "./labels";

/** Fictional gallery fixture — not a real CupidMatch member. */
export const SAMPLE_PREVIEW_NOTICE = "Sample preview — not a real member";

export function createSampleContent(lang: BiodataLanguage = "en"): BiodataContent {
  const field = (id: string, labelKey: Parameters<typeof t>[1], value: string) => ({
    id,
    label: t(lang, labelKey),
    value,
    visible: true,
  });

  return {
    introduction:
      "I grew up between Colombo and London, and value kindness, humour, and family who show up for one another. I am looking for a thoughtful partnership built on respect and shared adventure.",
    photoUrl: "https://placehold.co/600x800/EAE4EF/7027E8?text=Sample",
    customNotes: SAMPLE_PREVIEW_NOTICE,
    sections: [
      {
        id: "personal",
        title: sectionTitle(lang, "personal"),
        visible: true,
        fields: [
          field("name", "name", "Anjali Perera"),
          field("age", "age", "29"),
          field("height", "height", "5'5\" (165 cm)"),
        ],
      },
      {
        id: "education-career",
        title: sectionTitle(lang, "education-career"),
        visible: true,
        fields: [
          field("education", "education", "MSc Data Science"),
          field("profession", "profession", "Product analyst"),
        ],
      },
      {
        id: "location",
        title: sectionTitle(lang, "location"),
        visible: true,
        fields: [
          field("location", "location", "Croydon, United Kingdom"),
          field("country", "country", "United Kingdom"),
        ],
      },
      {
        id: "languages",
        title: sectionTitle(lang, "languages"),
        visible: true,
        fields: [field("languages", "languages", "English, Sinhala, Tamil")],
      },
      {
        id: "interests",
        title: sectionTitle(lang, "interests"),
        visible: true,
        fields: [
          field(
            "hobbies",
            "hobbies",
            "Weekend cricket, South Indian cooking, hiking, indie films"
          ),
        ],
      },
      {
        id: "family",
        title: sectionTitle(lang, "family"),
        visible: true,
        fields: [
          {
            id: "family-summary",
            label: t(lang, "family"),
            value: "Parents in Colombo; younger brother studying in Melbourne.",
            visible: true,
          },
        ],
      },
      {
        id: "partner-preferences",
        title: sectionTitle(lang, "partner-preferences"),
        visible: true,
        fields: [
          {
            id: "partner-summary",
            label: t(lang, "partnerPreferences"),
            value: "Someone warm, grounded, and open to life across Sri Lanka and the UK.",
            visible: true,
          },
        ],
      },
    ],
  };
}

export const SAMPLE_CONTENT: BiodataContent = createSampleContent("en");

export const SAMPLE_SECTION_ORDER: string[] = SAMPLE_CONTENT.sections.map((s) => s.id);

export const SAMPLE_VISIBILITY: BiodataVisibility = {
  includePhoto: true,
  includeDob: false,
  includePhone: false,
  includeEmail: false,
  includeExactAddress: false,
  includeFamilyContacts: false,
  includeReligious: false,
  includeHoroscope: false,
};

/** Alternate fictional sample for gallery variety. */
export const SAMPLE_CONTENT_ALT: BiodataContent = {
  introduction:
    "Raised in Jaffna and now based in Toronto, I enjoy mentoring students, temple festivals with family, and quiet evenings with a good novel.",
  photoUrl: "https://placehold.co/600x800/FBF8F4/17151D?text=Sample",
  customNotes: SAMPLE_PREVIEW_NOTICE,
  sections: [
    {
      id: "personal",
      title: "Personal details",
      visible: true,
      fields: [
        { id: "name", label: "Name", value: "Nimal Fernando", visible: true },
        { id: "age", label: "Age", value: "32", visible: true },
        { id: "height", label: "Height", value: "5'10\" (178 cm)", visible: true },
      ],
    },
    {
      id: "education-career",
      title: "Education & career",
      visible: true,
      fields: [
        { id: "education", label: "Education", value: "BEng Civil Engineering", visible: true },
        { id: "profession", label: "Profession", value: "Structural engineer", visible: true },
      ],
    },
    {
      id: "location",
      title: "Location",
      visible: true,
      fields: [
        { id: "location", label: "Location", value: "Scarborough, Canada", visible: true },
        { id: "country", label: "Country", value: "Canada", visible: true },
      ],
    },
    {
      id: "languages",
      title: "Languages",
      visible: true,
      fields: [
        { id: "languages", label: "Languages", value: "English, Tamil", visible: true },
      ],
    },
    {
      id: "interests",
      title: "Interests",
      visible: true,
      fields: [
        {
          id: "hobbies",
          label: "Hobbies",
          value: "Photography, cricket, volunteering, travel",
          visible: true,
        },
      ],
    },
  ],
};
