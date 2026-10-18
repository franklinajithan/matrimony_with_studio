import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  context: { params: Promise<{ reportId: string }> }
) {
  if (!await requireServerAdmin("moderation")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportId } = await context.params;

  if (!uuid.test(reportId)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Get the report with related member information
  const { data: report, error } = await supabase
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
      reported_member:reported_member_id(
        id,
        display_name,
        email,
        bio,
        location,
        profession,
        is_verified,
        is_published,
        suspended_at,
        suspension_reason,
        created_at
      ),
      reporter:reporter_id(
        id,
        display_name,
        created_at
      )
    `)
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: "Unable to fetch report" }, { status: 500 });
  }

  // Get all reports against this member
  const { data: reportHistory, error: historyError } = await supabase
    .from("member_reports")
    .select(`
      id,
      reason,
      status,
      created_at,
      reporter:reporter_id(display_name)
    `)
    .eq('reported_member_id', report.reported_member_id)
    .order('created_at', { ascending: false }).limit(100);

  if (historyError) {
    console.error('Error fetching report history:', error);
  }

  // Get admin notes for this member
  const { data: adminNotes, error: notesError } = await supabase
    .from("member_admin_notes")
    .select(`
      id,
      note,
      created_at,
      author_id
    `)
    .eq('member_id', report.reported_member_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (notesError) {
    console.error('Error fetching admin notes:', notesError);
  }

  if(historyError||notesError)return NextResponse.json({error:'Investigation details unavailable'},{status:503});
  const ids=[...new Set([report.reviewed_by_admin_id,...(adminNotes??[]).map(note=>note.author_id)].filter((id):id is string=>typeof id==='string'))];
  const people=ids.length?await supabase.from('profiles').select('id,email').in('id',ids):{data:[],error:null};
  if(people.error)return NextResponse.json({error:'Reviewer details unavailable'},{status:503});
  const emails=new Map((people.data??[]).map(p=>[p.id,p.email]));
  return NextResponse.json({
    report:{...report,reviewed_by:report.reviewed_by_admin_id?{id:report.reviewed_by_admin_id,email:emails.get(report.reviewed_by_admin_id)}:null},
    reportHistory: reportHistory || [],
    adminNotes: (adminNotes??[]).map(note=>({...note,author:{email:emails.get(note.author_id)}}))
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
