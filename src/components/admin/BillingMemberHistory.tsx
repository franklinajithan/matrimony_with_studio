"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
type Data = {
  invoices: {
    id: string;
    number: string;
    status: string;
    amountPaid: number;
    currency: string;
    hostedUrl: string | null;
  }[];
  charges: {
    id: string;
    amount: number;
    available: number;
    currency: string;
    paid: boolean;
    status: string;
  }[];
  next: string | null;
  subscription: { status: string; cancel_at_period_end: boolean } | null;
};
export function BillingMemberHistory({
  memberId,
  selectCharge,
}: {
  memberId: string;
  selectCharge: (id: string, amount: string) => void;
}) {
  const [loadedMember, setLoadedMember] = useState(""),
    [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const generation = useRef(0);
  async function load(after?: string) {
    const current = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        `/api/admin/payments?memberId=${encodeURIComponent(memberId)}${after ? `&after=${encodeURIComponent(after)}` : ""}`,
        { cache: "no-store" },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Billing unavailable");
      if (current === generation.current) {
        setData(d);
        setLoadedMember(memberId);
      }
    } catch (e) {
      if (current === generation.current) {
        setError((e as Error).message);
        setData(null);
      }
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  const visible = loadedMember === memberId ? data : null;
  return (
    <section className="space-y-3 rounded border p-3">
      <h3 className="font-semibold">Member billing history</h3>
      <p className="text-xs">
        Reads are restricted to Super Admin and audited. Latest ten charges are
        shown. No card details are stored here.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={busy || !memberId}
        onClick={() => void load()}
      >
        {busy ? "Loading…" : "Load test billing history"}
      </Button>
      {error && <p role="alert">{error}</p>}
      {visible && (
        <>
          <p>
            Subscription: {visible.subscription?.status || "None"}
            {visible.subscription?.cancel_at_period_end
              ? " · Renewal cancelled"
              : ""}
          </p>
          <ul className="space-y-2">
            {visible.invoices.map((i) => (
              <li key={i.id}>
                {i.number || i.id} · {i.status} · Paid{" "}
                {(i.amountPaid / 100).toFixed(2)} {i.currency.toUpperCase()}{" "}
                {i.hostedUrl && (
                  <a
                    className="underline"
                    href={i.hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Invoice
                  </a>
                )}
              </li>
            ))}
          </ul>
          {!visible.invoices.length && <p>No invoices.</p>}
          {visible.next && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void load(visible.next!)}
            >
              Older invoices
            </Button>
          )}
          <ul className="space-y-2">
            {visible.charges.map((c) => (
              <li key={c.id} className="break-all text-sm">
                {c.id} · {c.status} · Amount {(c.amount / 100).toFixed(2)}{" "}
                {c.currency.toUpperCase()} · Refundable{" "}
                {(c.available / 100).toFixed(2)}{" "}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!c.paid || c.currency !== "gbp" || c.available <= 0}
                  onClick={() =>
                    selectCharge(c.id, (c.available / 100).toFixed(2))
                  }
                >
                  Select charge
                </Button>
              </li>
            ))}
          </ul>
          {!visible.charges.length && <p>No charges.</p>}
        </>
      )}
    </section>
  );
}
