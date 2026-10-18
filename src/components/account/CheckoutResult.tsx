"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
export function CheckoutResult() {
  const [message, setMessage] = useState(""),
    [retry, setRetry] = useState(0),
    [returned, setReturned] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancelled") {
      setMessage(
        "Checkout was cancelled. No paid membership was activated by this page.",
      );
      return;
    }
    if (params.get("checkout") !== "returned") return;
    setReturned(true);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined,
      attempts = 0;
    async function poll() {
      try {
        const r = await fetch(
          `/api/billing/session?session_id=${encodeURIComponent(params.get("session_id") || "")}`,
          { cache: "no-store", signal: controller.signal },
        );
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Checkout status unavailable");
        if (controller.signal.aborted) return;
        setMessage(
          d.synchronized
            ? "Verified provider events have updated your membership. Refresh membership to view current access."
            : `Checkout: ${d.status || "pending"}. Payment: ${d.paymentStatus || "pending"}. Membership awaits a verified provider event.`,
        );
        if (!d.synchronized && ++attempts < 10) timer = setTimeout(poll, 3000);
      } catch (e) {
        if (!controller.signal.aborted) setMessage((e as Error).message);
      }
    }
    setMessage("Checking test checkout…");
    void poll();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [retry]);
  if (!message) return null;
  return (
    <section className="space-y-3 rounded-xl border p-5" aria-live="polite">
      <p>{message}</p>
      {returned && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
            Check again
          </Button>
          <Button onClick={() => window.location.assign("/membership")}>
            Refresh membership
          </Button>
        </div>
      )}
    </section>
  );
}
