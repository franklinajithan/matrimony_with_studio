import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { memberId, displayName, location, profession, bio } = body as Record<string, unknown>;
  if (typeof memberId !== "string" || !uuid.test(memberId) ||
      typeof displayName !== "string" || !displayName.trim() || displayName.length > 100 ||
      typeof location !== "string" || location.length > 150 ||
      typeof profession !== "string" || profession.length > 150 ||
      typeof bio !== "string" || bio.length > 3000)
    return NextResponse.json({ error: "Invalid profile fields" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_edit_member", {
    p_id: memberId, p_name: displayName.trim(), p_location: location.trim(),
    p_profession: profession.trim(), p_bio: bio.trim(),
  });
  if (error) return NextResponse.json({ error: "Unable to update member profile" }, { status: 503 });
  return NextResponse.json({ updated: true }, { headers: { "Cache-Control": "no-store" } });
}
