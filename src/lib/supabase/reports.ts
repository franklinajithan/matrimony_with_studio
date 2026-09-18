import { supabase } from "./client";
import { Timestamp } from "./timestamp";

export type ReportReason =
  | "inappropriate_content"
  | "fake_profile"
  | "harassment"
  | "spam"
  | "safety_concern"
  | "other";

export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function mapReport(row: Record<string, unknown>): Report {
  return {
    id: String(row.id),
    reporterId: String(row.reporter_id),
    reportedId: String(row.reported_id),
    reason: String(row.reason) as ReportReason,
    description: row.description ? String(row.description) : null,
    status: String(row.status) as ReportStatus,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: Timestamp.fromISO(row.reviewed_at as string | null),
    createdAt: Timestamp.fromISO(row.created_at as string | null) ?? Timestamp.now(),
    updatedAt: Timestamp.fromISO(row.updated_at as string | null) ?? Timestamp.now(),
  };
}

export async function createReport(params: {
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  description?: string;
}): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .insert({
      reporter_id: params.reporterId,
      reported_id: params.reportedId,
      reason: params.reason,
      description: params.description || null,
      status: "pending",
    });
  
  if (error) throw error;
}

export async function listReports(
  filters?: { status?: ReportStatus; limit?: number }
): Promise<Report[]> {
  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  
  query = query.limit(filters?.limit || 50);
  
  const { data, error } = await query;
  
  if (error) throw error;
  return (data || []).map(mapReport);
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  reviewedBy?: string
): Promise<void> {
  const { error } = await supabase
    .from("reports")
    .update({
      status,
      reviewed_by: reviewedBy || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  
  if (error) throw error;
}
