"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function PhotoVerificationPreview({ enabled }: { enabled: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [photoCheck, setPhotoCheck] = useState<PhotoCheck | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
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

  async function beginScan() {
    if (!consented || loading) return;
    setLoading(true);
    setScanError(null);
    try {
      const response = await fetch("/api/photo-verification/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Unable to open verification.");
      const url = new URL(result.url);
      if (url.protocol !== "https:" || !url.hostname.endsWith(".didit.me")) {
        throw new Error("Untrusted verification destination.");
      }
      window.location.assign(url.toString());
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Unable to open verification.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-7 px-4 py-8 text-foreground">
      <Link href="/dashboard" className="text-sm text-primary underline">← Back to dashboard</Link>
      <header className="space-y-3 text-center">
        <span aria-hidden="true" className="text-4xl">◉</span>
        <h1 className="text-3xl font-bold">Verify your profile picture</h1>
        <p className="text-muted-foreground">Help members trust that your profile photograph shows the person behind your account.</p>
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

      <section className="space-y-4 rounded-2xl border border-primary/20 bg-background p-5">
        <h2 className="text-xl font-semibold">2. Live face scan</h2>
        <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full border-[6px] border-dashed border-primary/40 bg-primary/5">
          <div className="space-y-2 text-center">
            <span className="block text-6xl text-primary" aria-hidden="true">◎</span>
            <span className="block text-sm font-medium">Live selfie check</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">A specialised verification provider will guide you to centre your face and complete its automatic liveness challenge. It may use different movements from the examples shown.</p>
        <ol className="list-decimal space-y-1 pl-6 text-sm">
          <li>Open the secure live scan on your phone.</li>
          <li>Allow camera access and position your face inside the frame.</li>
          <li>Follow the provider's automatic prompts until the scan completes.</li>
        </ol>
        <p className="rounded-lg border p-3 text-xs text-muted-foreground">
          <strong>Privacy:</strong> This uses biometric information processed by an external provider. Before enabling, CupidMatch must publish the provider's retention, deletion and contact details and a lawful basis/UK GDPR special-category condition. Declining does not prevent normal registration.
        </p>
        {!enabled && <p role="status" className="rounded-lg border border-amber-400/40 p-3 text-sm text-amber-700">Live face scanning is not enabled yet. The secure provider, privacy settings and database setup must be completed before you can start verification.</p>}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" checked={consented} onChange={(e) => setConsented(e.target.checked)} />
          <span>I explicitly agree to open the biometric liveness verification service for the purpose of checking my profile photograph. I understand it is optional and can contact support for an alternative review.</span>
        </label>
        <button onClick={() => void beginScan()} type="button" disabled={!enabled || !consented || loading}
          className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">
          {!enabled ? "Live verification coming soon" : loading ? "Preparing secure scan…" : "Start live face verification"}
        </button>
        {scanError && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{scanError}</p>}
        <p className="text-center text-xs text-muted-foreground">A completed liveness scan alone does not issue a Photo Verified badge. Secure comparison with the saved profile photo and provider verdict integration are still required.</p>
      </section>
    </main>
  );
}
