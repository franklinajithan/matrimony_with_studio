"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
type Item = {
  id: string;
  member_id: string;
  name: string;
  status: string;
  created_at: string;
  detail: Record<string, string | number | boolean>;
};
const sections = {
  deletion: "Account deletion requests",
  identity: "Identity provider status",
  family: "Family Circle",
  plans: "Future Map sharing",
  calls: "Calls",
  attachments: "Attachments",
  payments: "Payment operations",
};
export function FeatureOperations() {
  const [section, setSection] = useState<keyof typeof sections>("deletion"),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState(""),
    [data, setData] = useState<{ items: Item[]; total: number } | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [reason, setReason] = useState(""),
    [selected, setSelected] = useState<Item | null>(null),
    [busy, setBusy] = useState(false),
    [scopes, setScopes] = useState<string[]>([]),
    [paymentMember, setPaymentMember] = useState(""),
    [charge, setCharge] = useState(""),
    [amount, setAmount] = useState(""),
    [paymentAction, setPaymentAction] = useState("refund"),
    [notice, setNotice] = useState("");
  const paymentRequestId = useRef<string | null>(null);
  useEffect(() => {
    paymentRequestId.current = null;
  }, [paymentMember, charge, amount, reason, paymentAction]);
  useEffect(() => {
    void fetch("/api/admin/workspace-access")
      .then((r) => r.json())
      .then((d) => {
        const p = d.permissions || [];
        setScopes(p);
        setSection(
          p.includes("support")
            ? "deletion"
            : p.includes("moderation")
              ? "identity"
              : "payments",
        );
      })
      .catch(() => {});
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(
        `/api/admin/feature-operations?section=${section}&page=${page}&search=${encodeURIComponent(filter)}`,
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to load operations");
      setData(d);
    } catch (e) {
      setData(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [section, page, filter]);
  useEffect(() => {
    void load();
  }, [load]);
  async function moderate() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/feature-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, id: selected.id, reason }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Action failed");
      setSelected(null);
      setReason("");
      setNotice("Access removed; audit history recorded.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function payment(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm("Submit this operation to Stripe test mode?")) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: paymentMember,
          action: paymentAction,
          reason,
          chargeId: charge || undefined,
          amount: amount ? Math.round(Number(amount) * 100) : undefined,
          requestId: (paymentRequestId.current ??= crypto.randomUUID()),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Provider unavailable");
      setNotice(`Test provider request recorded: ${d.reference}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Feature operations</h1>
        <p className="mt-2 text-muted-foreground">
          Queues for member-controlled features and provider work. Each queue
          enforces its staff scope. Private plans, call media, messages and ID
          documents are not exposed here.
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        {Object.entries(sections)
          .filter(([key]) =>
            scopes.includes(
              key === "deletion"
                ? "support"
                : key === "payments"
                  ? "billing"
                  : "moderation",
            ),
          )
          .map(([key, label]) => (
            <Button
              key={key}
              variant={key === section ? "default" : "outline"}
              onClick={() => {
                setSection(key as typeof section);
                setPage(1);
                setSelected(null);
                setNotice("");
              }}
            >
              {label}
            </Button>
          ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter(search);
          setPage(1);
        }}
      >
        <Input
          maxLength={100}
          aria-label="Search operations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Member name or exact member ID"
        />
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {section === "deletion" && (
        <p className="rounded-lg border p-4 text-sm">
          These requests pause matching immediately. Complete erasure requires a
          reviewed retention policy and an authorised deletion procedure. A
          request is never shown as erased before processing.{" "}
          <Link className="underline" href="/admin/support">
            Open support inbox
          </Link>
          .
        </p>
      )}
      {section === "identity" && (
        <p className="text-sm text-muted-foreground">
          Only provider-confirmed evidence can verify identity. Sandbox results
          grant no live badge. Review and retry documents in the authorised
          Stripe Identity dashboard; this workspace does not store ID images.
        </p>
      )}
      {loading ? (
        <p role="status">Loading queue…</p>
      ) : (
        data && (
          <>
            <p className="text-sm">{data.total} records</p>
            <div className="grid gap-3 md:grid-cols-2">
              {data.items.map((item) => (
                <article
                  className="space-y-3 rounded-xl border p-4"
                  key={item.id}
                >
                  <h2 className="font-semibold">{item.name || "Member"}</h2>
                  <p className="break-all text-xs text-muted-foreground">
                    {item.member_id} · {item.status} ·{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  <dl className="space-y-1 text-sm">
                    {Object.entries(item.detail).map(([k, v]) => (
                      <div key={k} className="break-words">
                        <dt className="inline font-medium">{k}: </dt>
                        <dd className="inline">{String(v ?? "—")}</dd>
                      </div>
                    ))}
                  </dl>
                  {["family", "plans", "calls", "attachments"].includes(
                    section,
                  ) && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setSelected(item);
                        setReason("");
                      }}
                    >
                      {section === "calls"
                        ? "End active call"
                        : section === "attachments"
                          ? "Remove attachment access"
                          : "Revoke access"}
                    </Button>
                  )}
                </article>
              ))}
            </div>
            {data.items.length === 0 && <p>No records match these filters.</p>}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>Page {page}</span>
              <Button
                variant="outline"
                disabled={page * 20 >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )
      )}
      {selected && (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">Confirm action for {selected.name}</h2>
          <label className="block text-sm">
            Audit reason
            <Textarea
              value={reason}
              minLength={10}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <Button
            variant="destructive"
            disabled={busy || reason.trim().length < 10}
            onClick={() => void moderate()}
          >
            Confirm and record audit
          </Button>
          <Button variant="ghost" onClick={() => setSelected(null)}>
            Cancel
          </Button>
        </section>
      )}
      {section === "payments" && (
        <form className="space-y-4 rounded-xl border p-5" onSubmit={payment}>
          <h2 className="text-xl font-semibold">Stripe test operation</h2>
          <p className="text-sm">
            Test mode only. Never enter real charge details. Refunds require the
            member’s matching GBP charge and an available amount.
          </p>
          <label className="block text-sm">
            Member ID
            <Input
              required
              value={paymentMember}
              onChange={(e) => setPaymentMember(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Operation
            <select
              className="block w-full rounded border bg-background p-2"
              value={paymentAction}
              onChange={(e) => setPaymentAction(e.target.value)}
            >
              <option value="refund">Refund test charge</option>
              <option value="cancel_subscription">Cancel renewal</option>
            </select>
          </label>
          {paymentAction === "refund" && (
            <>
              <label className="block text-sm">
                Stripe charge ID
                <Input
                  required
                  value={charge}
                  onChange={(e) => setCharge(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Amount (£ GBP)
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
            </>
          )}
          <label className="block text-sm">
            Reason
            <Textarea
              required
              minLength={10}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <Button disabled={busy} type="submit">
            Submit test operation
          </Button>
        </form>
      )}
    </main>
  );
}
