export type BiodataLanguage = "en" | "ta" | "si";

export type BiodataField = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
};

export type BiodataSection = {
  id: string;
  title: string;
  visible: boolean;
  fields: BiodataField[];
  custom?: boolean;
};

export type BiodataPhotoCrop = {
  x: number;
  y: number;
  zoom: number;
  width?: number;
  height?: number;
};

export type BiodataContent = {
  introduction: string;
  sections: BiodataSection[];
  photoUrl?: string;
  photoCrop?: BiodataPhotoCrop;
  customNotes?: string;
};

export type BiodataPalette = {
  bg: string;
  ink: string;
  accent: string;
  muted: string;
  border: string;
};

export type BiodataFontPairing = {
  heading: string;
  body: string;
};

export type BiodataDesign = {
  templateId: string;
  templateVersion: number;
  palette: Partial<BiodataPalette>;
  fontPairing: BiodataFontPairing;
  fontSize: number;
  spacing: number;
  borderIntensity: number;
  artworkIntensity: number;
  showReligiousArt: boolean;
  photoPosition: "left" | "right" | "top" | "none";
  photoShape: "circle" | "rounded" | "square";
  pageSize: "a4" | "letter";
  showBranding: boolean;
  bilingualLabels: boolean;
  accentColor?: string;
};

export type BiodataVisibility = {
  includePhoto: boolean;
  includeDob: boolean;
  includePhone: boolean;
  includeEmail: boolean;
  includeExactAddress: boolean;
  includeFamilyContacts: boolean;
  includeReligious: boolean;
  includeHoroscope: boolean;
};

export type BiodataDocument = {
  id: string;
  ownerId: string;
  title: string;
  templateId: string;
  templateVersion: number;
  language: BiodataLanguage;
  content: BiodataContent;
  design: BiodataDesign;
  visibility: BiodataVisibility;
  sectionOrder: string[];
  documentVersion: number;
  isFavourite: boolean;
  lastExportedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TemplateCategory =
  | "religious-cultural"
  | "seasonal"
  | "modern"
  | "minimal"
  | "photo";

export type BiodataLayout =
  | "classic-two-col"
  | "portrait-hero"
  | "editorial"
  | "centered-formal"
  | "asymmetric"
  | "coastal"
  | "garden"
  | "geometric"
  | "heritage"
  | "serene";

export type ReligiousMotif =
  | "ganesha"
  | "lotus"
  | "bodhi"
  | "cross"
  | "crescent"
  | "none";

export type BiodataTemplateDef = {
  id: string;
  version: number;
  name: string;
  description: string;
  categories: TemplateCategory[];
  defaultDesign: Partial<BiodataDesign>;
  layout: BiodataLayout;
  decoration: string;
  defaultPalette: BiodataPalette;
  fonts: BiodataFontPairing;
  supportsReligiousArt: boolean;
  religiousMotif?: ReligiousMotif;
};

export type BiodataShareLink = {
  id: string;
  documentId: string;
  ownerId: string;
  token: string;
  snapshot: Record<string, unknown>;
  expiresAt: string | null;
  revokedAt: string | null;
  recipientLabel: string | null;
  watermark: string | null;
  createdAt: string;
};

export type DocumentConflictError = {
  code: "version_conflict";
  message: string;
  currentVersion?: number;
};
