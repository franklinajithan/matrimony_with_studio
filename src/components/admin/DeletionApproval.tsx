"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export function DeletionApproval({
  memberId,
  requestedAt,
}: {
  memberId: string;
  requestedAt: string;
}) {
  const [reason, setReason] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          requestedAt,
          reason,
          confirmation,
          retentionReviewed: reviewed,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Approval failed");
      setMessage(d.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="border-t pt-3">
      <summary className="cursor-pointer font-medium">
        Super Admin erasure review
      </summary>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <p className="text-sm">
          Processing is irreversible. Review export, billing, refunds, safety
          holds and approved retention first. The worker is disabled until
          configured. Members may cancel before processing starts.
        </p>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
            required
          />
          I reviewed retention, billing and safety obligations.
        </label>
        <label className="block text-sm">
          Review reason
          <Textarea
            required
            minLength={20}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Type APPROVE ERASURE
          <Input
            required
            autoComplete="off"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </label>
        <Button
          variant="destructive"
          disabled={
            busy ||
            !reviewed ||
            confirmation !== "APPROVE ERASURE" ||
            reason.trim().length < 20
          }
        >
          Approve for processing
        </Button>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
      </form>
    </details>
  );
}
