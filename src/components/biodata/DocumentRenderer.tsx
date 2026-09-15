"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type {
  BiodataContent,
  BiodataDesign,
  BiodataField,
  BiodataPalette,
  BiodataSection,
  BiodataVisibility,
} from "@/lib/biodata/types";
import { getTemplate } from "@/lib/biodata/templates";
import { DocumentFrame } from "@/components/biodata/DocumentFrame";

export type DocumentRendererProps = {
  content: BiodataContent;
  design: BiodataDesign;
  visibility: BiodataVisibility;
  sectionOrder: string[];
  templateId: string;
  className?: string;
  forExport?: boolean;
  /** Optional diagonal watermark (e.g. from a share link) */
  watermark?: string;
};

const SENSITIVE_FIELD_IDS: Record<
  keyof Pick<
    BiodataVisibility,
    | "includeDob"
    | "includePhone"
    | "includeEmail"
    | "includeExactAddress"
    | "includeFamilyContacts"
    | "includeReligious"
    | "includeHoroscope"
  >,
  string[]
> = {
  includeDob: ["dob", "dateOfBirth", "date_of_birth", "birthDate", "birth_date"],
  includePhone: [
    "phone",
    "mobile",
    "contactPhone",
    "contact_phone",
    "phoneNumber",
    "phone_number",
  ],
  includeEmail: ["email", "contactEmail", "contact_email"],
  includeExactAddress: [
    "address",
    "exactAddress",
    "exact_address",
    "fullAddress",
    "full_address",
    "streetAddress",
  ],
  includeFamilyContacts: [
    "fatherPhone",
    "motherPhone",
    "contactNumberFather",
    "contactNumberMother",
    "familyPhone",
    "familyContact",
    "family_contact",
    "guardianPhone",
  ],
  includeReligious: [
    "religion",
    "religious",
    "denomination",
    "faith",
    "caste",
    "subcaste",
  ],
  includeHoroscope: [
    "horoscope",
    "horoscopeInfo",
    "rashi",
    "nakshatra",
    "sunSign",
    "moonSign",
    "ascendant",
    "gotra",
  ],
};

const SENSITIVE_SECTION_IDS: Partial<
  Record<keyof BiodataVisibility, string[]>
> = {
  includeReligious: ["religious", "religion", "cultural", "faith"],
  includeHoroscope: ["horoscope", "astrology", "kundli", "rasi"],
  includeFamilyContacts: ["family-contacts", "family_contacts", "contacts"],
};

function fieldMatches(ids: string[], fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  return ids.some((x) => id === x.toLowerCase() || id.includes(x.toLowerCase()));
}

function isFieldAllowed(
  field: BiodataField,
  visibility: BiodataVisibility
): boolean {
  if (!field.visible || !String(field.value ?? "").trim()) return false;

  const checks: Array<[keyof typeof SENSITIVE_FIELD_IDS, boolean]> = [
    ["includeDob", visibility.includeDob],
    ["includePhone", visibility.includePhone],
    ["includeEmail", visibility.includeEmail],
    ["includeExactAddress", visibility.includeExactAddress],
    ["includeFamilyContacts", visibility.includeFamilyContacts],
    ["includeReligious", visibility.includeReligious],
    ["includeHoroscope", visibility.includeHoroscope],
  ];

  for (const [key, allowed] of checks) {
    if (!allowed && fieldMatches(SENSITIVE_FIELD_IDS[key], field.id)) {
      return false;
    }
  }
  return true;
}

function isSectionAllowed(
  section: BiodataSection,
  visibility: BiodataVisibility
): boolean {
  if (!section.visible) return false;

  for (const [key, ids] of Object.entries(SENSITIVE_SECTION_IDS) as Array<
    [keyof BiodataVisibility, string[]]
  >) {
    if (!visibility[key] && ids.some((id) => section.id.toLowerCase() === id)) {
      return false;
    }
  }
  return true;
}

function mergePalette(
  base: BiodataPalette,
  overrides?: Partial<BiodataPalette> | null
): BiodataPalette {
  return { ...base, ...(overrides ?? {}) };
}

/** fontSize is a scale multiplier (1 = 13px base). */
function resolveFontSize(fontSize: number): string {
  const scale = Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 1;
  return `${13 * scale}px`;
}

/** spacing is a scale multiplier for field row gaps. */
function resolveSpacing(spacing: number): string {
  const scale = Number.isFinite(spacing) && spacing > 0 ? spacing : 1;
  return `${0.55 * scale}rem`;
}

function photoShapeClass(shape: BiodataDesign["photoShape"]): string {
  switch (shape) {
    case "circle":
      return "rounded-full";
    case "rounded":
      return "rounded-xl";
    default:
      return "rounded-sm";
  }
}

function orderSections(
  sections: BiodataSection[],
  sectionOrder: string[]
): BiodataSection[] {
  const map = new Map(sections.map((s) => [s.id, s]));
  const ordered: BiodataSection[] = [];
  for (const id of sectionOrder) {
    const s = map.get(id);
    if (s) {
      ordered.push(s);
      map.delete(id);
    }
  }
  for (const s of map.values()) ordered.push(s);
  return ordered;
}

function prepareSections(
  content: BiodataContent,
  visibility: BiodataVisibility,
  sectionOrder: string[]
): BiodataSection[] {
  return orderSections(content.sections, sectionOrder)
    .filter((s) => isSectionAllowed(s, visibility))
    .map((s) => ({
      ...s,
      fields: s.fields.filter((f) => isFieldAllowed(f, visibility)),
    }))
    .filter((s) => s.fields.length > 0 || s.id === "introduction");
}

/** Heuristic page split by approximate field weight */
function paginateSections(
  sections: BiodataSection[],
  fieldsPerPage = 14
): BiodataSection[][] {
  if (sections.length === 0) return [[]];
  const pages: BiodataSection[][] = [];
  let current: BiodataSection[] = [];
  let weight = 0;

  for (const section of sections) {
    const w = Math.max(2, section.fields.length + 1);
    if (current.length > 0 && weight + w > fieldsPerPage) {
      pages.push(current);
      current = [];
      weight = 0;
    }
    current.push(section);
    weight += w;
  }
  if (current.length) pages.push(current);
  return pages.length ? pages : [[]];
}

function FieldRow({
  field,
  muted,
  ink,
}: {
  field: BiodataField;
  muted: string;
  ink: string;
}) {
  return (
    <div className="grid grid-cols-[38%_1fr] gap-x-2 break-inside-avoid text-[0.95em] leading-snug">
      <dt style={{ color: muted }} className="font-medium">
        {field.label}
      </dt>
      <dd style={{ color: ink }} className="select-text font-normal">
        {field.value}
      </dd>
    </div>
  );
}

function SectionBlock({
  section,
  accent,
  muted,
  ink,
  gap,
}: {
  section: BiodataSection;
  accent: string;
  muted: string;
  ink: string;
  gap: string;
}) {
  return (
    <section className="break-inside-avoid" data-biodata-section={section.id}>
      <h3
        className="mb-2 border-b pb-1 text-[1.05em] font-semibold tracking-wide"
        style={{ color: accent, borderColor: accent }}
      >
        {section.title}
      </h3>
      <dl className="flex flex-col" style={{ gap }}>
        {section.fields.map((field) => (
          <FieldRow key={field.id} field={field} muted={muted} ink={ink} />
        ))}
      </dl>
    </section>
  );
}

function PhotoBlock({
  url,
  shape,
  accent,
  border,
  sizeClass = "h-36 w-36",
}: {
  url: string;
  shape: BiodataDesign["photoShape"];
  accent: string;
  border: string;
  sizeClass?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden border-2 bg-white shadow-sm", photoShapeClass(shape), sizeClass)}
      style={{ borderColor: accent || border }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover select-none"
        draggable={false}
      />
    </div>
  );
}

function pageSizeCss(pageSize: BiodataDesign["pageSize"]): React.CSSProperties {
  if (pageSize === "letter") {
    return { width: "8.5in", minHeight: "11in" };
  }
  return { width: "210mm", minHeight: "297mm" };
}

function LayoutBody({
  layout,
  sections,
  introduction,
  showPhoto,
  photoUrl,
  design,
  palette,
  gap,
}: {
  layout: string;
  sections: BiodataSection[];
  introduction?: string;
  showPhoto: boolean;
  photoUrl?: string;
  design: BiodataDesign;
  palette: BiodataPalette;
  gap: string;
}) {
  const { accent, muted, ink, border } = palette;
  const photo =
    showPhoto && photoUrl ? (
      <PhotoBlock
        url={photoUrl}
        shape={design.photoShape}
        accent={design.accentColor ?? accent}
        border={border}
        sizeClass={
          layout === "portrait-hero" ? "h-48 w-48 md:h-56 md:w-56" : "h-36 w-36"
        }
      />
    ) : null;

  const sectionNodes = sections.map((s) => (
    <SectionBlock
      key={s.id}
      section={s}
      accent={design.accentColor ?? accent}
      muted={muted}
      ink={ink}
      gap={gap}
    />
  ));

  const intro = introduction?.trim() ? (
    <p className="select-text text-[0.98em] leading-relaxed" style={{ color: ink }}>
      {introduction}
    </p>
  ) : null;

  switch (layout) {
    case "portrait-hero":
      return (
        <div className="flex flex-col items-center gap-5 text-center">
          {photo}
          {intro}
          <div className="w-full space-y-5 text-left">{sectionNodes}</div>
        </div>
      );

    case "centered-formal":
      return (
        <div className="mx-auto flex max-w-[34rem] flex-col items-center gap-5">
          {photo}
          {intro && <div className="text-center">{intro}</div>}
          <div className="w-full space-y-5">{sectionNodes}</div>
        </div>
      );

    case "editorial":
      return (
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          <aside className="flex flex-col items-start gap-4">
            {photo}
            {intro}
          </aside>
          <div className="space-y-5">{sectionNodes}</div>
        </div>
      );

    case "asymmetric":
      return (
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-5">
            {intro}
            {sectionNodes.slice(0, Math.ceil(sectionNodes.length / 2))}
          </div>
          <div className="flex flex-col items-end gap-5">
            {photo}
            <div className="w-full space-y-5">
              {sectionNodes.slice(Math.ceil(sectionNodes.length / 2))}
            </div>
          </div>
        </div>
      );

    case "coastal":
    case "garden":
    case "serene":
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">{intro}</div>
            {photo}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">{sectionNodes}</div>
        </div>
      );

    case "geometric":
      return (
        <div className="space-y-5">
          <div
            className="grid gap-4 border p-3"
            style={{ borderColor: border }}
          >
            <div className="flex items-start justify-between gap-4">
              {intro}
              {photo}
            </div>
          </div>
          <div className="space-y-5">{sectionNodes}</div>
        </div>
      );

    case "heritage":
      return (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            {photo}
            {intro}
          </div>
          <div className="space-y-5">{sectionNodes}</div>
        </div>
      );

    case "classic-two-col":
    default: {
      const pos = design.photoPosition;
      const photoLeft = pos === "left";
      const photoTop = pos === "top";
      if (photoTop) {
        return (
          <div className="space-y-5">
            <div className="flex justify-center">{photo}</div>
            {intro}
            <div className="space-y-5">{sectionNodes}</div>
          </div>
        );
      }
      return (
        <div
          className={cn(
            "grid gap-6",
            photo ? "md:grid-cols-[1fr_auto]" : "grid-cols-1",
            photoLeft && photo && "md:grid-cols-[auto_1fr]"
          )}
        >
          {photoLeft && photo}
          <div className="min-w-0 space-y-5">
            {intro}
            {sectionNodes}
          </div>
          {!photoLeft && photo}
        </div>
      );
    }
  }
}

export function DocumentRenderer({
  content,
  design,
  visibility,
  sectionOrder,
  templateId,
  className,
  forExport = false,
  watermark: watermarkProp,
}: DocumentRendererProps) {
  const template = getTemplate(templateId) ?? getTemplate(design.templateId);
  if (!template) {
    return (
      <div className={cn("p-4 text-sm text-muted-foreground", className)}>
        Template not found.
      </div>
    );
  }

  const palette = mergePalette(template.defaultPalette, design.palette);
  if (design.accentColor) {
    palette.accent = design.accentColor;
  }

  const fontSize = resolveFontSize(design.fontSize);
  const gap = resolveSpacing(design.spacing);
  const headingFont = design.fontPairing?.heading || template.fonts.heading;
  const bodyFont = design.fontPairing?.body || template.fonts.body;

  const intensity = Math.max(
    design.borderIntensity ?? 0.5,
    design.artworkIntensity ?? 0.5
  );

  const showPhoto =
    visibility.includePhoto &&
    design.photoPosition !== "none" &&
    Boolean(content.photoUrl);

  const prepared = prepareSections(content, visibility, sectionOrder);
  const pages = paginateSections(prepared, forExport ? 16 : 14);

  const watermark =
    watermarkProp?.trim() ||
    undefined;

  return (
    <div
      className={cn("biodata-document flex flex-col gap-6", className)}
      data-biodata-root
      data-page-size={design.pageSize}
      style={
        {
          ["--biodata-bg" as string]: palette.bg,
          ["--biodata-ink" as string]: palette.ink,
          ["--biodata-accent" as string]: palette.accent,
          fontSize,
          fontFamily: bodyFont,
          color: palette.ink,
        } as React.CSSProperties
      }
    >
      {pages.map((pageSections, pageIndex) => (
        <div
          key={pageIndex}
          data-biodata-page={pageIndex + 1}
          className={cn(
            "biodata-page relative mx-auto overflow-hidden shadow-md print:shadow-none",
            forExport && "shadow-none"
          )}
          style={{
            ...pageSizeCss(design.pageSize),
            backgroundColor: palette.bg,
            breakAfter: pageIndex < pages.length - 1 ? "page" : undefined,
            pageBreakAfter: pageIndex < pages.length - 1 ? "always" : undefined,
          }}
        >
          <DocumentFrame
            template={template}
            intensity={intensity}
            showReligiousArt={design.showReligiousArt}
            accentColor={palette.accent}
            borderColor={palette.border}
            className="min-h-full"
          >
            {pageIndex === 0 && (
              <header className="mb-5 text-center">
                <h1
                  className="text-[1.65em] font-semibold tracking-[0.12em]"
                  style={{ fontFamily: headingFont, color: palette.accent }}
                >
                  BIODATA
                </h1>
              </header>
            )}

            <LayoutBody
              layout={template.layout}
              sections={pageSections}
              introduction={pageIndex === 0 ? content.introduction : undefined}
              showPhoto={pageIndex === 0 && showPhoto}
              photoUrl={content.photoUrl}
              design={design}
              palette={palette}
              gap={gap}
            />

            {pageIndex === pages.length - 1 && content.customNotes?.trim() && (
              <p
                className="mt-6 select-text text-[0.85em] italic"
                style={{ color: palette.muted }}
              >
                {content.customNotes}
              </p>
            )}

            {watermark && (
              <div
                className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center"
                aria-hidden
              >
                <span
                  className="select-none text-4xl font-semibold uppercase tracking-widest opacity-[0.08]"
                  style={{ color: palette.ink, transform: "rotate(-28deg)" }}
                >
                  {watermark}
                </span>
              </div>
            )}

            {design.showBranding && (
              <div
                className="mt-8 flex items-center justify-end gap-1 text-[0.65em] tracking-wide"
                style={{ color: palette.muted }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "#7027E8" }}
                />
                <span>
                  Made with <span style={{ color: "#7027E8" }}>Cupid</span>
                  <span style={{ color: "#FF6F72" }}>Match</span>
                </span>
              </div>
            )}
          </DocumentFrame>
        </div>
      ))}
    </div>
  );
}
