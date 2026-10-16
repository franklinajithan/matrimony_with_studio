"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Promo = {
  id: string;
  code_hint: string;
  duration_months: number;
  max_redemptions: number;
  redemption_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};
type Redemption = {
  id: string;
  promo_code_id: string;
  user_id: string;
  member_name: string;
  redeemed_at: string;
  trial_ends_at: string;
};
export default function PromoCodesClient() {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [loading, setLoading] = useState(true),
    [copyMessage, setCopyMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null),
    [editLimit, setEditLimit] = useState(100),
    [editExpiry, setEditExpiry] = useState("");
  const [months, setMonths] = useState(6),
    [limit, setLimit] = useState(100),
    [expiry, setExpiry] = useState("");
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [codes, setCodes] = useState<Promo[]>([]),
    [created, setCreated] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/promo-codes", { cache: "no-store" });
      if (!r.ok) throw Error("Could not load codes");
      const data = await r.json();
      setCodes(data.codes || []);
      setRedemptions(data.redemptions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setCreated("");
    setError("");
    try {
      const r = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMonths: months,
          maxRedemptions: limit,
          expiresAt: expiry || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Creation failed");
      setCreated(data.code);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Creation failed");
    } finally {
      setBusy(false);
    }
  }
  async function toggle(id: string, isActive: boolean) {
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/promo-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (!r.ok) throw Error((await r.json()).error || "Could not update code");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update code");
    } finally {
      setBusy(false);
    }
  }
  async function saveLimits() {
    if (!editing) return;
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/promo-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing,
          maxRedemptions: editLimit,
          expiresAt: editExpiry || null,
        }),
      });
      if (!r.ok) throw Error((await r.json()).error || "Could not save limits");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save limits");
    } finally {
      setBusy(false);
    }
  }
  const visible = codes.filter(
    (c) =>
      (status === "all" ||
        (status === "active" ? c.is_active : !c.is_active)) &&
      c.code_hint.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-violet-700">Member growth</p>
        <h1 className="text-3xl font-bold text-slate-900">
          Special invitation codes
        </h1>
        <p className="mt-2 text-slate-600">
          Create limited-use launch codes. New members can enter a code during
          registration.
        </p>
      </div>
      <form
        onSubmit={create}
        className="grid gap-4 rounded-3xl border bg-white p-6 shadow-sm md:grid-cols-3"
      >
        <label className="text-sm font-medium">
          Trial duration (months)
          <Input
            type="number"
            min={1}
            max={24}
            required
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          />
        </label>
        <label className="text-sm font-medium">
          Maximum redemptions
          <Input
            type="number"
            min={1}
            max={100000}
            required
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </label>
        <label className="text-sm font-medium">
          Expiry date (optional)
          <Input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </label>
        <div className="md:col-span-3">
          <Button disabled={busy} type="submit">
            {busy ? "Creating…" : "Generate secure code"}
          </Button>
        </div>
      </form>
      {created && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
        >
          <p className="font-semibold">
            New code — copy it now; it will not be shown again
          </p>
          <p className="my-3 break-all font-mono text-xl">{created}</p>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard
                .writeText(created)
                .then(() => setCopyMessage("Code copied."))
                .catch(() =>
                  setCopyMessage(
                    "Copy is unavailable. Select the code above to copy it manually.",
                  ),
                );
            }}
          >
            Copy code
          </Button>
          <p role="status" className="mt-2 text-sm">
            {copyMessage}
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      <section className="space-y-4 rounded-3xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Generated codes</h2>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            aria-label="Search invitation code hints"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code hint"
          />
          <label className="flex items-center gap-2 text-sm">
            Status
            <select
              className="h-10 flex-1 rounded-md border bg-white px-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All codes</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p role="status">Loading invitation codes…</p>
        ) : visible.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">
            No matching invitation codes.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((c) => (
              <article key={c.id} className="space-y-3 rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="break-all font-mono font-semibold">
                    {c.code_hint}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {c.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="text-sm">
                  {c.duration_months} months · {c.redemption_count} /{" "}
                  {c.max_redemptions} used
                </p>
                <p className="text-xs text-slate-500">
                  {c.expires_at
                    ? `Expires ${new Date(c.expires_at).toLocaleDateString("en-GB")}`
                    : "No expiry"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void toggle(c.id, !c.is_active)}
                  >
                    {c.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setEditing(c.id);
                      setEditLimit(c.max_redemptions);
                      setEditExpiry(
                        c.expires_at ? c.expires_at.slice(0, 10) : "",
                      );
                    }}
                  >
                    Edit limits
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">
          Search and status filters apply to the code records returned by the
          server.
        </p>
      </section>
      {editing && (
        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <h2 className="text-lg font-bold">Edit promotion limits</h2>
          <p className="mt-1 text-xs text-slate-600">
            Changes are audited. The limit cannot be lower than existing
            redemptions.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Maximum redemptions
              <Input
                type="number"
                min={codes.find((c) => c.id === editing)?.redemption_count || 1}
                max={100000}
                value={editLimit}
                onChange={(e) => setEditLimit(Number(e.target.value))}
              />
            </label>
            <label className="text-sm font-medium">
              Expiry (blank = none)
              <Input
                type="date"
                value={editExpiry}
                onChange={(e) => setEditExpiry(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <Button disabled={busy} onClick={() => void saveLimits()}>
              Save changes
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
          </div>
        </section>
      )}
      <section className="rounded-3xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Recent redemptions</h2>
        <p className="mt-1 text-xs text-slate-500">
          Latest 100 redemptions. Only administrators can view these records.
        </p>
        {redemptions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No codes redeemed yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {redemptions.map((r) => (
              <div key={r.id} className="rounded-xl border p-4">
                <p className="font-semibold">{r.member_name}</p>
                <p className="text-xs text-slate-500">
                  Code:{" "}
                  {codes.find((c) => c.id === r.promo_code_id)?.code_hint ||
                    "Unknown"}
                </p>
                <p className="mt-2 text-sm">
                  Redeemed {new Date(r.redeemed_at).toLocaleDateString("en-GB")}
                </p>
                <p className="text-sm">
                  Trial ends{" "}
                  {new Date(r.trial_ends_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <p className="text-sm text-amber-800">
        Codes can be redeemed after mobile verification. A six-month code
        replaces the standard three-month offer; it does not add another six
        months.
      </p>
    </div>
  );
}
