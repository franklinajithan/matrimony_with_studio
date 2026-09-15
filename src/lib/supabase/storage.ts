import { supabase } from "./client";

const BUCKET = "media";

export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!file) {
    throw new Error("No file provided for upload.");
  }
  if (!path) {
    throw new Error("No path provided for upload.");
  }

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file to ${path}.`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
