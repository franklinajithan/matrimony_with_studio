"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { communicate } from "@/lib/communication/client";
type Call = {
  id: string;
  chat_id: string;
  kind: "voice" | "video";
  caller_id: string;
  status: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
};
export function CallPanel() {
  const [call, setCall] = useState<Call | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [connection, setConnection] = useState("");
  const callRef = useRef<Call | null>(null),
    peer = useRef<RTCPeerConnection | null>(null),
    localStream = useRef<MediaStream | null>(null),
    remoteStream = useRef<MediaStream | null>(null),
    localVideo = useRef<HTMLVideoElement>(null),
    remoteVideo = useRef<HTMLVideoElement>(null),
    lastSignal = useRef(0),
    pendingIce = useRef<RTCIceCandidateInit[]>([]),
    outgoingIce = useRef<RTCIceCandidateInit[]>([]),
    mounted = useRef(true);
  const update = useCallback((c: Call | null) => {
    callRef.current = c;
    setCall(c);
  }, []);
  const cleanup = useCallback(() => {
    peer.current?.close();
    peer.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    remoteStream.current = null;
    lastSignal.current = 0;
    pendingIce.current = [];
    outgoingIce.current = [];
    setConnection("");
  }, []);
  const end = useCallback(
    async (action = "call_end") => {
      const c = callRef.current;
      cleanup();
      update(null);
      if (c) await communicate(action, { id: c.id }).catch(() => {});
    },
    [cleanup, update],
  );
  async function prepare(kind: "voice" | "video", chatId: string) {
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection)
      throw new Error(
        "Calling is unavailable in this browser. Use a supported browser with HTTPS.",
      );
    const response = await fetch(
      `/api/communication?chatId=${encodeURIComponent(chatId)}`,
    );
    const config = await response.json();
    if (!response.ok || !config.callingEnabled)
      throw new Error(
        config.error ||
          "Calling is not available yet. TURN service setup and call verification are still required.",
      );
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: kind === "video",
    });
    if (!mounted.current) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error("Call closed");
    }
    localStream.current = stream;
    const pc = new RTCPeerConnection({ iceServers: config.iceServers });
    peer.current = pc;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.ontrack = (e) => {
      remoteStream.current = e.streams[0] || new MediaStream([e.track]);
      if (remoteVideo.current)
        remoteVideo.current.srcObject = remoteStream.current;
    };
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const candidate = e.candidate.toJSON();
      const c = callRef.current;
      if (c)
        void communicate("call_signal", { id: c.id, candidate }).catch(
          () => {},
        );
      else outgoingIce.current.push(candidate);
    };
    pc.onconnectionstatechange = () => {
      setConnection(pc.connectionState);
      if (pc.connectionState === "failed") {
        setError("The call could not connect. Check your network and retry.");
        void end("call_unavailable");
      }
    };
    setTimeout(() => {
      if (localVideo.current) localVideo.current.srcObject = stream;
    }, 0);
    return pc;
  }
  const beginRef = useRef<
    (chatId: string, kind: "voice" | "video") => Promise<void>
  >(async () => {});
  beginRef.current = async (chatId, kind) => {
    if (callRef.current || busy) return;
    setBusy(true);
    setError("");
    try {
      const pc = await prepare(kind, chatId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const result = await communicate<{ id: string }>("call_start", {
        chatId,
        kind,
        offer: { type: offer.type, sdp: offer.sdp },
      });
      update({
        id: result.id,
        chat_id: chatId,
        kind,
        caller_id: "self",
        status: "ringing",
      });
      for (const candidate of outgoingIce.current)
        await communicate("call_signal", { id: result.id, candidate });
      outgoingIce.current = [];
    } catch (e) {
      cleanup();
      const err = e as Error;
      setError(
        err.name === "NotAllowedError"
          ? "Microphone/camera permission was denied. Allow access in your browser and try again."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  };
  async function accept() {
    const c = callRef.current;
    if (!c?.offer || busy) return;
    setBusy(true);
    setError("");
    try {
      const pc = await prepare(c.kind, c.chat_id);
      await communicate("call_accept", { id: c.id });
      await pc.setRemoteDescription(c.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await communicate("call_answer", {
        id: c.id,
        answer: { type: answer.type, sdp: answer.sdp },
      });
      update({ ...c, status: "accepted" });
    } catch (e) {
      const err = e as Error;
      setError(
        err.name === "NotAllowedError"
          ? "Permission denied. This call is unavailable until you allow microphone/camera access."
          : err.message,
      );
      await end("call_unavailable");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    let polling = false;
    const start = (e: Event) => {
      const { chatId, kind } = (e as CustomEvent).detail || {};
      if (typeof chatId === "string" && (kind === "voice" || kind === "video"))
        void beginRef.current(chatId, kind);
    };
    window.addEventListener("cupid-call", start);
    const timer = setInterval(() => {
      if (polling) return;
      polling = true;
      void (async () => {
        const current = callRef.current;
        if (!current) {
          const incoming = await communicate<{ calls: Call[] }>("incoming");
          if (mounted.current && incoming.calls[0]) update(incoming.calls[0]);
          return;
        }
        const result = await communicate<{
          call: Call;
          signals: { id: number; candidate: RTCIceCandidateInit }[];
        }>("call_read", { id: current.id, after: lastSignal.current });
        if (!mounted.current) return;
        if (
          ["rejected", "ended", "unavailable", "missed"].includes(
            result.call.status,
          )
        ) {
          setError(`Call ${result.call.status}.`);
          cleanup();
          update(null);
          return;
        }
        if (result.call.status !== current.status)
          update({ ...current, status: result.call.status });
        const pc = peer.current;
        if (pc) {
          if (result.call.answer && !pc.remoteDescription)
            await pc.setRemoteDescription(result.call.answer);
          for (const signal of result.signals) {
            lastSignal.current = signal.id;
            pendingIce.current.push(signal.candidate);
          }
          if (pc.remoteDescription) {
            const candidates = pendingIce.current.splice(0);
            for (const candidate of candidates)
              await pc.addIceCandidate(candidate);
          }
        }
      })()
        .catch((e) => {
          if (callRef.current) {
            setError((e as Error).message);
            void end("call_unavailable");
          }
        })
        .finally(() => {
          polling = false;
        });
    }, 2500);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener("cupid-call", start);
      const c = callRef.current;
      cleanup();
      if (c) void communicate("call_end", { id: c.id }).catch(() => {});
    };
  }, [cleanup, end, update]);
  useEffect(() => {
    if (localVideo.current) localVideo.current.srcObject = localStream.current;
    if (remoteVideo.current)
      remoteVideo.current.srcObject = remoteStream.current;
  }, [call]);
  return (
    <>
      {error && (
        <div
          role="alert"
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl border bg-background p-4 shadow-xl"
        >
          <p className="text-sm">{error}</p>
          <Button variant="ghost" onClick={() => setError("")}>
            Dismiss
          </Button>
        </div>
      )}
      {busy && !call && (
        <p
          role="status"
          className="fixed bottom-24 right-4 z-50 rounded border bg-background p-4"
        >
          Preparing call…
        </p>
      )}
      {call && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="call-title"
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-lg space-y-4 rounded-2xl border bg-background p-5 shadow-2xl"
        >
          <h2 id="call-title" className="text-xl font-semibold">
            {call.kind === "video" ? "Video" : "Voice"} call · {call.status}
          </h2>
          <p className="text-sm text-muted-foreground">
            {call.caller_id === "self"
              ? "Calling your connection…"
              : "Your CupidMatch connection is calling."}{" "}
            {connection}
          </p>
          <div
            className={
              call.kind === "video" ? "grid grid-cols-2 gap-2" : "sr-only"
            }
          >
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              aria-label="Your camera"
              className="w-full rounded bg-black"
            />
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              aria-label="Connection’s media"
              className="w-full rounded bg-black"
            />
          </div>
          {call.status === "ringing" && call.caller_id !== "self" ? (
            <div className="flex gap-2">
              <Button disabled={busy} onClick={() => void accept()}>
                Accept
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void end("call_reject")}
              >
                Reject
              </Button>
            </div>
          ) : (
            <Button variant="destructive" onClick={() => void end()}>
              End call
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Calls are not recorded. Close/end the call to stop your camera and
            microphone.
          </p>
        </section>
      )}
    </>
  );
}
