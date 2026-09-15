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
  submittedByUid: string | null;
}) {
  const { error } = await supabase.from("success_stories").insert({
    couple_names: params.coupleNames,
    story_text: params.storyText,
    original_story_text: params.originalStoryText,
    photo_url: params.photoUrl,
    photo_storage_path: params.photoStoragePath,
    contact_email: params.contactEmail,
    submitted_by_uid: params.submittedByUid,
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
