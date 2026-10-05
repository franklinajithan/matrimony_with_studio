import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!await requireServerAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  
  // Parse filters
  const status = searchParams.get('status');
  const reason = searchParams.get('reason');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const search = searchParams.get('search');

  // Build query
  let query = supabase
    .from("member_reports")
    .select(`
      id,
      reported_member_id,
      reporter_id,
      reason,
      description,
      status,
      reviewed_by_admin_id,
      reviewed_at,
      moderation_note,
      created_at,
      updated_at,
      reported_member:reported_member_id(display_name, email, suspended_at),
      reporter:reporter_id(display_name, email)
    `, { count: 'exact' });

  // Apply filters
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (reason && reason !== 'all') {
    query = query.eq('reason', reason);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  // Search by reported member display name or email
  if (search && search.trim()) {
    // Note: This is a simplified search. For production, consider full-text search
    const searchTerm = search.trim();
    query = query.or(`reported_member.display_name.ilike.%${searchTerm}%,reported_member.email.ilike.%${searchTerm}%`);
  }

  // Order by most recent first
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: "Unable to fetch reports" }, { status: 500 });
  }

  // Get report counts for each reported member
  const reportedMemberIds = [...new Set(data?.map(r => r.reported_member_id) || [])];
  const reportCounts: Record<string, number> = {};

  if (reportedMemberIds.length > 0) {
    const { data: countData } = await supabase
      .rpc('count_member_reports', { p_member_id: reportedMemberIds[0] });
    
    // Get counts for all members (simplified - in production, batch this)
    for (const memberId of reportedMemberIds) {
      const { data: countResult } = await supabase
        .rpc('count_member_reports', { p_member_id: memberId });
      if (countResult !== null) {
        reportCounts[memberId] = countResult;
      }
    }
  }

  // Enhance reports with report counts
  const enhancedReports = data?.map(report => ({
    ...report,
    totalReportsAgainstMember: reportCounts[report.reported_member_id] || 0
  }));

  return NextResponse.json({ 
    reports: enhancedReports || [],
    total: count || 0
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}

// PATCH: Update report status
export async function PATCH(request: Request) {
  if (!await requireServerAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { reportId, status, moderationNote } = body as Record<string, unknown>;

  // Validate inputs
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (typeof reportId !== "string" || !uuid.test(reportId)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  const validStatuses = ['open', 'under_review', 'resolved', 'dismissed'];
  if (typeof status !== "string" || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (moderationNote !== undefined && moderationNote !== null) {
    if (typeof moderationNote !== "string" || moderationNote.length > 2000) {
      return NextResponse.json({ error: "Moderation note too long" }, { status: 400 });
    }
  }

  // Use the RPC for consistent audit logging
  const { data, error } = await supabase.rpc('admin_update_report_status', {
    p_report_id: reportId,
    p_status: status,
    p_moderation_note: moderationNote || null
  });

  if (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: "Unable to update report" }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    data
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
