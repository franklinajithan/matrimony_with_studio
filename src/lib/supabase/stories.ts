import { supabase } from "./client";
import { Timestamp } from "./timestamp";
import type { SuccessStoryRow } from "./types";

type Row = Record<string, any>;

function mapStory(row: Row | null): SuccessStoryRow | null {
  if (!row) return null;
  return {
    id: row.id,
    coupleNames: row.couple_names,
    storyText: row.story_text,
    originalStoryText: row.original_story_text,
    photoUrl: row.photo_url,
    photoStoragePath: row.photo_storage_path,
    contactEmail: row.contact_email,
    submittedByUid: row.submitted_by_uid,
    status: row.status,
    adminNotes: row.admin_notes,
    submittedAt: Timestamp.fromISO(row.submitted_at),
    updatedAt: Timestamp.fromISO(row.updated_at),
    approvedAt: Timestamp.fromISO(row.approved_at),
  };
}

export async function createSuccessStory(params: {
  coupleNames: string;
  storyText: string;
  originalStoryText: string;
  photoUrl: string | null;
  photoStoragePath: string | null;
  contactEmail: string | null;
  publicationConsent: boolean;
}) {
  if (params.publicationConsent !== true) throw new Error("Please consent to publication before submitting your story.");
  const { data: identity, error: authError } = await supabase.auth.getUser();
  if (authError || !identity.user) throw new Error("Please sign in before submitting your story.");
  const { error } = await supabase.from("success_stories").insert({
    couple_names: params.coupleNames,
    story_text: params.storyText,
    original_story_text: params.originalStoryText,
    photo_url: params.photoUrl,
    photo_storage_path: params.photoStoragePath,
    contact_email: params.contactEmail,
    submitted_by_uid: identity.user.id,
    publication_consent: true,
    consent_version: "2026-11-02",
    status: "pending",
  });
  if (error) throw error;
}

export function subscribeToSuccessStories(
  onChange: (stories: SuccessStoryRow[]) => void,
  onError?: (error: Error) => void
): () => void {
  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      onChange((data || []).map((row) => mapStory(row)!));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  void load();
  const channel = supabase
    .channel("success-stories-admin")
    .on("postgres_changes", { event: "*", schema: "public", table: "success_stories" }, () => {
      void load();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export type PublishedStory = { id: string; couple_names: string; story_text: string; photo_url: string | null; approved_at: string };
export async function listPublishedStories(offset = 0): Promise<PublishedStory[]> {
  const { data, error } = await supabase.rpc("published_success_stories", { p_limit: 12, p_offset: offset });
  if (error) throw new Error("Stories are unavailable. Please try again later.");
  return data || [];
}
export async function withdrawStoryConsent(id: string): Promise<void> {
  const { data, error } = await supabase.rpc("withdraw_story_consent", { p_id: id });
  if (error || data !== true) throw new Error("Could not withdraw consent. Refresh and try again.");
}
