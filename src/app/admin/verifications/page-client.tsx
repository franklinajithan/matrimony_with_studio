"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { ShieldCheck, RefreshCw } from "lucide-react";

type VerificationRequest = { id: string; member_id: string; member_note: string | null; created_at: string };
type ReviewProfile = { id: string; display_name: string | null; created_at: string | null };
type Queue = { profiles: ReviewProfile[]; requests: VerificationRequest[]; hasMoreProfiles: boolean; hasMoreRequests: boolean };
type Review = { request: VerificationRequest; decision: "approved" | "rejected" };
const emptyQueue: Queue = { profiles: [], requests: [], hasMoreProfiles: false, hasMoreRequests: false };
const pageSize = 20;

export default function AdminVerificationsPage() {
  const [queue, setQueue] = useState<Queue>(emptyQueue);
  const [profileOffset, setProfileOffset] = useState(0);
  const [requestOffset, setRequestOffset] = useState(0);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [note, setNote] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setQueue(emptyQueue);
    void fetch(`/api/admin/verification-backlog?profileOffset=${profileOffset}&requestOffset=${requestOffset}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok || !Array.isArray(payload.profiles) || !Array.isArray(payload.requests)
          || typeof payload.hasMoreProfiles !== "boolean" || typeof payload.hasMoreRequests !== "boolean") throw new Error("Invalid queue response");
        if (!controller.signal.aborted) setQueue(payload);
      })
      .catch(() => { if (!controller.signal.aborted) setError("Unable to load the verification backlog. Please retry."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [profileOffset, requestOffset, reload]);

  function refresh() {
    if (mutationLock.current) return;
    setReview(null); setNote(""); setReviewError("");
    // Pending rows can move after another reviewer acts. Restart at the oldest.
    setRequestOffset(0); setProfileOffset(0); setReload(value => value + 1);
  }
  function beginReview(request: VerificationRequest, decision: Review["decision"]) {
    if (mutationLock.current) return;
    setReview({ request, decision }); setNote(""); setReviewError(""); setSuccess("");
  }
  async function save() {
    if (!review || mutationLock.current || note.trim().length < 10 || note.trim().length > 1000) return;
    mutationLock.current = true; setBusy(true); setReviewError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/verification-decisions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: review.request.id, decision: review.decision, note: note.trim() }),
      });
      const payload = await response.json();
      if (!alive.current) return;
      if (!response.ok) {
        if (response.status === 409 || response.status === 404) {
          setReview(null); setNote("");
          setRequestOffset(0); setReload(value => value + 1);
          setReviewError(payload.error || "Request changed. Review the refreshed queue.");
          return;
        }
        throw new Error(payload.error || "Unable to save review. Refresh the queue before retrying.");
      }
      if (payload.review?.id !== review.request.id || payload.review?.status !== review.decision)
        throw new Error("Unable to confirm review. Refresh the queue before retrying.");
      setReview(null); setNote("");
      setSuccess("Profile review saved and recorded in the audit log.");
      setRequestOffset(0); setReload(value => value + 1);
    } catch (err) {
      if (alive.current) setReviewError(err instanceof Error ? err.message : "Unable to confirm review. Refresh the queue before retrying.");
    } finally {
      mutationLock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const disabled = loading || busy || !!review;
  return <div className="space-y-6 pb-12">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">Profile verification backlog</h1>
      <Button variant="outline" asChild><Link href="/admin">Back to dashboard</Link></Button>
      <Button variant="outline" onClick={refresh} disabled={loading || busy || !!review}><RefreshCw className="mr-2 h-4 w-4" />Refresh queues</Button>
    </div>
    {success && <p role="status">{success}</p>}
    {reviewError && !review && <p role="alert" className="text-destructive">{reviewError}</p>}
    {error && <div><p role="alert" className="text-destructive">{error}</p><Button variant="outline" onClick={refresh}>Try again</Button></div>}
    <Card>
      <CardHeader><CardTitle>Submitted verification requests</CardTitle><CardDescription>Member-submitted requests, oldest first. Read the member profile before recording your review.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Approval confirms profile review only. It does not verify government identity documents or set an identity-verified badge.</p>
        {loading ? <p role="status">Loading requests…</p> : error ? null : queue.requests.length === 0 ? <p>No pending member requests on this page.</p> :
          <ul className="divide-y" data-testid="admin-submitted-verification-requests">{queue.requests.map(request => <li key={request.id} className="space-y-3 py-4">
            <div><p className="break-all font-medium">Member: {request.member_id}</p><p className="whitespace-pre-wrap break-words text-sm">{request.member_note || "No note supplied"}</p><p className="text-xs text-muted-foreground">Submitted {new Date(request.created_at).toLocaleString("en-GB")}</p></div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href={`/admin/users/edit/${request.member_id}`}>Review member</Link></Button><Button disabled={busy || !!review} onClick={() => beginReview(request, "approved")}>Approve profile review</Button><Button variant="destructive" disabled={busy || !!review} onClick={() => beginReview(request, "rejected")}>Reject</Button></div>
          </li>)}</ul>}
        <nav aria-label="Submitted request pages" className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={disabled || !!error || requestOffset === 0} onClick={() => setRequestOffset(value => Math.max(0, value - pageSize))}>Previous requests</Button><span className="text-sm">Page {requestOffset / pageSize + 1}</span><Button variant="outline" disabled={disabled || !!error || !queue.hasMoreRequests} onClick={() => setRequestOffset(value => value + pageSize)}>Next requests</Button>
        </nav>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Unverified published profiles</CardTitle><CardDescription>Read-only queue, oldest first. These members have not necessarily submitted identity documents.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {loading ? <p role="status">Loading profiles…</p> : error ? null : queue.profiles.length === 0 ? <p>No published unverified profiles on this page.</p> :
          <ul className="divide-y" data-testid="admin-verification-backlog">{queue.profiles.map(profile => <li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{profile.display_name || "Unnamed member"}</p><p className="text-xs text-muted-foreground">Joined: {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB") : "Unknown"}</p></div><Button variant="outline" asChild><Link href={`/admin/users/edit/${profile.id}`}>Review profile</Link></Button></li>)}</ul>}
        <nav aria-label="Unverified profile pages" className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={disabled || !!error || profileOffset === 0} onClick={() => setProfileOffset(value => Math.max(0, value - pageSize))}>Previous profiles</Button><span className="text-sm">Page {profileOffset / pageSize + 1}</span><Button variant="outline" disabled={disabled || !!error || !queue.hasMoreProfiles} onClick={() => setProfileOffset(value => value + pageSize)}>Next profiles</Button>
        </nav>
      </CardContent>
    </Card>
    <AlertDialog open={!!review} onOpenChange={open => { if (!open && !mutationLock.current) { setReview(null); setNote(""); setReviewError(""); } }}>
      {review && <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
        <AlertDialogHeader><AlertDialogTitle>Confirm {review.decision === "approved" ? "approval" : "rejection"} of profile review</AlertDialogTitle><AlertDialogDescription className="break-all">Member: {review.request.member_id}. This records your review decision and reason. Approval does not verify government identity documents.</AlertDialogDescription></AlertDialogHeader>
        <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm">{review.request.member_note || "No member note supplied"}</p>
        <Label htmlFor="verification-review-note">Review reason (10–1000 characters)</Label>
        <Textarea id="verification-review-note" value={note} disabled={busy} onChange={event => setNote(event.target.value)} maxLength={1000} />
        {reviewError && <p role="alert" className="text-sm text-destructive">{reviewError}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><Button variant={review.decision === "rejected" ? "destructive" : "default"} disabled={busy || note.trim().length < 10 || note.trim().length > 1000} onClick={() => void save()}>{busy ? "Saving…" : "Confirm profile review"}</Button></AlertDialogFooter>
      </AlertDialogContent>}
    </AlertDialog>
  </div>;
}
