import { z } from 'zod';
import { mutationError, validOrigin } from '@/lib/admin/http';
import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!await requireServerAdmin('moderation')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const params=new URL(request.url).searchParams;
  const parsed=z.object({status:z.enum(['all','open','under_review','resolved','dismissed']),reason:z.enum(['all','fake_profile','harassment','scam','inappropriate_content','misleading_status','impersonation','spam','underage','other']),search:z.string().max(100),page:z.coerce.number().int().min(1).max(100000),dateFrom:z.string().date().nullable(),dateTo:z.string().date().nullable()}).safeParse({status:params.get('status')||'all',reason:params.get('reason')||'all',search:params.get('search')||'',page:params.get('page')||1,dateFrom:params.get('dateFrom'),dateTo:params.get('dateTo')});
  if(!parsed.success)return NextResponse.json({error:'Invalid report filters'},{status:400});
  const f=parsed.data;
  if(f.dateFrom&&f.dateTo&&f.dateFrom>f.dateTo)return NextResponse.json({error:'Invalid date range'},{status:400});
  const db=await createSupabaseServerClient();
  const {data,error}=await db.rpc('admin_reports_list',{p_status:f.status,p_reason:f.reason,p_search:f.search.trim(),p_page:f.page,p_from:f.dateFrom?`${f.dateFrom}T00:00:00Z`:null,p_to:f.dateTo?new Date(Date.parse(`${f.dateTo}T00:00:00Z`)+86400000).toISOString():null});
  if(error)return mutationError(error);
  return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
}

// PATCH: Update report status
export async function PATCH(request: Request) {
  if (!await requireServerAdmin("moderation")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!validOrigin(request)) return NextResponse.json({error:'Invalid origin'},{status:403});
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
