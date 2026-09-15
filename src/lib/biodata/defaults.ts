import { t } from "./labels";
import { getTemplate, TEMPLATE_VERSION } from "./templates";
import type {
  BiodataContent,
  BiodataDesign,
  BiodataLanguage,
  BiodataPalette,
  BiodataVisibility,
} from "./types";

export const DEFAULT_TEMPLATE_ID = "classic-formal";

export const DEFAULT_VISIBILITY: BiodataVisibility = {
  includePhoto: false,
  includeDob: false,
  includePhone: false,
  includeEmail: false,
  includeExactAddress: false,
  includeFamilyContacts: false,
  includeReligious: false,
  includeHoroscope: false,
};

export function createEmptyContent(): BiodataContent {
  return {
    introduction: "",
    sections: [],
  };
}

/** Design defaults for a template, merging template palette/fonts with overrides. */
export function defaultDesignForTemplate(templateId: string): BiodataDesign {
  const template = getTemplate(templateId) ?? getTemplate(DEFAULT_TEMPLATE_ID)!;
  const fromTemplate = template.defaultDesign ?? {};

  return {
    templateId: template.id,
    templateVersion: template.version ?? TEMPLATE_VERSION,
    palette: {
      ...template.defaultPalette,
      ...(fromTemplate.palette ?? {}),
    },
    fontPairing: fromTemplate.fontPairing
      ? { ...fromTemplate.fontPairing }
      : { ...template.fonts },
    fontSize: fromTemplate.fontSize ?? 1,
    spacing: fromTemplate.spacing ?? 1,
    borderIntensity: fromTemplate.borderIntensity ?? 0.5,
    artworkIntensity: fromTemplate.artworkIntensity ?? 0.5,
    showReligiousArt: fromTemplate.showReligiousArt ?? false,
    photoPosition: fromTemplate.photoPosition ?? "right",
    photoShape: fromTemplate.photoShape ?? "rounded",
    pageSize: fromTemplate.pageSize ?? "a4",
    showBranding: fromTemplate.showBranding ?? true,
    bilingualLabels: fromTemplate.bilingualLabels ?? false,
    ...(fromTemplate.accentColor ? { accentColor: fromTemplate.accentColor } : {}),
  };
}

export function mergeDesign(
  base: BiodataDesign,
  patch: Partial<BiodataDesign>
): BiodataDesign {
  const palette: Partial<BiodataPalette> = {
    ...base.palette,
    ...(patch.palette ?? {}),
  };
  return {
    ...base,
    ...patch,
    palette,
    fontPairing: patch.fontPairing
      ? { ...base.fontPairing, ...patch.fontPairing }
      : base.fontPairing,
  };
}

export function createEmptyDocumentInput(options?: {
  ownerId?: string;
  title?: string;
  templateId?: string;
  language?: BiodataLanguage;
  content?: BiodataContent;
  visibility?: BiodataVisibility;
  sectionOrder?: string[];
}) {
  const templateId = options?.templateId ?? DEFAULT_TEMPLATE_ID;
  const language = options?.language ?? "en";
  const content = options?.content ?? createEmptyContent();
  const design = defaultDesignForTemplate(templateId);

  return {
    ownerId: options?.ownerId ?? "",
    title: options?.title ?? t(language, "untitled"),
    templateId,
    content,
    design,
    visibility: options?.visibility ?? { ...DEFAULT_VISIBILITY },
    sectionOrder: options?.sectionOrder ?? content.sections.map((s) => s.id),
    language,
  };
}

/** Switch template while preserving content-facing design choices where possible. */
export function applyTemplateToDesign(
  current: BiodataDesign,
  templateId: string
): BiodataDesign {
  const next = defaultDesignForTemplate(templateId);
  return mergeDesign(next, {
    pageSize: current.pageSize,
    showBranding: current.showBranding,
    bilingualLabels: current.bilingualLabels,
    fontSize: current.fontSize,
    photoPosition: current.photoPosition === "none" ? "none" : next.photoPosition,
    showReligiousArt:
      current.showReligiousArt &&
      Boolean(getTemplate(templateId)?.supportsReligiousArt),
  });
}

/** Alias used by Studio editor when switching templates without losing content. */
export const switchTemplateDesign = applyTemplateToDesign;
