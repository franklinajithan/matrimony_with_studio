"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/types";
import { MemberOperations } from "./member-operations";
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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getProfile(userId).then(profile => {
      if (active) { setUser(profile); setLoading(false); }
    }).catch(() => {
      if (active) { setError(true); setLoading(false); }
    });
    fetch(`/api/admin/member-verification-history?memberId=${encodeURIComponent(userId)}`, { cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then(payload => { if (active) { setReviews(payload.requests); setReviewsLoading(false); } })
      .catch(() => { if (active) { setReviewError(true); setReviewsLoading(false); } });
    return () => { active = false; };
  }, [userId]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">Member details</h1>
      <Link href="/admin/users" className="rounded-lg border px-4 py-2 text-sm">Back to members</Link>
    </div>
    <Card>
      <CardHeader><CardTitle>Profile review</CardTitle>
        <CardDescription>Read-only until audited server-side profile editing and identity verification are implemented. Role changes are not available here.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p role="status">Loading member…</p> :
          error ? <p role="alert">Unable to load member details.</p> :
          !user ? <p>Member not found.</p> :
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
          </dl>}
      </CardContent>
    </Card>
    <MemberOperations memberId={userId} />
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
