"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, RefreshCw } from "lucide-react";

type VerificationRequest = { id: string; member_id: string; member_note: string; created_at: string };
type ReviewProfile = { id: string; display_name: string | null; created_at: string | null };
export default function AdminVerificationsPage() {
  const [profiles, setProfiles] = useState<ReviewProfile[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewError, setReviewError] = useState("");
  async function decide(requestId: string, decision: "approved" | "rejected") {
    if (reviewing) return;
    setReviewing(requestId); setReviewError("");
    try {
      const response = await fetch("/api/admin/verification-decisions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, decision, note: reviewNote }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save review");
      setReviewNote("");
      await refresh();
    } catch (err) { setReviewError(err instanceof Error ? err.message : "Unable to save review"); }
    finally { setReviewing(null); }
  }
  async function refresh() {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/admin/verification-backlog", { cache: "no-store" });
      if (!response.ok) throw new Error("Unavailable");
      const payload = await response.json();
      if (!Array.isArray(payload.profiles)) throw new Error("Invalid response");
      setProfiles(payload.profiles);
      if (!Array.isArray(payload.requests)) throw new Error('Invalid requests');
      setRequests(payload.requests);
    } catch {
      setProfiles([]);
      setRequests([]);
      setError(true);
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">Profile verification backlog</h1>
      <Button variant="outline" asChild><Link href="/admin">Back to dashboard</Link></Button>
    </div>
    <Card>
      <CardHeader><CardTitle>Submitted verification requests</CardTitle><CardDescription>Actual member-submitted requests, oldest first. Review only; approval requires an audited workflow.</CardDescription></CardHeader>
      <CardContent><p className="mb-3 text-sm text-muted-foreground">Approval confirms profile review only. It does not verify government identity documents or set an identity-verified badge.</p><label htmlFor="review-note" className="text-sm font-medium">Reviewer note (applies to the next decision)</label><Textarea id="review-note" value={reviewNote} onChange={event => setReviewNote(event.target.value)} maxLength={1000} className="mb-3" />{reviewError && <p role="alert" className="mb-3 text-sm text-destructive">{reviewError}</p>}{loading ? <p>Loading requests…</p> : error ? <p role="alert">Requests unavailable.</p> : requests.length === 0 ? <p>No pending member requests.</p> :
        <ul className="divide-y" data-testid="admin-submitted-verification-requests">{requests.map(request => <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">Member: {request.member_id}</p><p className="text-sm">{request.member_note || 'No note supplied'}</p><p className="text-xs text-muted-foreground">Submitted {new Date(request.created_at).toLocaleDateString('en-GB')}</p></div><Button variant="outline" asChild><Link href={`/admin/users/edit/${request.member_id}`}>Review member</Link></Button><Button disabled={reviewing !== null} onClick={() => void decide(request.id, "approved")}>Approve profile review</Button><Button variant="destructive" disabled={reviewing !== null} onClick={() => void decide(request.id, "rejected")}>Reject</Button></li>)}</ul>}
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Unverified published profiles</CardTitle>
        <CardDescription>Read-only review queue, oldest first (up to 100). These profiles have not necessarily submitted identity documents. Do not treat this list as proof of identity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        {loading ? <p role="status">Loading profiles…</p> :
          error ? <p role="alert">Unable to load the verification backlog. Please retry.</p> :
          profiles.length === 0 ? <p>No published unverified profiles found.</p> :
          <ul className="divide-y" data-testid="admin-verification-backlog">
            {profiles.map(profile => <li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div><p className="font-medium">{profile.display_name || "Unnamed member"}</p>
                <p className="text-xs text-muted-foreground">Joined: {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB") : "Unknown"}</p></div>
              <Button variant="outline" asChild><Link href={`/admin/users/edit/${profile.id}`}>Review profile</Link></Button>
            </li>)}
          </ul>}
      </CardContent>
    </Card>
  </div>;
}
