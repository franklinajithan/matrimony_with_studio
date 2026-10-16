import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_REASONS = [
  'fake_profile',
  'harassment',
  'scam',
  'inappropriate_content',
  'misleading_status',
  'impersonation',
  'spam',
  'underage',
  'other'
] as const;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { reportedMemberId, reason, description } = body as Record<string, unknown>;

  // Validate reportedMemberId
  if (typeof reportedMemberId !== "string" || !uuid.test(reportedMemberId)) {
    return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  }

  // Cannot report yourself
  if (reportedMemberId === user.id) {
    return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
  }

  // Validate reason
  if (typeof reason !== "string" || !VALID_REASONS.includes(reason as any)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  // Validate optional description
  if (description !== undefined && description !== null) {
    if (typeof description !== "string" || description.length > 2000) {
      return NextResponse.json({ error: "Description too long (max 2000 characters)" }, { status: 400 });
    }
  }

  // Insert the report
  const { data, error } = await supabase
    .from("member_reports")
    .insert({
      reported_member_id: reportedMemberId,
      reporter_id: user.id,
      reason,
      description: description || null,
      status: 'open'
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: "Unable to submit report" }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    reportId: data.id 
  }, { 
    status: 201,
    headers: { "Cache-Control": "no-store" } 
  });
}

// GET: Retrieve user's own reports
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get reports created by the current user
  const { data, error } = await supabase
    .from("member_reports")
    .select(`
      id,
      reported_member_id,
      reason,
      description,
      status,
      created_at,
      updated_at
    `)
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: "Unable to fetch reports" }, { status: 500 });
  }

  return NextResponse.json({ 
    reports: data || [] 
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
