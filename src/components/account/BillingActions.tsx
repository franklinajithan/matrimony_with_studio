"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PLANS, type BillingTerm } from "@/lib/subscriptions/plans";
export function BillingActions({
  hasProvider = false,
  cancelling = false,
  hasSubscription = hasProvider,
}: {
  hasProvider?: boolean;
  cancelling?: boolean;
  hasSubscription?: boolean;
}) {
  const [enabled, setEnabled] = useState(false),
    [plan, setPlan] = useState<"premium" | "premium_plus">("premium"),
    [term, setTerm] = useState<BillingTerm>("monthly"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const requestId = useRef<string | null>(null);
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("plan");
    if (selected === "premium" || selected === "premium_plus")
      setPlan(selected);
    void fetch("/api/billing/config")
      .then((r) => r.json())
      .then((d) => setEnabled(d.configured === true))
      .catch(() =>
        setError(
          "Billing availability could not be checked. Refresh to retry.",
        ),
      );
  }, []);
  async function action(name: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      requestId.current ??= crypto.randomUUID();
      const r = await fetch(`/api/billing/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          term,
          cancel: !cancelling,
          requestId: requestId.current,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Billing unavailable");
      if (d.url) {
        const url = new URL(d.url);
        if (
          url.protocol !== "https:" ||
          !["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname)
        )
          throw new Error("Invalid provider URL");
        window.location.assign(url.href);
      } else {
        requestId.current = null;
        setNotice(
          d.message ||
            "Provider request accepted. Refresh your membership after the provider event arrives.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-semibold">Subscription and billing</h2>
      <p className="text-sm text-muted-foreground">
        {enabled
          ? "Sandbox checkout only. Use Stripe test payment details; no real payment is taken. Membership changes require a verified webhook."
          : "Checkout is unavailable until Stripe test-mode setup and verification are complete. No payment will be taken."}
      </p>
      {hasProvider ? (
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!enabled || busy}
            onClick={() => void action("portal")}
          >
            Open test billing portal
          </Button>
          <Button
            variant="outline"
            disabled={!enabled || busy}
            onClick={() => {
              if (
                window.confirm(
                  cancelling
                    ? "Resume subscription renewal?"
                    : "Cancel renewal at the end of the current paid period?",
                )
              )
                void action("cancel");
            }}
          >
            {cancelling ? "Resume renewal" : "Cancel renewal"}
          </Button>
        </div>
      ) : null}
      {!hasSubscription && (
        <>
          <label className="block text-sm">
            Plan
            <select
              className="block w-full rounded border bg-background p-2"
              value={plan}
              onChange={(e) => {
                setPlan(e.target.value as typeof plan);
                requestId.current = null;
              }}
            >
              <option value="premium">Premium</option>
              <option value="premium_plus">Premium+</option>
            </select>
          </label>
          <label className="block text-sm">
            Billing period
            <select
              className="block w-full rounded border bg-background p-2"
              value={term}
              onChange={(e) => {
                setTerm(e.target.value as BillingTerm);
                requestId.current = null;
              }}
            >
              <option value="monthly">Every month</option>
              <option value="three_months">Every three months</option>
              <option value="six_months">Every six months</option>
            </select>
          </label>
          <p className="font-medium">
            £{(PLANS[plan].pricesPence[term] / 100).toFixed(2)} GBP per billing
            period
          </p>
          <Button
            disabled={!enabled || busy}
            onClick={() => void action("checkout")}
          >
            {busy ? "Opening…" : "Continue to Stripe test checkout"}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Prices are recurring GBP charges per selected period. Stripe promotion
        codes can be entered at checkout. Invitation codes for introductory
        offers are separate. Only authorised test accounts can use billing
        during setup.
      </p>
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
    </section>
  );
}
