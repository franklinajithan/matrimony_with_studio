import type { BiodataLanguage } from "./types";

export type LabelKey =
  | "name"
  | "age"
  | "height"
  | "education"
  | "profession"
  | "location"
  | "country"
  | "languages"
  | "family"
  | "partnerPreferences"
  | "interests"
  | "hobbies"
  | "introduction"
  | "contact"
  | "personal"
  | "educationCareer"
  | "cultural"
  | "horoscope"
  | "customNotes"
  | "dob"
  | "phone"
  | "email"
  | "address"
  | "religion"
  | "sunSign"
  | "moonSign"
  | "nakshatra"
  | "horoscopeInfo"
  | "samplePreviewTitle"
  | "untitled"
  | "biodata";

const SECTION_IDS: Record<string, LabelKey> = {
  personal: "personal",
  "education-career": "educationCareer",
  location: "location",
  languages: "languages",
  interests: "interests",
  family: "family",
  "partner-preferences": "partnerPreferences",
  cultural: "cultural",
  horoscope: "horoscope",
  contact: "contact",
  introduction: "introduction",
};

export const LABELS: Record<BiodataLanguage, Record<LabelKey, string>> = {
  en: {
    name: "Name",
    age: "Age",
    height: "Height",
    education: "Education",
    profession: "Profession",
    location: "Location",
    country: "Country",
    languages: "Languages",
    family: "Family",
    partnerPreferences: "Partner preferences",
    interests: "Interests",
    hobbies: "Hobbies",
    introduction: "Introduction",
    contact: "Contact",
    personal: "Personal details",
    educationCareer: "Education & career",
    cultural: "Cultural & faith",
    horoscope: "Horoscope",
    customNotes: "Notes",
    dob: "Date of birth",
    phone: "Phone",
    email: "Email",
    address: "Address",
    religion: "Religion",
    sunSign: "Sun sign",
    moonSign: "Moon sign",
    nakshatra: "Nakshatra",
    horoscopeInfo: "Horoscope details",
    samplePreviewTitle: "Sample preview — not a real member",
    untitled: "Untitled biodata",
    biodata: "Biodata",
  },
  ta: {
    name: "பெயர்",
    age: "வயது",
    height: "உயரம்",
    education: "கல்வி",
    profession: "தொழில்",
    location: "இடம்",
    country: "நாடு",
    languages: "மொழிகள்",
    family: "குடும்பம்",
    partnerPreferences: "துணை விருப்பங்கள்",
    interests: "ஆர்வங்கள்",
    hobbies: "பொழுதுபோக்குகள்",
    introduction: "அறிமுகம்",
    contact: "தொடர்பு",
    personal: "தனிப்பட்ட விவரங்கள்",
    educationCareer: "கல்வி மற்றும் தொழில்",
    cultural: "பண்பாடு மற்றும் நம்பிக்கை",
    horoscope: "ஜாதகம்",
    customNotes: "குறிப்புகள்",
    dob: "பிறந்த தேதி",
    phone: "தொலைபேசி",
    email: "மின்னஞ்சல்",
    address: "முகவரி",
    religion: "மதம்",
    sunSign: "சூரிய ராசி",
    moonSign: "சந்திர ராசி",
    nakshatra: "நட்சத்திரம்",
    horoscopeInfo: "ஜாதக விவரங்கள்",
    samplePreviewTitle: "மாதிரி முன்னோட்டம் — உண்மையான உறுப்பினர் அல்ல",
    untitled: "பெயரிடப்படாத பயோடேட்டா",
    biodata: "பயோடேட்டா",
  },
  si: {
    name: "නම",
    age: "වයස",
    height: "උස",
    education: "අධ්‍යාපනය",
    profession: "රැකියාව",
    location: "ස්ථානය",
    country: "රට",
    languages: "භාෂා",
    family: "පවුල",
    partnerPreferences: "සහකරු අභිමතයන්",
    interests: "උනන්දුවන්",
    hobbies: "විනෝදාංශ",
    introduction: "හැඳින්වීම",
    contact: "සම්බන්ධතා",
    personal: "පුද්ගලික විස්තර",
    educationCareer: "අධ්‍යාපනය සහ වෘත්තිය",
    cultural: "සංස්කෘතික සහ ආගමික",
    horoscope: "කේන්ද්‍රය",
    customNotes: "සටහන්",
    dob: "උපන් දිනය",
    phone: "දුරකථනය",
    email: "විද්‍යුත් තැපෑල",
    address: "ලිපිනය",
    religion: "ආගම",
    sunSign: "සූර්ය ලග්නය",
    moonSign: "චන්ද්‍ර ලග්නය",
    nakshatra: "නැකත",
    horoscopeInfo: "කේන්ද්‍ර විස්තර",
    samplePreviewTitle: "නියැදි පෙරදසුන — සැබෑ සාමාජිකයෙකු නොවේ",
    untitled: "නම් නොකළ ජීව දත්ත",
    biodata: "ජීව දත්ත",
  },
};

/** Resolve a UI/field label. Only labels are translated — not full document text. */
export function t(lang: BiodataLanguage, key: LabelKey): string {
  return LABELS[lang]?.[key] ?? LABELS.en[key] ?? key;
}

export function sectionTitle(lang: BiodataLanguage, id: string): string {
  const key = SECTION_IDS[id];
  if (key) return t(lang, key);
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
