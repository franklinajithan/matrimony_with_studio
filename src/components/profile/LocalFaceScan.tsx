"use client";

import { useEffect, useRef, useState } from "react";

type Landmark = { x: number; y: number; z?: number };
type Detector = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => { faceLandmarks: Landmark[][] };
  close: () => void;
};
type ScanStep = 0 | 1 | 2 | 3;
const INSTRUCTIONS = [
  "Centre your face inside the oval",
  "Slowly turn your head to one side",
  "Slowly turn your head to the other side",
  "Scan guidance complete",
] as const;

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";
const MODULE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/+esm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Face landmarks are computed in the browser only; no video frames or descriptors leave the device.
export function LocalFaceScan() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const frameRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const startAttemptRef = useRef(0);
  const stepRef = useRef<ScanStep>(0);
  const streakRef = useRef(0);
  const firstDirectionRef = useRef(0);
  const lastFrameRef = useRef(0);
  const mountedRef = useRef(true);

  const [status, setStatus] = useState<"idle" | "loading" | "scanning" | "complete">("idle");
  const [step, setStep] = useState<ScanStep>(0);
  const [message, setMessage] = useState("Press start to open the front camera");
  const [error, setError] = useState<string | null>(null);
  const [faceAligned, setFaceAligned] = useState(false);
  const [consent, setConsent] = useState(false);

  function cleanup() {
    runningRef.current = false;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    mediaRef.current?.getTracks().forEach((track) => track.stop());
    mediaRef.current = null;
    detectorRef.current?.close();
    detectorRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; cleanup(); };
  }, []);

  function move(next: ScanStep) {
    stepRef.current = next;
    streakRef.current = 0;
    setStep(next);
    setFaceAligned(false);
    setMessage(INSTRUCTIONS[next]);
    if (next === 3) {
      cleanup();
      setStatus("complete");
    }
  }

  function tick(timestamp: number) {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector) return;
    if (timestamp - lastFrameRef.current >= 110 && video.readyState >= 2 && video.videoWidth > 0) {
      lastFrameRef.current = timestamp;
      try {
        const result = detector.detectForVideo(video, timestamp);
        const faces = result.faceLandmarks;
        if (faces.length !== 1) {
          streakRef.current = 0;
          setFaceAligned(false);
          setMessage(faces.length > 1 ? "Only one person should be in the frame" : "Move your face into the oval");
        } else {
          const points = faces[0];
          const xs = points.map((p) => p.x);
          const ys = points.map((p) => p.y);
          const left = Math.min(...xs);
          const right = Math.max(...xs);
          const top = Math.min(...ys);
          const bottom = Math.max(...ys);
          const width = right - left;
          const height = bottom - top;
          const centerX = (left + right) / 2;
          const centerY = (top + bottom) / 2;
          const aligned = centerX > 0.35 && centerX < 0.65 &&
            centerY > 0.31 && centerY < 0.69 &&
            width > 0.22 && width < 0.77 &&
            height > 0.32 && height < 0.84 &&
            left > 0.02 && right < 0.98 && top > 0.01 && bottom < 0.99;
          setFaceAligned(aligned);
          if (!aligned) {
            streakRef.current = 0;
            setMessage("Centre your face and hold your phone at eye level");
          } else {
            // Ratio between the nose and eye corners gives a coarse head-turn signal.
            // This is pose guidance, NOT proof of presentation-attack resistance.
            const nose = points[1];
            const eyeLeft = points[33];
            const eyeRight = points[263];
            const eyesMid = (eyeLeft.x + eyeRight.x) / 2;
            const eyesSpan = Math.max(0.01, Math.abs(eyeRight.x - eyeLeft.x));
            const yawSignal = (nose.x - eyesMid) / eyesSpan;
            const current = stepRef.current;
            let passed = false;
            if (current === 0) passed = Math.abs(yawSignal) < 0.15;
            if (current === 1) passed = Math.abs(yawSignal) > 0.19;
            if (current === 2) passed = firstDirectionRef.current * yawSignal < -0.035 && Math.abs(yawSignal) > 0.19;
            if (passed) {
              streakRef.current += 1;
              setMessage("Great — hold your position");
              if (streakRef.current >= 6) {
                if (current === 1) firstDirectionRef.current = Math.sign(yawSignal);
                move((current + 1) as ScanStep);
              }
            } else {
              streakRef.current = 0;
              setMessage(current === 0 ? "Look straight at the camera" :
                current === 1 ? "Slowly turn your head to either side" :
                "Turn your head to the opposite side");
            }
          }
        }
      } catch {
        setError("Face tracking stopped unexpectedly. Close and retry.");
        cleanup();
        setStatus("idle");
        return;
      }
    }
    if (runningRef.current) frameRef.current = requestAnimationFrame(tick);
  }

  async function start() {
    if (!consent || runningRef.current) return;
    setStatus("loading");
    setError(null);
    setStep(0);
    setFaceAligned(false);
    stepRef.current = 0;
    streakRef.current = 0;
    firstDirectionRef.current = 0;
    setMessage("Loading on-device face tracking…");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not available in this browser.");
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 720 } }, audio: false
      });
      if (!mountedRef.current || startAttemptRef.current !== thisAttempt) { media.getTracks().forEach((track) => track.stop()); return; }
      mediaRef.current = media;
      setStatus("scanning");
      // Wait for video element to mount after state change.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (!videoRef.current) throw new Error("Camera preview cannot be displayed.");
      videoRef.current.srcObject = media;
      await videoRef.current.play();
      // Dynamic, pinned ESM import: no API key or paid verification service required.
      // Module and model are downloaded from public model/CDN hosting.
      const toolkit = await import(/* webpackIgnore: true */ MODULE_URL);\n      if (startAttemptRef.current !== thisAttempt) return;
      const wasm = await toolkit.FilesetResolver.forVisionTasks(WASM_URL);
      const detector: Detector = await toolkit.FaceLandmarker.createFromOptions(wasm, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 2,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.5,
      });
      if (!mountedRef.current || startAttemptRef.current !== thisAttempt) { detector.close(); return; }
      detectorRef.current = detector;
      runningRef.current = true;
      setMessage(INSTRUCTIONS[0]);
      frameRef.current = requestAnimationFrame(tick);
    } catch (cause) {
      cleanup();
      setStatus("idle");
      const detail = cause instanceof Error ? cause.message : "Unable to initialise the camera.";
      setError("Live camera guidance could not start. Check camera permissions and internet access. " + detail);
    }
  }

  function stop() {
    cleanup();
    setStatus("idle");
    setFaceAligned(false);
    setStep(0);
    stepRef.current = 0;
    setMessage("Camera stopped. You can retry when ready.");
  }

  return (
    <section className="space-y-5 rounded-2xl border border-primary/20 p-4 sm:p-6" aria-label="On-device live face alignment">
      <h2 className="text-xl font-bold">Live face scanning</h2>
      <p className="text-sm text-muted-foreground">Align your face and turn your head when prompted. The guide advances automatically using on-device face tracking.</p>
      <div className="relative mx-auto aspect-[4/5] max-w-sm overflow-hidden rounded-[2rem] bg-[#24132d] text-white">
        {status === "scanning" ? (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }} aria-label="Front camera live view" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center text-white/70">
            {status === "loading" ? "Starting camera…" : status === "complete" ? "Scan guidance completed" : "Camera is off"}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-[12%] top-[13%] bottom-[24%] rounded-[48%] border-[6px] transition-colors"
          style={{ borderColor: status === "complete" ? "#a5d6ad" : faceAligned ? "#cfac65" : "#d2c0d8" }} aria-hidden="true"/>
        <div className="absolute bottom-0 w-full bg-[#24132d]/90 p-4 text-center">
          <p className="text-sm text-white/75">{status === "complete" ? "Done" : status === "scanning" ? `Step ${step + 1} of 3` : "Camera guide"}</p>
          <p role="status" aria-live="polite" className="mt-1 min-h-12 font-semibold">{message}</p>
          <div className="mt-3 flex gap-1.5" aria-label={`Progress: ${Math.min(step, 3)} of 3 steps`}>
            {[0, 1, 2].map((item) => <span key={item}
              className={`h-2 flex-1 rounded-full ${step > item ? "bg-[#c6a15b]" : "bg-white/30"}`} />)}
          </div>
        </div>
      </div>
      {status === "idle" && (
        <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>I allow my camera to be used for local face-alignment guidance. My camera frames are not uploaded by this feature.</span>
        </label>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-400 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {status === "idle" || status === "complete" ? (
          <button type="button" disabled={!consent} onClick={() => void start()}
            className="min-h-12 flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">
            {status === "complete" ? "Scan again" : "Start live camera"}
          </button>
        ) : (
          <button type="button" onClick={stop} className="min-h-12 flex-1 rounded-xl border px-4 py-3 font-semibold">
            Cancel and close camera
          </button>
        )}
      </div>
      {status === "complete" && <p className="rounded-lg border border-amber-400/50 p-3 text-sm text-amber-700">
        Face-position guidance completed. This does not prove liveness or match the saved profile photo, so no verification badge is awarded.
      </p>}
      <p className="text-xs text-muted-foreground">
        This uses an open-source face landmark model downloaded from public hosting and processed in your browser.
        It is a camera-guidance feature, not certified anti-spoofing, identity or biometric verification.
      </p>
    </section>
  );
}
