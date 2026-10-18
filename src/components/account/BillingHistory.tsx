"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
type Invoice = {
  id: string;
  number: string | null;
  status: string;
  created: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  hostedUrl: string | null;
  pdfUrl: string | null;
};
export function BillingHistory() {
  const [cursors, setCursors] = useState<string[]>([]),
    [data, setData] = useState<{
      invoices: Invoice[];
      next: string | null;
    } | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const after = cursors.at(-1);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    void fetch(
      `/api/billing/history${after ? `?after=${encodeURIComponent(after)}` : ""}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Invoice history unavailable");
        if (!controller.signal.aborted) setData(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [after, retry]);
  const money = (n: number, currency: string) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
      n / 100,
    );
  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-semibold">Test invoices and receipts</h2>
      {error ? (
        <p role="alert">
          {error}{" "}
          <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
            Retry
          </Button>
        </p>
      ) : !data ? (
        <p role="status">Loading invoices…</p>
      ) : !data.invoices.length ? (
        <p>No invoices are available.</p>
      ) : (
        <ul className="space-y-3">
          {data.invoices.map((i) => (
            <li key={i.id} className="space-y-1 border-b pb-3">
              <p className="font-medium">
                {i.number || i.id} · {i.status}
              </p>
              <p className="text-sm">
                {new Date(i.created).toLocaleDateString("en-GB")} · Due{" "}
                {money(i.amountDue, i.currency)} · Paid{" "}
                {money(i.amountPaid, i.currency)}
              </p>
              <div className="flex gap-4 text-sm underline">
                {i.hostedUrl && (
                  <a
                    href={i.hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View invoice
                  </a>
                )}
                {i.pdfUrl && (
                  <a href={i.pdfUrl} target="_blank" rel="noopener noreferrer">
                    Download PDF
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={!data || !cursors.length}
          onClick={() => setCursors((v) => v.slice(0, -1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!data?.next}
          onClick={() => {
            if (data?.next) setCursors((v) => [...v, data.next!]);
          }}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
