import { supabase } from "./client";

export const MEDIA_BUCKET = "media";

export function mediaPathForUser(userId: string, fileName: string, folder = "photos"): string {
  const safeName = fileName.replace(/[^\w.\-]+/g, "-").slice(0, 80) || "photo.jpg";
  return `users/${userId}/${folder}/${Date.now()}-${safeName}`;
}

export function extractStoragePath(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  const value = urlOrPath.trim();
  if (!value) return null;

  if (value.startsWith("users/") || value.startsWith("success_stories/")) {
    return value.split("?")[0];
  }

  const markers = [
    `/object/public/${MEDIA_BUCKET}/`,
    `/object/sign/${MEDIA_BUCKET}/`,
    `/storage/v1/object/public/${MEDIA_BUCKET}/`,
    `/storage/v1/object/sign/${MEDIA_BUCKET}/`,
  ];

  for (const marker of markers) {
    const index = value.indexOf(marker);
    if (index >= 0) {
      const rest = value.slice(index + marker.length).split("?")[0];
      return decodeURIComponent(rest);
    }
  }

  return null;
}

/** Stable browser URL for a storage path (requires public media bucket). */
export function getPublicMediaUrl(path: string): string {
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Normalize any stored photo value into something an <img> can load.
 * - Local public assets (`/profiles/...`) stay as-is
 * - Storage paths / signed URLs become durable public media URLs
 * - External http(s) URLs stay as-is when not in our bucket
 */
export function resolveMediaUrl(urlOrPath: string | null | undefined): string {
  if (!urlOrPath) return "";
  const value = urlOrPath.trim();
  if (!value) return "";

  if (value.startsWith("blob:") || value.startsWith("data:")) return value;
  if (value.startsWith("/")) return value;

  const storagePath = extractStoragePath(value);
  if (storagePath) return getPublicMediaUrl(storagePath);

  return value;
}

export async function createSignedMediaUrl(
  path: string,
  expiresIn = 60 * 60 * 24 * 7
): Promise<string | null> {
  if (!path) return null;
  const storagePath = extractStoragePath(path) || path;
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function describeUploadError(error: { message?: string }, path: string): Error {
  const message = error.message || "";
  if (/bucket not found|NoSuchBucket/i.test(message)) {
    return new Error(
      "Photo storage is not set up. Run supabase/fixups/create-media-bucket.sql in the Supabase SQL Editor, then try again."
    );
  }
  if (/row-level security|violates|policy|unauthorized|jwt|not allowed/i.test(message)) {
    return new Error(
      "Photo upload was blocked by storage permissions. Sign in again, and ensure the media bucket policies are installed."
    );
  }
  if (/Payload too large|exceeded|too large/i.test(message)) {
    return new Error("That photo is too large. Please upload an image under 5MB.");
  }
  return new Error(message || `Failed to upload file to ${path}.`);
}

/**
 * Upload a file and return the durable storage path (not a temporary signed URL).
 * Use resolveMediaUrl(path) when you need a display URL.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  if (!file) throw new Error("No file provided for upload.");
  if (!path) throw new Error("No path provided for upload.");

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: "3600",
  });

  if (error) {
    console.error("Error uploading file:", error);
    throw describeUploadError(error, path);
  }

  return path;
}

/** Upload and return both durable path and display URL. */
export async function uploadMediaFile(
  file: File,
  path: string
): Promise<{ path: string; url: string }> {
  const storedPath = await uploadFile(file, path);
  const publicUrl = getPublicMediaUrl(storedPath);
  // Prefer public URL; fall back to a long-lived signed URL if bucket is still private.
  if (publicUrl) {
    return { path: storedPath, url: publicUrl };
  }
  const signed = await createSignedMediaUrl(storedPath);
  return { path: storedPath, url: signed || storedPath };
}
