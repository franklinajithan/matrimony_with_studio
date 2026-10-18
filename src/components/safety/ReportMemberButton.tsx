"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'harassment', label: 'Harassment / Abusive Behaviour' },
  { value: 'scam', label: 'Scam / Asking for Money' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'misleading_status', label: 'Married / Misleading Relationship Status' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'spam', label: 'Spam' },
  { value: 'underage', label: 'Underage Concern' },
  { value: 'other', label: 'Other' },
];

interface ReportMemberButtonProps {
  memberId: string;
  memberName?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onReportSubmitted?: () => void;
}

export function ReportMemberButton({
  memberId,
  memberName = "this member",
  variant = "ghost",
  size = "sm",
  className,
  onReportSubmitted,
}: ReportMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for reporting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/members/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedMemberId: memberId,
          reason,
          description: description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep CupidMatch safe. We'll review this report shortly.",
      });

      setOpen(false);
      setReason('');
      setDescription('');
      onReportSubmitted?.();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Unable to submit report",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!submitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setReason('');
        setDescription('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Flag className="mr-2 h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Report {memberName}
            </DialogTitle>
            <DialogDescription>
              Help us keep CupidMatch safe. Your report will be reviewed by our moderation team. 
              Your identity will not be disclosed to the reported member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for reporting *</Label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                required
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional details (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context that might help our review..."
                rows={4}
                maxLength={2000}
                className="text-sm"
              />
              <p className="text-xs text-slate-500">
                {description.length}/2000 characters
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-900">
                <strong>Please note:</strong> False reports may result in action against your account. 
                Only submit reports for genuine safety concerns.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={submitting || !reason}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
