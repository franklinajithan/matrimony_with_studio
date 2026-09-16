import type { Metadata } from "next";
import { getShareByToken } from "@/lib/supabase/biodata";
import type {
  BiodataContent,
  BiodataDesign,
  BiodataVisibility,
} from "@/lib/biodata/types";
import { defaultDesignForTemplate } from "@/lib/biodata/defaults";
import { DocumentRenderer } from "@/components/biodata/DocumentRenderer";

export const robots = { index: false, follow: false };
const SHARE_CARD_VERSION = "2";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const link = await getShareByToken(token);
  if (!link) {
    return { title: "Shared biodata unavailable", robots };
  }

  const snap = link.snapshot;
  const content = asContent(snap.content);
  const visibility = asVisibility(snap.visibility);
  const safeName = findSafeName(content);
  const title = safeName ? `${safeName}'s Biodata | CupidMatch` : "Shared Biodata | CupidMatch";
  const description = "A private biodata shared securely through CupidMatch.";
  const imageUrl = `/share/biodata/${encodeURIComponent(token)}/opengraph-image?v=${SHARE_CARD_VERSION}`;

  return {
    title,
    description,
    robots,
    openGraph: {
      type: "website",
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    other: {
      "cupidmatch:photo-visible": visibility.includePhoto ? "true" : "false",
    },
  };
}

function asContent(value: unknown): BiodataContent {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as BiodataContent;
    if (Array.isArray(v.sections)) return v;
  }
  return { introduction: "", sections: [] };
}

function asDesign(value: unknown, templateId: string): BiodataDesign {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as BiodataDesign;
  }
  return defaultDesignForTemplate(templateId);
}

function asVisibility(value: unknown): BiodataVisibility {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as BiodataVisibility;
  }
  return {
    includePhoto: false,
    includeDob: false,
    includePhone: false,
    includeEmail: false,
    includeExactAddress: false,
    includeFamilyContacts: false,
    includeReligious: false,
    includeHoroscope: false,
  };
}

function findSafeName(content: BiodataContent): string | undefined {
  const labels = new Set(["name", "full name", "பெயர்", "නම"]);
  for (const section of content.sections) {
    if (!section.visible) continue;
    for (const field of section.fields) {
      if (!field.visible) continue;
      if (labels.has(field.label.trim().toLowerCase()) && field.value.trim()) {
        return field.value.trim().slice(0, 80);
      }
    }
  }
  return undefined;
}

export default async function SharedBiodataPage({ params }: PageProps) {
  const { token } = await params;
  const link = await getShareByToken(token);

  if (!link) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Link unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This biodata share link is no longer available. It may have been revoked, expired, or
          the address may be incorrect.
        </p>
      </main>
    );
  }

  const snap = link.snapshot;
  const templateId =
    typeof snap.templateId === "string"
      ? snap.templateId
      : typeof (snap.design as { templateId?: string } | undefined)?.templateId === "string"
        ? (snap.design as { templateId: string }).templateId
        : "classic-formal";
  const content = asContent(snap.content);
  const design = asDesign(snap.design, templateId);
  const visibility = asVisibility(snap.visibility);
  const sectionOrder = Array.isArray(snap.sectionOrder)
    ? snap.sectionOrder.map(String)
    : content.sections.map((s) => s.id);
  const watermark =
    link.watermark ||
    (typeof snap.watermark === "string" ? snap.watermark : undefined);

  return (
    <main className="min-h-screen bg-[#FBF8F4] px-4 py-8">
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <p className="text-xs uppercase tracking-wide text-[#7027E8]">Shared biodata</p>
        {link.recipientLabel ? (
          <p className="mt-1 text-sm text-muted-foreground">For {link.recipientLabel}</p>
        ) : null}
      </div>
      <div className="mx-auto w-fit overflow-x-auto">
        <DocumentRenderer
          content={content}
          design={design}
          visibility={visibility}
          sectionOrder={sectionOrder}
          templateId={templateId}
          watermark={watermark}
        />
      </div>
    </main>
  );
}
