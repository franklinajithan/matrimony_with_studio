import { supabase } from "./client";
import type {
  BiodataContent,
  BiodataDesign,
  BiodataDocument,
  BiodataLanguage,
  BiodataShareLink,
  BiodataVisibility,
} from "@/lib/biodata/types";
import { defaultDesignForTemplate } from "@/lib/biodata/defaults";
import { TEMPLATE_VERSION } from "@/lib/biodata/templates";

type Row = Record<string, unknown>;

function asObject<T extends object>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

export function mapBiodataDocument(row: Row | null): BiodataDocument | null {
  if (!row) return null;
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    title: String(row.title ?? "Untitled biodata"),
    templateId: String(row.template_id),
    templateVersion: Number(row.template_version ?? TEMPLATE_VERSION),
    language: (row.language as BiodataLanguage) || "en",
    content: asObject<BiodataContent>(row.content, { introduction: "", sections: [] }),
    design: asObject<BiodataDesign>(row.design, defaultDesignForTemplate(String(row.template_id))),
    visibility: asObject<BiodataVisibility>(row.visibility, {
      includePhoto: false,
      includeDob: false,
      includePhone: false,
      includeEmail: false,
      includeExactAddress: false,
      includeFamilyContacts: false,
      includeReligious: false,
      includeHoroscope: false,
    }),
    sectionOrder: asStringArray(row.section_order),
    documentVersion: Number(row.document_version ?? 1),
    isFavourite: Boolean(row.is_favourite),
    lastExportedAt: (row.last_exported_at as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function mapShareLink(row: Row | null): BiodataShareLink | null {
  if (!row) return null;
  return {
    id: String(row.id),
    documentId: String(row.document_id),
    ownerId: String(row.owner_id),
    token: String(row.token),
    snapshot: asObject<Record<string, unknown>>(row.snapshot, {}),
    expiresAt: (row.expires_at as string | null) ?? null,
    revokedAt: (row.revoked_at as string | null) ?? null,
    recipientLabel: (row.recipient_label as string | null) ?? null,
    watermark: (row.watermark as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
  };
}

export async function listDocuments(ownerId: string): Promise<BiodataDocument[]> {
  const { data, error } = await supabase
    .from("biodata_documents")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapBiodataDocument(row as Row)!);
}

export async function getDocument(id: string): Promise<BiodataDocument | null> {
  const { data, error } = await supabase
    .from("biodata_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return mapBiodataDocument(data as Row | null);
}

export async function createDocument(input: {
  ownerId: string;
  title: string;
  templateId: string;
  content: BiodataContent;
  design: BiodataDesign;
  visibility: BiodataVisibility;
  sectionOrder: string[];
  language: BiodataLanguage;
}): Promise<BiodataDocument> {
  const templateVersion = input.design.templateVersion || TEMPLATE_VERSION;
  const { data, error } = await supabase
    .from("biodata_documents")
    .insert({
      owner_id: input.ownerId,
      title: input.title,
      template_id: input.templateId,
      template_version: templateVersion,
      language: input.language,
      content: input.content,
      design: { ...input.design, templateId: input.templateId, templateVersion },
      visibility: input.visibility,
      section_order: input.sectionOrder,
      document_version: 1,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapBiodataDocument(data as Row)!;
}

export type BiodataDocumentPatch = {
  title?: string;
  templateId?: string;
  templateVersion?: number;
  language?: BiodataLanguage;
  content?: BiodataContent;
  design?: BiodataDesign;
  visibility?: BiodataVisibility;
  sectionOrder?: string[];
  isFavourite?: boolean;
  lastExportedAt?: string | null;
  /** Expected current document_version for optimistic concurrency. */
  documentVersion: number;
};

export class BiodataVersionConflictError extends Error {
  readonly code = "version_conflict" as const;
  readonly currentVersion?: number;

  constructor(message = "Document was updated elsewhere. Reload and try again.", currentVersion?: number) {
    super(message);
    this.name = "BiodataVersionConflictError";
    this.currentVersion = currentVersion;
  }
}

/**
 * Update a document and increment document_version.
 * Pass `documentVersion` as the version the client last loaded; mismatches throw BiodataVersionConflictError.
 */
export async function updateDocument(
  id: string,
  patch: BiodataDocumentPatch
): Promise<BiodataDocument> {
  const expectedVersion = patch.documentVersion;
  const nextVersion = expectedVersion + 1;

  const row: Row = {
    document_version: nextVersion,
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) row.title = patch.title;
  if (patch.templateId !== undefined) row.template_id = patch.templateId;
  if (patch.templateVersion !== undefined) row.template_version = patch.templateVersion;
  if (patch.language !== undefined) row.language = patch.language;
  if (patch.content !== undefined) row.content = patch.content;
  if (patch.design !== undefined) row.design = patch.design;
  if (patch.visibility !== undefined) row.visibility = patch.visibility;
  if (patch.sectionOrder !== undefined) row.section_order = patch.sectionOrder;
  if (patch.isFavourite !== undefined) row.is_favourite = patch.isFavourite;
  if (patch.lastExportedAt !== undefined) row.last_exported_at = patch.lastExportedAt;

  const { data, error } = await supabase
    .from("biodata_documents")
    .update(row)
    .eq("id", id)
    .eq("document_version", expectedVersion)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const current = await getDocument(id);
    throw new BiodataVersionConflictError(
      "Document was updated elsewhere. Reload and try again.",
      current?.documentVersion
    );
  }

  return mapBiodataDocument(data as Row)!;
}

export async function duplicateDocument(id: string): Promise<BiodataDocument> {
  const source = await getDocument(id);
  if (!source) throw new Error("Document not found");

  return createDocument({
    ownerId: source.ownerId,
    title: source.title.startsWith("Copy of ") ? source.title : `Copy of ${source.title}`,
    templateId: source.templateId,
    content: structuredClone(source.content),
    design: structuredClone(source.design),
    visibility: structuredClone(source.visibility),
    sectionOrder: [...source.sectionOrder],
    language: source.language,
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from("biodata_documents").delete().eq("id", id);
  if (error) throw error;
}

export async function listFavouriteTemplates(ownerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("biodata_template_favourites")
    .select("template_id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => String((row as Row).template_id));
}

export async function setFavouriteTemplate(
  ownerId: string,
  templateId: string,
  favourite: boolean
): Promise<void> {
  if (favourite) {
    const { error } = await supabase.from("biodata_template_favourites").upsert(
      { owner_id: ownerId, template_id: templateId },
      { onConflict: "owner_id,template_id" }
    );
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("biodata_template_favourites")
    .delete()
    .eq("owner_id", ownerId)
    .eq("template_id", templateId);
  if (error) throw error;
}

function createShareToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createShareLink(input: {
  documentId: string;
  ownerId: string;
  snapshot: Record<string, unknown>;
  expiresAt?: string | null;
  recipientLabel?: string | null;
  watermark?: string | null;
}): Promise<BiodataShareLink> {
  const token = createShareToken();
  const { data, error } = await supabase
    .from("biodata_share_links")
    .insert({
      document_id: input.documentId,
      owner_id: input.ownerId,
      token,
      snapshot: input.snapshot,
      expires_at: input.expiresAt ?? null,
      recipient_label: input.recipientLabel ?? null,
      watermark: input.watermark ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapShareLink(data as Row)!;
}

export async function revokeShareLink(id: string): Promise<void> {
  const { error } = await supabase
    .from("biodata_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);
  if (error) throw error;
}

export async function getShareByToken(token: string): Promise<BiodataShareLink | null> {
  const { data, error } = await supabase
    .from("biodata_share_links")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  const link = mapShareLink(data as Row | null);
  if (!link) return null;
  if (link.revokedAt) return null;
  if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) return null;
  return link;
}
