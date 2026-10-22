"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function MemberDeletion({ memberId, email }: { memberId: string; email: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || confirmation.trim().toLowerCase() !== email.toLowerCase()) return;
    if (!window.confirm(`Permanently delete ${email}, their login, profile, conversations and uploaded files? This cannot be undone.`)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/delete-member", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, email: confirmation.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete member");
      router.replace("/admin/users?deleted=1"); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete member"); setBusy(false);
    }
  }
  return <Card className="border-destructive/40">
    <CardHeader><CardTitle>Permanently delete member</CardTitle>
      <CardDescription>Remove the login account, profile, conversations, preferences, horoscope and uploaded files. The same email can then create a fresh profile. This cannot be undone. Cancel any paid subscription first. Administrative audit records may remain.</CardDescription>
    </CardHeader>
    <CardContent><form onSubmit={submit} className="space-y-3">
      <label htmlFor="delete-member-email" className="block text-sm font-medium">Type {email} to confirm</label>
      <Input id="delete-member-email" type="email" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} required />
      <Button type="submit" variant="destructive" disabled={busy || confirmation.trim().toLowerCase() !== email.toLowerCase()}>{busy ? "Deleting member…" : "Permanently delete member"}</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form></CardContent>
  </Card>;
}
