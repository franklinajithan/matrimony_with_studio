"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/types";
import { MemberOperations } from "./member-operations";
import { MemberAdminNotes } from "./member-admin-notes";
import { ExtendedMemberProfile } from "./extended-member-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ReviewHistory = { id: string; status: string; member_note: string; reviewer_note: string | null; created_at: string; reviewed_at: string | null };

export default function AdminMemberDetailsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviews, setReviews] = useState<ReviewHistory[]>([]);
  const [reviewError, setReviewError] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [form, setForm] = useState({ displayName: "", location: "", profession: "", bio: "" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getProfile(userId).then(profile => {
      if (active) { setUser(profile); if (profile) setForm({ displayName: profile.displayName || "", location: profile.location || "", profession: profile.profession || "", bio: profile.bio || "" }); setLoading(false); }
    }).catch(() => {
      if (active) { setError(true); setLoading(false); }
    });
    fetch(`/api/admin/member-verification-history?memberId=${encodeURIComponent(userId)}`, { cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then(payload => { if (active) { setReviews(payload.requests); setReviewsLoading(false); } })
      .catch(() => { if (active) { setReviewError(true); setReviewsLoading(false); } });
    return () => { active = false; };
  }, [userId]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setEditError(""); setEditSuccess("");
    try {
      const response = await fetch("/api/admin/member-profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: userId, ...form }) });
      if (!response.ok) throw new Error("Unable to save profile changes.");
      setUser(previous => previous ? { ...previous, ...form } : previous);
      setEditing(false); setEditSuccess("Member profile updated.");
    } catch (error) { setEditError(error instanceof Error ? error.message : "Unable to save changes."); }
    finally { setSaving(false); }
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">Member details</h1>
      <Link href="/admin/users" className="rounded-lg border px-4 py-2 text-sm">Back to members</Link>
    </div>
    <Card>
      <CardHeader><CardTitle>Profile review</CardTitle>
        <CardDescription>Edit basic member details when a member needs assistance. Changes are logged. Verification, roles and billing are managed separately.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p role="status">Loading member…</p> :
          error ? <p role="alert">Unable to load member details.</p> :
          !user ? <p>Member not found.</p> :
          <div className="space-y-4"><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => { setEditing(value => !value); setEditError(""); }}> {editing ? "Cancel editing" : "Edit profile"}</Button></div>
          {editSuccess && <p role="status" className="text-sm text-emerald-700">{editSuccess}</p>}
          {editing && <form onSubmit={saveProfile} className="space-y-3 rounded-xl border bg-white p-4">
            {(["displayName","location","profession"] as const).map(field => <label key={field} className="block text-sm font-medium"><span className="mb-1 block capitalize">{field === "displayName" ? "Display name" : field}</span><Input value={form[field]} onChange={event => setForm(previous => ({ ...previous, [field]: event.target.value }))} maxLength={field === "displayName" ? 100 : 150} required={field === "displayName"} /></label>)}
            <label className="block text-sm font-medium"><span className="mb-1 block">Bio</span><Textarea value={form.bio} onChange={event => setForm(previous => ({ ...previous, bio: event.target.value }))} maxLength={3000} rows={5} /></label>
            {editError && <p role="alert" className="text-sm text-red-700">{editError}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save member changes"}</Button>
          </form>}
          <dl className="grid gap-4 sm:grid-cols-2">
            {([
              ["Display name", user.displayName],
              ["Email", user.email],
              ["Location", user.location],
              ["Profession", user.profession],
              ["Bio", user.bio],
              ["Profile verified", user.isVerified ? "Yes" : "No"],
              ["Published", user.isPublished ? "Yes" : "No"],
              ["Admin", user.isAdmin ? "Yes" : "No"],
            ] as const).map(([label, value]) =>
              <div key={label} className="min-w-0 border-b pb-2">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="break-words font-medium">{value || "—"}</dd>
              </div>)}
          </dl></div>}
      </CardContent>
    </Card>
    <ExtendedMemberProfile memberId={userId} profile={user} />
    <MemberOperations memberId={userId} />
    <MemberAdminNotes memberId={userId} />
    <Card><CardHeader><CardTitle>Verification request history</CardTitle><CardDescription>Member-submitted profile review requests and recorded decisions. Identity-document verification is a separate process.</CardDescription></CardHeader><CardContent>
      {reviewsLoading ? <p role="status">Loading review history…</p> : reviewError ? <p role="alert">Unable to load review history.</p> : reviews.length === 0 ? <p>No review requests submitted.</p> :
        <ul className="divide-y">{reviews.map(review => <li key={review.id} className="space-y-1 py-3">
          <p className="font-medium capitalize">{review.status}</p>
          <p className="text-sm text-muted-foreground">Requested: {new Date(review.created_at).toLocaleDateString("en-GB")}{review.reviewed_at ? ` · Reviewed: ${new Date(review.reviewed_at).toLocaleDateString("en-GB")}` : ""}</p>
          {review.member_note && <p className="text-sm">Member note: {review.member_note}</p>}
          {review.reviewer_note && <p className="text-sm">Reviewer note: {review.reviewer_note}</p>}
        </li>)}</ul>}
    </CardContent></Card>
  </div>;
}
