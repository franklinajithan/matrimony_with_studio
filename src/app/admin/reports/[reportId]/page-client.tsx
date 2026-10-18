"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Mail, 
  Calendar, 
  FileText,
  Ban,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportMember {
  id?: string;
  display_name?: string;
  email?: string;
  bio?: string;
  location?: string;
  profession?: string;
  is_verified?: boolean;
  is_published?: boolean;
  suspended_at?: string;
  suspension_reason?: string;
  created_at?: string;
}

interface ReportDetails {
  id: string;
  reported_member_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  reviewed_by_admin_id?: string;
  reviewed_at?: string;
  moderation_note?: string;
  created_at: string;
  updated_at: string;
  reported_member?: ReportMember;
  reporter?: {
    id?: string;
    display_name?: string;
    created_at?: string;
  };
  reviewed_by?: {
    id?: string;
    email?: string;
  };
}

interface ReportHistoryItem {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter?: {
    display_name?: string;
  };
}

interface AdminNote {
  id: string;
  note: string;
  created_at: string;
  author?: {
    email?: string;
  };
}

const REASON_LABELS: Record<string, string> = {
  fake_profile: "Fake Profile",
  harassment: "Harassment / Abusive Behaviour",
  scam: "Scam / Asking for Money",
  inappropriate_content: "Inappropriate Content",
  misleading_status: "Married / Misleading Status",
  impersonation: "Impersonation",
  spam: "Spam",
  underage: "Underage Concern",
  other: "Other"
};

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  under_review: { label: "Under Review", color: "bg-amber-100 text-amber-800", icon: Eye },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  dismissed: { label: "Dismissed", color: "bg-slate-100 text-slate-600", icon: XCircle }
};

export default function AdminReportDetailClient({ reportId }: { reportId: string }) {
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [moderationNote, setModerationNote] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404) {
          setError(true);
          toast({ title: "Report not found", variant: "destructive" });
          return;
        }
        throw new Error("Failed to fetch report");
      }
      
      const data = await response.json();
      setReport(data.report);
      setReportHistory(data.reportHistory || []);
      setAdminNotes(data.adminNotes || []);
      setModerationNote(data.report.moderation_note || "");
    } catch (error) {
      console.error('Error fetching report:', error);
      setError(true);
      toast({ 
        title: "Unable to load report", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (newStatus: string) => {
    if (!report) return;
    
    setUpdating(true);
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report.id,
          status: newStatus,
          moderationNote: moderationNote.trim() || null
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update report");
      }

      toast({ 
        title: "Report updated", 
        description: `Status changed to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}` 
      });
      
      // Refresh the report
      await fetchReport();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({ 
        title: "Unable to update report", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setUpdating(false);
    }
  };

  const suspendMember = async () => {
    if (!report?.reported_member_id) return;
    
    const reason = prompt("Enter suspension reason (required, 10-1000 characters):");
    if (!reason || reason.trim().length < 10) {
      toast({ title: "Suspension cancelled", description: "A valid reason is required." });
      return;
    }

    try {
      const response = await fetch('/api/admin/member-suspension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: report.reported_member_id,
          suspend: true,
          reason: reason.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to suspend member");
      }

      toast({ title: "Member suspended", description: "The member has been suspended successfully." });
      await fetchReport();
    } catch (error) {
      console.error('Error suspending member:', error);
      toast({ 
        title: "Unable to suspend member", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const restoreMember = async () => {
    if (!report?.reported_member_id) return;
    
    const reason = prompt("Enter restoration reason (required, 10-1000 characters):");
    if (!reason || reason.trim().length < 10) {
      toast({ title: "Restoration cancelled", description: "A valid reason is required." });
      return;
    }

    try {
      const response = await fetch('/api/admin/member-suspension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: report.reported_member_id,
          suspend: false,
          reason: reason.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to restore member");
      }

      toast({ title: "Member restored", description: "The member has been restored successfully." });
      await fetchReport();
    } catch (error) {
      console.error('Error restoring member:', error);
      toast({ 
        title: "Unable to restore member", 
        description: "Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", { 
      dateStyle: "medium", 
      timeStyle: "short" 
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
          <p className="mt-4 text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-slate-900">Report not found</p>
          <p className="mt-2 text-sm text-slate-500">The report may have been deleted or doesn't exist.</p>
          <Button asChild className="mt-6">
            <Link href="/admin/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[report.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/admin/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Investigation</h1>
        </div>
        <Badge className={`${statusConfig.color} text-base px-4 py-2`}>
          <StatusIcon className="mr-2 h-4 w-4" />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Report Details */}
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>Information about this report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Reason</dt>
                  <dd className="mt-1 text-base font-semibold text-slate-900">
                    {REASON_LABELS[report.reason] || report.reason}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Submitted</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDate(report.created_at)}</dd>
                </div>
              </div>

              {report.description && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Description</dt>
                  <dd className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900">
                    {report.description}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-slate-500">Reporter Information</dt>
                <dd className="mt-1 text-sm text-slate-600">
                  Submitted by: {report.reporter?.display_name || 'Unknown'}
                  <span className="ml-2 text-xs text-slate-400">
                    (Joined {report.reporter?.created_at ? new Date(report.reporter.created_at).toLocaleDateString() : 'Unknown'})
                  </span>
                </dd>
                <dd className="mt-1 text-xs text-slate-400">
                  Reporter identity is protected and not shown to the reported member
                </dd>
              </div>

              {report.reviewed_at && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-sm font-medium text-slate-500">Review Information</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    Reviewed by: {report.reviewed_by?.email || 'Unknown admin'}
                  </dd>
                  <dd className="mt-1 text-xs text-slate-500">
                    {formatDate(report.reviewed_at)}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reported Member Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reported Member</CardTitle>
                  <CardDescription>Profile information (sensitive data excluded)</CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/admin/users/edit/${report.reported_member_id}`}>
                    View Full Profile
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Display Name</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {report.reported_member?.display_name || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Email</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {report.reported_member?.email || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Location</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {report.reported_member?.location || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Profession</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {report.reported_member?.profession || 'N/A'}
                  </dd>
                </div>
              </div>

              {report.reported_member?.bio && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">Bio</dt>
                  <dd className="mt-1 text-sm text-slate-600">
                    {report.reported_member.bio}
                  </dd>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {report.reported_member?.is_verified && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    Verified
                  </Badge>
                )}
                {report.reported_member?.is_published && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Published
                  </Badge>
                )}
                {report.reported_member?.suspended_at && (
                  <Badge className="bg-red-100 text-red-800">
                    Suspended
                  </Badge>
                )}
              </div>

              {report.reported_member?.suspended_at && report.reported_member?.suspension_reason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <dt className="text-sm font-medium text-red-900">Suspension Reason</dt>
                  <dd className="mt-1 text-sm text-red-800">
                    {report.reported_member.suspension_reason}
                  </dd>
                  <dd className="mt-1 text-xs text-red-600">
                    Suspended: {formatDate(report.reported_member.suspended_at)}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report History */}
          {reportHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Report History</CardTitle>
                <CardDescription>
                  {reportHistory.length} total report(s) against this member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportHistory.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {REASON_LABELS[item.reason] || item.reason}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(item.created_at)}
                          {item.reporter?.display_name && (
                            <span className="ml-2">
                              by {item.reporter.display_name}
                            </span>
                          )}
                        </p>
                      </div>
                      {item.id === reportId && (
                        <Badge className="bg-violet-100 text-violet-800">Current</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes */}
          {adminNotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
                <CardDescription>Previous administrative notes for this member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm text-slate-900">{note.note}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {note.author?.email || 'Unknown admin'} · {formatDate(note.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Moderation Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Moderation Actions</CardTitle>
              <CardDescription>Update report status and take action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Moderation Note
                </label>
                <Textarea
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="Add internal notes about this report (optional)"
                  rows={4}
                  maxLength={2000}
                  className="text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {moderationNote.length}/2000 characters
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Update Status</p>
                {report.status !== 'under_review' && (
                  <Button
                    onClick={() => updateReportStatus('under_review')}
                    disabled={updating}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Mark Under Review
                  </Button>
                )}
                {report.status !== 'resolved' && (
                  <Button
                    onClick={() => updateReportStatus('resolved')}
                    disabled={updating}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve
                  </Button>
                )}
                {report.status !== 'dismissed' && (
                  <Button
                    onClick={() => updateReportStatus('dismissed')}
                    disabled={updating}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Dismiss
                  </Button>
                )}
                {report.status !== 'open' && (
                  <Button
                    onClick={() => updateReportStatus('open')}
                    disabled={updating}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Reopen
                  </Button>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Member Actions</p>
                {!report.reported_member?.suspended_at ? (
                  <Button
                    onClick={suspendMember}
                    disabled={updating}
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend Member
                  </Button>
                ) : (
                  <Button
                    onClick={restoreMember}
                    disabled={updating}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore Member
                  </Button>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Actions are logged in the audit trail
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href={`/admin/users/edit/${report.reported_member_id}`}>
                  <User className="mr-2 h-4 w-4" />
                  View Full Member Profile
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/admin/security">
                  <FileText className="mr-2 h-4 w-4" />
                  View Audit Log
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
