"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
type State = {
  enabled?: boolean;
  status: string;
  identityVerified: boolean;
  testMode?: boolean;
  errorCode?: string;
};
export function IdentityVerification() {
  const [data, setData] = useState<State | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [consent, setConsent] = useState(false);
  const requestId = useRef<string | null>(null);
  const load = useCallback(async () => {
    const r = await fetch("/api/identity/status");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Status unavailable");
    setData(d);
  }, []);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function start() {
    setBusy(true);
    setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      const r = await fetch("/api/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent, requestId: requestId.current }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Provider unavailable");
      if (
        typeof d.url !== "string" ||
        new URL(d.url).hostname !== "verify.stripe.com"
      )
        throw new Error("Provider did not return a valid verification link");
      window.location.assign(d.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-semibold">Optional government-ID verification</h2>
      <p className="text-sm">Government-ID verification is optional during setup. It is not required for registration, matching or messages.</p>
      {data && !data.enabled && <p role="status">Provider verification is currently unavailable. You can continue using your account.</p>}
      <p className="text-sm text-muted-foreground">
        Separate from profile review and mobile verification. Stripe Identity
        handles document and selfie collection. CupidMatch stores the session
        reference and result, not your identity-document images.
      </p>
      {data && (
        <p role="status">
          Status: {data.status?.replaceAll("_", " ")}
          {data.testMode ? " · sandbox test result" : ""}.{" "}
          {data.identityVerified
            ? "Identity verified."
            : "No live identity-verification badge has been granted."}
        </p>
      )}
      {data?.errorCode && (
        <p className="text-sm">
          The provider needs another submission:{" "}
          {data.errorCode.replaceAll("_", " ")}. Reopen the provider flow to
          retry.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          disabled={!data?.enabled || busy}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        I choose to share my ID and selfie with Stripe Identity for verification
        and understand that this flow is currently restricted to test mode.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={
            busy ||
            !data?.enabled ||
            !consent ||
            data?.status === "processing" ||
            data?.status === "verified"
          }
          onClick={() => void start()}
        >
          {busy
            ? "Opening provider…"
            : data?.status === "requires_input"
              ? "Retry with provider"
              : "Start test verification"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void load().catch((e) => setError(e.message))}
        >
          Refresh status
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Provider setup and sandbox acceptance are required before availability.
        A sandbox result never grants a live verified badge.
      </p>
    </section>
  );
}
