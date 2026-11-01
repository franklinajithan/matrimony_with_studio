"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
type Status = "pending" | "reviewing" | "resolved" | "dismissed";
type Report = { id: string; reporter_id: string; reported_id: string; reason: string; description: string | null; status: Status; created_at: string };
const statuses: Status[] = ["pending", "reviewing", "resolved", "dismissed"];
export default function ReportsClient() {
  const [filter, setFilter] = useState<Status | "">("pending"); const [offset, setOffset] = useState(0);
  const [reports, setReports] = useState<Report[]>([]); const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState<string | null>(null);
  const pending = useRef(false); const [refresh, setRefresh] = useState(0); const { toast } = useToast();
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setReports([]);
    const params = new URLSearchParams({ offset: String(offset) }); if (filter) params.set("status", filter);
    void fetch(`/api/admin/reports?${params}`, { signal: controller.signal, cache: "no-store" }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load reports");
      if (!controller.signal.aborted) setReports(data.reports);
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load reports"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, offset, refresh]);
  async function update(report: Report, status: Status) {
    if (pending.current || report.status === status) return; pending.current = true; setBusy(report.id);
    try {
      const response = await fetch("/api/admin/reports", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: report.id, status, expectedStatus: report.status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not update report");
      toast({ title: "Report updated" }); setRefresh(value => value + 1);
    } catch (error) { toast({ title: "Could not update report", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
    finally { pending.current = false; setBusy(null); }
  }
  return <div className="space-y-5"><h1 className="font-headline text-3xl text-primary">Member reports</h1>
    <p className="text-muted-foreground">Review reports, inspect the member account and record a moderation decision. Reports alone do not automatically suspend a member.</p>
    <div><Label htmlFor="report-status-filter">Status</Label><select id="report-status-filter" className="ml-3 min-h-11 rounded-md border bg-background px-3" value={filter} disabled={busy !== null} onChange={event => { setOffset(0); setFilter(event.target.value as Status | ""); }}>
      <option value="">All statuses</option>{statuses.map(status => <option key={status} value={status}>{status}</option>)}
    </select></div>
    {loading ? <p role="status">Loading reports…</p> : error ? <div role="alert">{error} <Button type="button" variant="outline" onClick={() => setRefresh(value => value + 1)}>Retry</Button></div> : reports.length === 0 ? <p>No reports in this view.</p> : reports.map(report => <Card key={report.id}>
      <CardHeader><CardTitle className="text-lg">{report.reason.replaceAll("_", " ")}</CardTitle><p className="text-sm text-muted-foreground">{new Date(report.created_at).toLocaleString()} · {report.status}</p></CardHeader>
      <CardContent className="space-y-3"><p className="whitespace-pre-wrap break-words">{report.description || "No additional details supplied."}</p>
        <div className="flex flex-wrap gap-3 text-sm"><Link className="underline" href={`/admin/users/edit/${report.reported_id}`}>Review reported member</Link><Link className="underline" href={`/admin/users/edit/${report.reporter_id}`}>Review reporter</Link></div>
        <Label htmlFor={`report-status-${report.id}`}>Review status</Label><select id={`report-status-${report.id}`} className="ml-3 min-h-11 rounded-md border bg-background px-3" value={report.status} disabled={busy !== null} onChange={event => void update(report, event.target.value as Status)}>
          {statuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select>{busy === report.id && <span role="status" className="ml-2 text-sm">Saving…</span>}
      </CardContent>
    </Card>)}
    <div className="flex gap-2"><Button type="button" variant="outline" disabled={loading || busy !== null || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 20))}>Previous</Button>
      <Button type="button" variant="outline" disabled={loading || busy !== null || !!error || reports.length < 20} onClick={() => setOffset(value => value + 20)}>Next</Button></div>
  </div>;
}
