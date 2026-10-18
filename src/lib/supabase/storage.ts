import { supabase } from "./client";

export const MEDIA_BUCKET = "media";

export function mediaPathForUser(
  userId: string,
  fileName: string,
  folder = "photos",
): string {
  const safeName =
    fileName.replace(/[^\w.\-]+/g, "-").slice(0, 80) || "photo.jpg";
  return `users/${userId}/${folder}/${Date.now()}-${safeName}`;
}

/** One stable profile-photo object per account, shared by every screen/device. */
export function profilePhotoPathForUser(
  userId: string,
  fileName: string,
): string {
  const extension =
    fileName.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[0] || ".jpg";
  return `users/${userId}/profile_photo/profile${extension}`;
}

export function extractStoragePath(
  urlOrPath: string | null | undefined,
): string | null {
  if (!urlOrPath) return null;
  const value = urlOrPath.trim();
  if (value.startsWith("/api/media?"))
    return new URLSearchParams(value.split("?")[1]).get("path");
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

/** Stable browser URL for a storage path (served through the authenticated media gateway). */
export function getPublicMediaUrl(path: string): string {
  return `/api/media?path=${encodeURIComponent(path)}`;
}

/** Normalize a stored photo value into something an <img> can load. */
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

/** Use the gateway rather than issuing a long-lived signed URL for private media. */
export async function createSignedMediaUrl(
  path: string,
  _expiresIn = 60,
): Promise<string | null> {
  const storagePath = extractStoragePath(path) || path;
  return storagePath ? getPublicMediaUrl(storagePath) : null;
}

function describeUploadError(error: { message?: string }, path: string): Error {
  const message = error.message || "";
  if (/bucket not found|NoSuchBucket/i.test(message)) {
    return new Error(
      "Photo storage is not set up. Run supabase/fixups/create-media-bucket.sql in the Supabase SQL Editor, then try again.",
    );
  }
  if (
    /row-level security|violates|policy|unauthorized|jwt|not allowed/i.test(
      message,
    )
  ) {
    return new Error(
      "Photo upload was blocked by storage permissions. Sign in again, and ensure the media bucket policies are installed.",
    );
  }
  if (/Payload too large|exceeded|too large/i.test(message)) {
    return new Error(
      "That photo is too large. Please upload an image under 5MB.",
    );
  }
  return new Error(message || `Failed to upload file to ${path}.`);
}

/** Upload a file and return its durable storage path. */
export async function uploadFile(file: File, path: string): Promise<string> {
  if (!file) throw new Error("No file provided for upload.");
  if (!path) throw new Error("No path provided for upload.");

  // Existing callers still create timestamped profile_photo paths. Normalize them
  // here so the account always has one canonical profile-photo object.
  const profileMatch = path.match(/^users\/([^/]+)\/profile_photo\//);
  const uploadPath = profileMatch
    ? profilePhotoPathForUser(profileMatch[1], file.name)
    : path;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(uploadPath, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "3600",
    });

  if (error) {
    console.error("Error uploading file:", error);
    throw describeUploadError(error, uploadPath);
  }

  return uploadPath;
}

/** Upload and return both durable path and display URL. */
export async function uploadMediaFile(
  file: File,
  path: string,
): Promise<{ path: string; url: string }> {
  const storedPath = await uploadFile(file, path);
  const publicUrl = getPublicMediaUrl(storedPath);
  if (publicUrl) {
    return { path: storedPath, url: publicUrl };
  }
  const signed = await createSignedMediaUrl(storedPath);
  return { path: storedPath, url: signed || storedPath };
}
