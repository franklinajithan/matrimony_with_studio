import { supabase } from "./client";

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
