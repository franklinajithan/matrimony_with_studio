import { supabase } from "./client";

const BUCKET = "media";

export function mediaPathForUser(userId: string, fileName: string, folder = "photos"): string {
  const safeName = fileName.replace(/[^\w.\-]+/g, "-").slice(0, 80);
  return `users/${userId}/${folder}/${Date.now()}-${safeName}`;
}

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

  const signed = await createSignedMediaUrl(path);
  return signed || path;
};

export async function createSignedMediaUrl(path: string, expiresIn = 3600): Promise<string | null> {
  if (!path) return null;
  const storagePath = extractStoragePath(path) || path;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath) return null;
  if (urlOrPath.startsWith("users/")) return urlOrPath;
  const markers = ["/object/public/media/", "/object/sign/media/"];
  for (const marker of markers) {
    const index = urlOrPath.indexOf(marker);
    if (index >= 0) {
      const rest = urlOrPath.slice(index + marker.length).split("?")[0];
      return decodeURIComponent(rest);
    }
  }
  return null;
}
