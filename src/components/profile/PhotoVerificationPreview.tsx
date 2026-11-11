"use client";

import { useEffect, useRef, useState } from "react";

type Quality = { width: number; height: number; notes: string[] };
type Phase = "instructions" | "camera" | "finished";
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const prompts = ["Look straight at the camera", "Slowly turn your head left", "Slowly turn your head right"] as const;

async function inspectPhoto(file: File): Promise<Quality> {
  if (!ALLOWED.has(file.type)) throw new Error("Choose a JPEG, PNG or WebP photo.");
  if (file.size > MAX_SIZE) throw new Error("Photo must be smaller than 10 MB.");
  if (!file.size) throw new Error("This photo is empty.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth < 400 || image.naturalHeight < 400) {
      throw new Error("Photo is too small. Choose an image at least 400 × 400 pixels.");
    }
    const notes: string[] = [];
    if (image.naturalWidth < 800 || image.naturalHeight < 800) {
      notes.push("For the sharpest profile photo, use an image at least 800 × 800 pixels.");
    }
    if (image.naturalWidth / image.naturalHeight > 2 || image.naturalHeight / image.naturalWidth > 2.5) {
      notes.push("A portrait or square photo works best for your profile.");
    }
    return { width: image.naturalWidth, height: image.naturalHeight, notes };
  } catch (error) {
    if (error instanceof Error && error.message !== "The source image cannot be decoded.") {
      throw error;
    }
    throw new Error("Unable to read this image. Choose another photo.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PhotoVerificationPreview() {
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("instructions");
  const [step, setStep] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  function stopCamera() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }

  useEffect(() => () => {
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (phase === "camera" && stream.current && video.current) {
      video.current.srcObject = stream.current;
      void video.current.play().catch(() => setCameraError("Camera preview could not start."));
    }
  }, [phase]);

  async function choosePhoto(file?: File) {
    setError(null);
    setQuality(null);
    setPreview((old) => { if (old) URL.revokeObjectURL(old); return null; });
    if (!file) return;
    try {
      const details = await inspectPhoto(file);
      setQuality(details);
      setPreview(URL.createObjectURL(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "This photo could not be checked.");
    }
  }

  async function startCamera() {
    setCameraError(null);
    if (!consented) {
      setCameraError("Please acknowledge the camera preview notice first.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera access. Try a recent mobile or desktop browser.");
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      stream.current = media;
      setStep(0);
      setPhase("camera");
    } catch {
      setCameraError("Camera access was denied or unavailable. Check your browser permissions and try again.");
    }
  }

  function nextStep() {
    if (step < prompts.length - 1) {
      setStep((previous) => previous + 1);
    } else {
      stopCamera();
      setPhase("finished");
    }
  }

  function reset() {
    stopCamera();
    setStep(0);
    setPhase("instructions");
    setCameraError(null);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-foreground">
      <a href="/dashboard" className="text-sm underline underline-offset-4">← Back to dashboard</a>
      <h1 className="mt-6 text-3xl font-bold">Profile photo check</h1>
      <p className="mt-3 text-muted-foreground">
        Check your photo and practise the live-selfie steps. This is a test preview, not a biometric identity check.
        No photo is uploaded by this page, and no verified badge is awarded.
      </p>

      <section className="mt-8 rounded-2xl border p-5">
        <h2 className="text-xl font-semibold">1. Choose a suitable profile photo</h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-sm">
          <li>Use a recent photo showing only you, with your face fully visible.</li>
          <li>Use good lighting, a clear focus, and a simple background.</li>
          <li>Avoid sunglasses, face-covering filters, screenshots and heavily edited images.</li>
          <li>Upload JPEG, PNG or WebP, up to 10 MB. Minimum 400 × 400 pixels.</li>
        </ul>
        <label htmlFor="photo-check-input" className="mt-5 block font-medium">Select a photo to check on this device</label>
        <input id="photo-check-input" type="file" accept="image/jpeg,image/png,image/webp"
          className="mt-2 block w-full text-sm" onChange={(event) => void choosePhoto(event.target.files?.[0])} />
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        {preview && quality && (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your selected photo preview" className="max-h-80 w-auto rounded-lg object-contain" />
            <p className="mt-2 text-sm">Image dimensions: {quality.width} × {quality.height} pixels.</p>
            <p className="mt-1 text-sm font-medium text-green-700">File type, size and image dimensions passed.</p>
            {quality.notes.map((note) => <p key={note} className="mt-1 text-sm text-amber-700">{note}</p>)}
            <p className="mt-2 text-xs text-muted-foreground">
              Face count, face match, lighting and liveness have not been automatically verified.
            </p>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border p-5">
        <h2 className="text-xl font-semibold">2. Practise live selfie verification</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This camera-only demo does not record, transmit or store any footage. Turning your head is
          not proof of liveness; a secure verification provider is required before badges can be enabled.
        </p>
        {phase === "instructions" && (
          <div className="mt-4 space-y-4">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} />
              <span>I understand this is a local camera preview, not a real identity or biometric verification.</span>
            </label>
            <button type="button" onClick={() => void startCamera()} disabled={!consented}
              className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50">
              Open camera preview
            </button>
          </div>
        )}
        {phase === "camera" && (
          <div className="mt-5 space-y-4">
            <p aria-live="polite" className="font-semibold">Step {step + 1} of 3: {prompts[step]}</p>
            <video ref={video} autoPlay muted playsInline aria-label="Live camera preview"
              className="w-full max-w-md rounded-xl bg-black" style={{ transform: "scaleX(-1)" }} />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={nextStep} className="rounded-lg bg-primary px-5 py-3 text-primary-foreground">
                {step === 2 ? "Finish practice" : "Next instruction"}
              </button>
              <button type="button" onClick={reset} className="rounded-lg border px-5 py-3">Cancel</button>
            </div>
          </div>
        )}
        {phase === "finished" && (
          <div className="mt-4 space-y-3">
            <p role="status" className="font-medium">Camera practice finished. Your profile has not been verified.</p>
            <button type="button" onClick={reset} className="rounded-lg border px-5 py-3">Try again</button>
          </div>
        )}
        {cameraError && <p role="alert" className="mt-3 text-sm text-red-600">{cameraError}</p>}
      </section>
      <p className="mt-6 text-sm text-muted-foreground">
        Real face verification will require a secure provider, explicit biometric consent,
        a privacy assessment and a member appeal process. See development issue #136.
      </p>
    </main>
  );
}
