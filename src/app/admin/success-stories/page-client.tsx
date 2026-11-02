"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
type Status = "pending" | "approved" | "rejected";
type Story = { id: string; couple_names: string; story_text: string; status: Status; submitted_at: string };
export default function AdminSuccessStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter] = useState<Status | "">("pending"); const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [reload, setReload] = useState(0); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [review, setReview] = useState<{story: Story; status: Status} | null>(null); const [note, setNote] = useState("");
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setStories([]);
    void fetch(`/api/admin/success-stories?status=${filter}&offset=${offset}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok || !Array.isArray(body.stories)) throw Error(body.error || "Could not load stories"); if (!controller.signal.aborted) setStories(body.stories); })
      .catch(() => { if (!controller.signal.aborted) setError("Stories unavailable. Try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, offset, reload]);
  async function save() {
    if (!review || lock.current || note.trim().length < 10) return;
    lock.current = true; setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/success-stories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: review.story.id, expectedStatus: review.story.status, status: review.status, note: note.trim() }) });
      const body = await response.json(); if (!response.ok) throw Error(body.error || "Could not save review");
      setReview(null); setNote(""); setSuccess("Review saved and recorded in the audit log."); setReload(value => value + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save review"); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="space-y-6 pb-12">
    <div><h1 className="text-3xl font-bold">Success story moderation</h1><p className="mt-2 text-sm text-muted-foreground">Read the complete submission before approving publication. Rejection or return to pending removes public approval.</p></div>
    <div className="flex flex-wrap items-center gap-3"><Label htmlFor="story-filter">Status</Label><select id="story-filter" className="min-h-11 rounded-md border bg-background px-3" value={filter} disabled={busy || !!review} onChange={event => { setOffset(0); setFilter(event.target.value as Status | ""); }}><option value="">All statuses</option>{(["pending", "approved", "rejected"] as const).map(value => <option key={value}>{value}</option>)}</select><Button variant="outline" disabled={loading || busy} onClick={() => {setReview(null); setReload(value => value + 1);}}>Refresh</Button></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}{success && <p role="status">{success}</p>}
    {loading ? <p role="status">Loading stories…</p> : error && !stories.length ? <Button variant="outline" onClick={() => setReload(value => value + 1)}>Try again</Button> : !stories.length ? <p>No stories in this view.</p> : <div className="space-y-4">{stories.map(story => <article key={story.id} className="space-y-3 rounded-2xl border bg-card p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold">{story.couple_names}</h2><span className="text-sm capitalize">{story.status}</span></div><p className="text-xs text-muted-foreground">Submitted {new Date(story.submitted_at).toLocaleString("en-GB")}</p><p className="whitespace-pre-wrap break-words text-sm">{story.story_text}</p><div className="flex flex-wrap gap-2">{(["approved", "rejected", "pending"] as const).filter(value => value !== story.status).map(value => <Button key={value} variant={value === "rejected" ? "destructive" : "outline"} disabled={busy || !!review} onClick={() => {setReview({story,status:value}); setNote(""); setError(""); setSuccess("");}}>{value === "approved" ? "Approve publication" : value === "rejected" ? "Reject story" : "Return to pending"}</Button>)}</div></article>)}</div>}
    {review && <section aria-label="Confirm story review" className="space-y-3 rounded-2xl border border-primary bg-accent p-5"><h2 className="font-semibold">Confirm {review.status}: {review.story.couple_names}</h2><Label htmlFor="story-review-note">Reason for audit (10–1000 characters)</Label><Textarea id="story-review-note" maxLength={1000} value={note} disabled={busy} onChange={event => setNote(event.target.value)} /><div className="flex gap-2"><Button disabled={busy || note.trim().length < 10} onClick={() => void save()}>{busy ? "Saving…" : "Confirm review"}</Button><Button variant="outline" disabled={busy} onClick={() => setReview(null)}>Cancel</Button></div></section>}
    <div className="flex items-center gap-3"><Button variant="outline" disabled={loading || busy || !!review || offset === 0} onClick={() => setOffset(value => Math.max(0,value-20))}>Previous</Button><span className="text-sm">Page {offset/20+1}</span><Button variant="outline" disabled={loading || busy || !!review || !!error || stories.length < 20} onClick={() => setOffset(value => value+20)}>Next</Button></div>
  </div>;
}
