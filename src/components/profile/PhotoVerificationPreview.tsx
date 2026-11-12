"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LocalFaceScan } from "@/components/profile/LocalFaceScan";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
type PhotoCheck = { width: number; height: number; notices: string[] };
const approved = new Set(["image/jpeg", "image/png", "image/webp"]);

async function checkImage(file: File): Promise<PhotoCheck> {
  if (!approved.has(file.type)) throw new Error("Use a JPEG, PNG or WebP image.");
  if (file.size === 0 || file.size > MAX_FILE_SIZE) throw new Error("Choose a photo under 5 MB.");
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    if (image.naturalWidth < 400 || image.naturalHeight < 400) {
      throw new Error("Choose a clear picture at least 400 × 400 pixels.");
    }
    const notices: string[] = [];
    if (image.naturalWidth < 800 || image.naturalHeight < 800) {
      notices.push("For best results, upload a photo 800 × 800 pixels or larger.");
    }
    const ratio = image.naturalWidth / image.naturalHeight;
    if (ratio > 2 || ratio < 0.4) notices.push("A square or portrait crop is preferable.");
    return { width: image.naturalWidth, height: image.naturalHeight, notices };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Choose")) throw error;
    throw new Error("Could not open the photo. Try a different file.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function PhotoVerificationPreview() {
  const [preview, setPreview] = useState<string | null>(null);
  const [photoCheck, setPhotoCheck] = useState<PhotoCheck | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);




  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function handlePhoto(file?: File) {
    setPhotoError(null);
    setPhotoCheck(null);
    setPreview(null);
    if (!file) return;
    try {
      const result = await checkImage(file);
      setPhotoCheck(result);
      setPreview(URL.createObjectURL(file));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Unable to check image.");
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-7 px-4 py-8 text-foreground">
      <Link href="/dashboard" className="text-sm text-primary underline">← Back to dashboard</Link>
      <header className="space-y-3 text-center">
        <span aria-hidden="true" className="text-4xl">◉</span>
        <h1 className="text-3xl font-bold">Live profile photo scan</h1>
        <p className="text-muted-foreground">Follow live, automatic face-alignment instructions directly on your phone. A verification badge requires additional security checks.</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-primary/20 bg-background p-5">
        <h2 className="text-xl font-semibold">1. Check your profile photo</h2>
        <p className="text-sm text-muted-foreground">Use a recent solo portrait with good lighting. Make sure your whole face is clearly visible. Avoid sunglasses, heavy filters and group photos.</p>
        <label className="block text-sm font-medium" htmlFor="photo-quality-check">Check a photo on your device</label>
        <input id="photo-quality-check" className="block w-full text-sm" type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => void handlePhoto(e.target.files?.[0])} />
        {photoError && <p role="alert" className="text-sm text-destructive">{photoError}</p>}
        {preview && photoCheck && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Local photo preview" className="mx-auto max-h-64 rounded-xl object-contain" />
            <p className="text-sm text-green-700">Image dimensions, type and size passed: {photoCheck.width} × {photoCheck.height}.</p>
            {photoCheck.notices.map((notice) => <p key={notice} className="text-sm text-amber-700">{notice}</p>)}
            <p className="text-xs text-muted-foreground">This image remains on this device. Face quality and identity have not been verified by this check.</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">To use a different main photo for verification, first save it on your CupidMatch profile. Selecting a file here does not upload it.</p>
      </section>

      <LocalFaceScan />

    </main>
  );
}
