import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { requestId, decision, note } = body as Record<string, unknown>;
  if (typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)
      || (decision !== "approved" && decision !== "rejected") || typeof note !== "string" || note.length > 1000)
    return NextResponse.json({ error: "Invalid review input" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("review_profile_verification_request", {
    p_request_id: requestId, p_decision: decision, p_reviewer_note: note.trim(),
  });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Request already reviewed" : error.code === "P0002" ? "Request not found" : "Unable to record review" },
    { status: error.code === "23505" ? 409 : error.code === "P0002" ? 404 : 503 });
  return NextResponse.json({ review: data }, { headers: { "Cache-Control": "no-store" } });
}
