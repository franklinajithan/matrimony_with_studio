import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const memberId = new URL(request.url).searchParams.get("memberId");
  if (!memberId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberId))
    return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("verification_requests")
      .select("id,status,member_note,reviewer_note,created_at,reviewed_at")
      .eq("member_id", memberId).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ requests: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load member review history" }, { status: 503 });
  }
}
