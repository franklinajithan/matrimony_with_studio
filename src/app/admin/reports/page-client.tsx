"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, ShieldAlert, CheckCircle, XCircle, Eye, RefreshCw, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
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
  reported_member?: {
    display_name?: string;
    email?: string;
    suspended_at?: string;
  };
  reporter?: {
    display_name?: string;
    email?: string;
  };
  totalReportsAgainstMember?: number;
}

type StatusFilter = "all" | "open" | "under_review" | "resolved" | "dismissed";
type ReasonFilter = "all" | "fake_profile" | "harassment" | "scam" | "inappropriate_content" | "misleading_status" | "impersonation" | "spam" | "underage" | "other";

const PAGE_SIZE = 20;

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

export default function AdminReportsPageClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (reasonFilter !== "all") params.append("reason", reasonFilter);
      if (search.trim()) params.append("search", search.trim());

      const response = await fetch(`/api/admin/reports?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch reports");
      
      const data = await response.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({ 
        title: "Unable to load reports", 
        description: "Please refresh and try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, reasonFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchReports();
  };

  const counts = useMemo(() => ({
    all: total,
    open: reports.filter(r => r.status === 'open').length,
    under_review: reports.filter(r => r.status === 'under_review').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }), [reports, total]);

  const pages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = reports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", { 
      dateStyle: "medium", 
      timeStyle: "short" 
    });
  };

  return (
    <div className="space-y-7 pb-12" data-testid="admin-reports-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-700">
            <ShieldAlert className="h-4 w-4" /> SAFETY & MODERATION
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Member Reports
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Review and manage member reports, take moderation actions, and maintain community safety.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {([
          { label: "All Reports", count: counts.all, status: "all" as StatusFilter },
          { label: "Open", count: counts.open, status: "open" as StatusFilter },
          { label: "Under Review", count: counts.under_review, status: "under_review" as StatusFilter },
          { label: "Resolved", count: counts.resolved, status: "resolved" as StatusFilter },
          { label: "Dismissed", count: counts.dismissed, status: "dismissed" as StatusFilter },
        ]).map(stat => {
          const StatusIcon = stat.status !== "all" ? STATUS_CONFIG[stat.status]?.icon : Filter;
          return (
            <button
              key={stat.label}
              onClick={() => { setStatusFilter(stat.status); setPage(1); }}
              className={`rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 ${
                statusFilter === stat.status 
                  ? 'border-violet-300 bg-violet-50' 
                  : 'border-slate-200 bg-white hover:border-violet-200'
              }`}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <StatusIcon className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {loading ? "—" : stat.count.toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters Section */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search reports"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by reported member name or email"
              className="h-11 rounded-xl border-slate-200 pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            Reason:
            <select
              value={reasonFilter}
              onChange={e => { setReasonFilter(e.target.value as ReasonFilter); setPage(1); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-slate-800"
            >
              <option value="all">All reasons</option>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading reports...</div>
          ) : visible.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-lg font-medium text-slate-600">No reports found</p>
              <p className="mt-2 text-sm text-slate-500">
                {statusFilter !== "all" || reasonFilter !== "all" || search 
                  ? "Try adjusting your filters" 
                  : "Reports will appear here when members submit them"}
              </p>
            </div>
          ) : (
            <div className="min-w-full space-y-2">
              {visible.map(report => {
                const statusConfig = STATUS_CONFIG[report.status];
                const StatusIcon = statusConfig.icon;
                
                return (
                  <Link
                    key={report.id}
                    href={`/admin/reports/${report.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                          <Badge variant="outline">
                            {REASON_LABELS[report.reason] || report.reason}
                          </Badge>
                          {report.reported_member?.suspended_at && (
                            <Badge className="bg-red-100 text-red-800">
                              Suspended
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">
                            Reported: {report.reported_member?.display_name || 'Unknown member'}
                          </div>
                          <div className="text-sm text-slate-500">
                            {report.reported_member?.email}
                          </div>
                        </div>

                        {report.description && (
                          <p className="line-clamp-2 text-sm text-slate-600">
                            {report.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Reported {formatDate(report.created_at)}
                          </span>
                          {report.totalReportsAgainstMember && report.totalReportsAgainstMember > 1 && (
                            <span className="font-semibold text-amber-700">
                              {report.totalReportsAgainstMember} total reports
                            </span>
                          )}
                        </div>
                      </div>

                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Eye className="mr-2 h-4 w-4" />
                          Review
                        </span>
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && visible.length > 0 && pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, reports.length)} of {reports.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-3 text-sm">
                <span className="font-semibold">{currentPage}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600">{pages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={currentPage === pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
