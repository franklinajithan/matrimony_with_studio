"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { blockUser } from "@/lib/supabase/blocks";
import { createReport, type ReportReason } from "@/lib/supabase/reports";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const reasons: { value: ReportReason; label: string }[] = [
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "fake_profile", label: "Fake profile or impersonation" },
  { value: "harassment", label: "Harassment" }, { value: "spam", label: "Spam or scam" },
  { value: "safety_concern", label: "Safety concern" }, { value: "other", label: "Other" },
];
export function MemberSafetyActions({ memberId }: { memberId: string }) {
  const router = useRouter(); const { toast } = useToast();
  const [dialog, setDialog] = useState<"report" | "block" | null>(null);
  const [reason, setReason] = useState<ReportReason>("safety_concern");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false); const pending = useRef(false);
  async function submit() {
    if (pending.current || !dialog) return;
    pending.current = true; setBusy(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user) throw new Error("Your session has expired. Please sign in again.");
      if (data.user.id === memberId) throw new Error("Choose another member.");
      if (dialog === "report") {
        await createReport({ reporterId: data.user.id, reportedId: memberId, reason, description: description.trim() });
        toast({ title: "Report submitted", description: "Our moderation team can review it. Your identity is not shown to this member." });
      } else {
        await blockUser(data.user.id, memberId);
        toast({ title: "Member blocked", description: "Manage your blocked members in Settings." });
        router.replace("/discover");
      }
      setDialog(null); setDescription("");
    } catch (error) {
      const message = error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : "Please try again.";
      toast({ title: "Could not complete this action", description: message, variant: "destructive" });
    } finally { pending.current = false; setBusy(false); }
  }
  return <div className="flex flex-wrap gap-2">
    <Button type="button" variant="outline" onClick={() => setDialog("report")}>Report member</Button>
    <Button type="button" variant="outline" onClick={() => setDialog("block")}>Block member</Button>
    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open && !busy) setDialog(null); }}>
      <DialogContent><DialogHeader><DialogTitle>{dialog === "report" ? "Report this member" : "Block this member?"}</DialogTitle>
        <DialogDescription>{dialog === "report" ? "Tell our moderation team what happened. The reported member cannot view this report." : "This prevents contact and removes your connection. Previous conversations are retained. Unblocking will not restore the connection."}</DialogDescription>
      </DialogHeader>
      {dialog === "report" && <div className="space-y-3"><Label htmlFor="member-report-reason">Reason</Label>
        <select id="member-report-reason" className="min-h-11 w-full rounded-md border bg-background px-3" value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} disabled={busy}>
          {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select><Label htmlFor="member-report-description">Details (optional)</Label>
        <Textarea id="member-report-description" maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} />
        <p className="text-xs text-muted-foreground">{description.length}/1000 characters. Include only information relevant to this report.</p>
      </div>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setDialog(null)}>Cancel</Button>
        <Button type="button" disabled={busy} onClick={() => void submit()}>{busy ? "Saving…" : dialog === "report" ? "Submit report" : "Confirm block"}</Button></div>
      </DialogContent>
    </Dialog>
  </div>;
}
