"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminMemberDetailsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getProfile(userId).then(profile => {
      if (active) { setUser(profile); setLoading(false); }
    }).catch(() => {
      if (active) { setError(true); setLoading(false); }
    });
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
  </div>;
}
