"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, RefreshCw } from "lucide-react";

type ReviewProfile = { id: string; display_name: string | null; created_at: string | null };
export default function AdminVerificationsPage() {
  const [profiles, setProfiles] = useState<ReviewProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  async function refresh() {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/admin/verification-backlog", { cache: "no-store" });
      if (!response.ok) throw new Error("Unavailable");
      const payload = await response.json();
      if (!Array.isArray(payload.profiles)) throw new Error("Invalid response");
      setProfiles(payload.profiles);
    } catch {
      setProfiles([]);
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
