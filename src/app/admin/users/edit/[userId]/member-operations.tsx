"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, LockKeyhole, ShieldAlert } from "lucide-react";

type Connection = { id: string; memberId: string; displayName: string; connectedAt: string };
type Subscription = { id: string; plan_code: string; status: string; provider: string | null; current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean; created_at: string };
type Operations = { connections: Connection[]; subscriptions: Subscription[]; connectionsShown: number; connectionsLimit: number; paymentHistoryAvailable: boolean };
const date = (value: string | null) => value ? new Date(value).toLocaleDateString("en-GB") : "Not available";

export function MemberOperations({ memberId }: { memberId: string }) {
  const [data, setData] = useState<Operations | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  async function sendReset() {
    if (!window.confirm("Send a password reset email to this member?")) return;
    setResetting(true); setResetMessage("");
    try {
      const response = await fetch("/api/admin/member-password-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to request reset");
      setResetMessage("Password reset email requested. Delivery depends on the configured email service.");
    } catch (err) { setResetMessage(err instanceof Error ? err.message : "Unable to request reset"); }
    finally { setResetting(false); }
  }
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/member-operations?memberId=${encodeURIComponent(memberId)}`, { cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("Member operations unavailable"); return response.json(); })
      .then(payload => { if (active) setData(payload); })
      .catch(() => { if (active) setError("Could not load connections and subscriptions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [memberId]);
  if (loading) return <Card><CardContent className="p-6" role="status">Loading member operations…</CardContent></Card>;
  if (error || !data) return <Card><CardContent className="p-6 text-sm text-red-700" role="alert">{error || "Unavailable"}</CardContent></Card>;
  const active = data.subscriptions.find(s => ["active", "trialing"].includes(s.status));
  return <div className="grid gap-4 lg:grid-cols-2">
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-violet-700" />Connections ({data.connectionsShown}{data.connectionsShown === data.connectionsLimit ? "+" : ""})</CardTitle><CardDescription>Connected members and connection dates. Up to 100 recent connections are displayed.</CardDescription></CardHeader>
      <CardContent>{data.connections.length === 0 ? <p className="text-sm text-slate-500">No connections found.</p> :
        <ul className="divide-y">{data.connections.map(c => <li key={c.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0"><p className="truncate font-medium">{c.displayName}</p><p className="text-xs text-slate-500">Connected {date(c.connectedAt)}</p></div>
          <Button variant="outline" size="sm" asChild><Link href={`/admin/users/edit/${c.memberId}`}>View</Link></Button>
        </li>)}</ul>}
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><ShieldAlert className="h-4 w-4" />Connection removal and member blocking require audited moderation actions.</p>
      </CardContent>
    </Card>
    <div className="space-y-4">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-violet-700" />Subscription status</CardTitle><CardDescription>Recorded subscription periods; this is not a payment receipt.</CardDescription></CardHeader><CardContent>
        {active ? <div className="space-y-2 text-sm"><p className="text-lg font-bold capitalize">{active.plan_code} · {active.status}</p><p>Period start: {date(active.current_period_start)}</p><p>Period end: {date(active.current_period_end)}</p><p>Renewal: {active.cancel_at_period_end ? "Set to cancel at period end" : "Not marked for cancellation"}</p></div> : <p className="text-sm text-slate-500">No active subscription recorded.</p>}
        <h3 className="mt-5 border-t pt-4 text-sm font-semibold">Subscription history</h3>
        {data.subscriptions.length === 0 ? <p className="mt-2 text-sm text-slate-500">No subscription records.</p> :
          <ul className="mt-2 divide-y">{data.subscriptions.map(s => <li key={s.id} className="py-3 text-sm"><p className="font-semibold capitalize">{s.plan_code} · {s.status}</p><p className="text-xs text-slate-500">{date(s.current_period_start)} – {date(s.current_period_end)}</p></li>)}</ul>}
        <p className="mt-3 text-xs text-slate-500">Payment transactions, amounts paid and total paid months require verified payment-provider records. Subscription periods alone do not prove payment.</p>
      </CardContent></Card>
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-violet-700" />Account security</CardTitle></CardHeader><CardContent><p className="text-sm text-slate-600">Passwords cannot be viewed or edited here. Use a reset email rather than changing or viewing a member password.</p><Button variant="outline" className="mt-3" disabled={resetting} onClick={() => void sendReset()}>{resetting ? "Requesting…" : "Send password reset email"}</Button>{resetMessage && <p role="status" className="mt-2 text-sm">{resetMessage}</p>}</CardContent></Card>
    </div>
  </div>;
}
