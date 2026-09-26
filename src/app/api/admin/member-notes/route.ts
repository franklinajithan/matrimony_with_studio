import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const memberId = new URL(request.url).searchParams.get("memberId");
  if (!memberId || !uuid.test(memberId)) return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("member_admin_notes")
    .select("id,note,created_at,author_id").eq("member_id",memberId)
    .order("created_at",{ ascending:false }).limit(100);
  if (error) return NextResponse.json({ error: "Unable to load private notes" }, { status: 503 });
  return NextResponse.json({ notes:data ?? [] }, { headers: { "Cache-Control":"no-store" } });
}

export async function POST(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { memberId,note } = body as Record<string,unknown>;
  if (typeof memberId !== "string" || !uuid.test(memberId) || typeof note !== "string" || !note.trim() || note.trim().length > 2000)
    return NextResponse.json({ error: "Invalid member or note" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data:auth,error:authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error:"Unauthenticated" }, { status:401 });
  const { data,error } = await supabase.from("member_admin_notes").insert({
    member_id:memberId,author_id:auth.user.id,note:note.trim(),
  }).select("id,note,created_at,author_id").single();
  if (error) return NextResponse.json({ error:"Unable to save private note" }, { status:503 });
  return NextResponse.json({ note:data }, { status:201,headers: { "Cache-Control":"no-store" } });
}
