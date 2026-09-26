"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, RefreshCw } from "lucide-react";
import Link from "next/link";

type Summary = { pendingVerification: number; updatedAt: string };

export default function AdminVerificationsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/summary", { cache: "no-store" });
      if (!response.ok) throw new Error("Verification overview is unavailable.");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" ||
          !("pendingVerification" in data) ||
          !Number.isSafeInteger(data.pendingVerification as number) ||
          (data.pendingVerification as number) < 0 ||
          !("updatedAt" in data) || typeof data.updatedAt !== "string") {
        throw new Error("Invalid verification overview.");
      }
      setSummary(data as Summary);
    } catch {
      setSummary(null);
      setError("Unable to load the verification overview. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Profile Verifications</h1>
        <Button variant="outline" asChild><Link href="/admin">Back to Admin Dashboard</Link></Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Published profiles awaiting verification</CardTitle>
          <CardDescription>This is a review backlog, not submitted identity-document requests. Document submission and approval are not enabled yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p role="status">Loading verification overview…</p> :
            error ? <p role="alert">{error}</p> :
            <p data-testid="admin-pending-verification-count" className="text-4xl font-bold">{summary?.pendingVerification}</p>}
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
