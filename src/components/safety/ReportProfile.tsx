"use client";

import { useState, type FormEvent } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createReport, type ReportReason } from "@/lib/supabase/reports";

const reasons: Record<ReportReason, string> = {
  inappropriate_content: "Inappropriate content",
  fake_profile: "Fake profile",
  harassment: "Harassment",
  spam: "Spam",
  safety_concern: "Safety concern",
  other: "Other",
};

export function ReportProfile({ reporterId, reportedId }: { reporterId: string; reportedId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"sent" | "duplicate" | "failed">();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "");
    if (!Object.hasOwn(reasons, reason)) return;
    setSubmitting(true);
    setStatus(undefined);
    try {
      await createReport({ reporterId, reportedId, reason: reason as ReportReason, description: String(form.get("description") ?? "").trim() });
      setStatus("sent");
    } catch (error) {
      setStatus(error && typeof error === "object" && "code" in error && error.code === "23505" ? "duplicate" : "failed");
    } finally {
      setSubmitting(false);
    }
  }

  return <details className="w-full max-w-md rounded-xl border bg-card p-3 text-sm">
    <summary className="cursor-pointer font-medium text-primary"><Flag aria-hidden="true" className="mr-2 inline h-4 w-4" />Report profile</summary>
    {status === "sent" || status === "duplicate"
      ? <p className="mt-3" role="status">{status === "sent" ? "Your report was sent to CupidMatch support." : "CupidMatch support already has an open report from you for this profile."}</p>
      : <form onSubmit={submit} className="mt-3 space-y-3">
        <label className="grid gap-1">Reason
          <select name="reason" required defaultValue="" className="rounded-lg border bg-background p-2">
            <option value="" disabled>Choose a reason</option>
            {Object.entries(reasons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1">Details (optional)
          <textarea name="description" maxLength={1000} rows={3} className="rounded-lg border bg-background p-2" />
        </label>
        {status === "failed" && <p role="alert">The report could not be sent. Please try again.</p>}
        <Button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send report"}</Button>
      </form>}
  </details>;
}
