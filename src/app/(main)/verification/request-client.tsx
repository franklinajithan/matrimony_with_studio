"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { VerificationStatus } from "@/lib/auth/verification-status";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type VerificationRequest = { id: string; status: "pending" | "approved" | "rejected"; member_note: string; created_at: string; reviewed_at: string | null };

export default function VerificationRequestClient() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/verification-requests", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load your requests.");
      const payload = await response.json();
      if (!Array.isArray(payload.requests)) throw new Error("Unexpected server response.");
      setRequests(payload.requests);
      setStatus(payload.verification ?? null);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void refresh(); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || requests.some(request => request.status === "pending")) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/verification-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to submit verification request.");
      setNote("");
      setNotice("Your verification request has been submitted.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const pending = requests.some(request => request.status === "pending");
  return <div className="mx-auto max-w-3xl space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">Account verification</h1>
      <Button asChild variant="outline"><Link href="/settings">Back to settings</Link></Button>
    </div>
    <Card>
      <CardHeader><CardTitle>Your verification status</CardTitle><CardDescription>Each check records a different kind of evidence.</CardDescription></CardHeader>
      <CardContent>
        {loading ? <p role="status">Loading verification status…</p> : status ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="font-medium">Email confirmed</dt><dd className="text-muted-foreground">{status.emailConfirmed ? "Confirmed" : "Awaiting confirmation"}</dd></div>
            <div><dt className="font-medium">Phone confirmed</dt><dd className="text-muted-foreground">{status.phoneConfirmed ? "Confirmed" : <Link href="/verify-phone" className="underline">Confirm a phone number</Link>}</dd></div>
            <div><dt className="font-medium">Profile reviewed</dt><dd className="text-muted-foreground">{status.profileReviewed ? "Approved by a profile reviewer" : "No current approved review"}</dd></div>
            <div><dt className="font-medium">Identity checked</dt><dd className="text-muted-foreground">{status.identityChecked === null ? "Identity checks are unavailable" : "Checked"}</dd></div>
          </dl>
        ) : <p>Verification status is unavailable. Refresh status to try again.</p>}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Request profile verification</CardTitle>
        <CardDescription>Ask an administrator to review your profile. Keep identity documents and document numbers out of your note.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="verification-note" className="text-sm font-medium">Additional information (optional)</label>
          <Textarea id="verification-note" value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={4} disabled={loading || submitting || pending} data-testid="verification-request-note" />
          <Button type="submit" disabled={loading || submitting || pending} data-testid="submit-verification-request">{submitting ? "Submitting…" : pending ? "Request pending" : "Submit request"}</Button>
        </form>
        {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>Request history</CardTitle><CardDescription>Track the status of your submitted requests.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>Refresh status</Button>
        {loading ? <p role="status">Loading your requests…</p> :
          requests.length === 0 ? <p>No verification requests yet.</p> :
          <ul className="divide-y" data-testid="verification-request-history">
            {requests.map(request => <li key={request.id} className="py-3">
              <p className="font-medium capitalize">{request.status}</p>
              <p className="text-sm text-muted-foreground">Submitted {new Date(request.created_at).toLocaleDateString("en-GB")}</p>
              {request.member_note && <p className="mt-1 text-sm">{request.member_note}</p>}
            </li>)}
          </ul>}
      </CardContent>
    </Card>
  </div>;
}
