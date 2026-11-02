import { NextResponse } from "next/server";
import { z } from "zod";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const status = z.enum(["pending", "approved", "rejected"]);
const patch = z.object({ id: z.string().uuid(), status, expectedStatus: status, note: z.string().trim().min(10).max(1000) }).strict();
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  const params = new URL(request.url).searchParams;
  const selected = params.get("status"); const offset = Number(params.get("offset") || 0);
  if ((selected && !status.safeParse(selected).success) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    return NextResponse.json({ error: "Invalid story filter" }, { status: 400, headers });
  try {
    const db = await createSupabaseServerClient();
    let query = db.from("success_stories").select("id,couple_names,story_text,status,submitted_at,approved_at")
      .order("submitted_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 19);
    if (selected) query = query.eq("status", selected);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ stories: data || [] }, { headers });
  } catch { return NextResponse.json({ error: "Could not load stories" }, { status: 503, headers }); }
}
export async function PATCH(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers }); }
  const parsed = patch.safeParse(body);
  if (!parsed.success || parsed.data.status === parsed.data.expectedStatus) return NextResponse.json({ error: "Choose a new status and give a reason (10–1000 characters)" }, { status: 400, headers });
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db.rpc("admin_review_success_story", {
      p_id: parsed.data.id, p_status: parsed.data.status, p_expected_status: parsed.data.expectedStatus, p_note: parsed.data.note,
    });
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Story changed or is unavailable. Refresh and review it again." }, { status: 409, headers });
    return NextResponse.json(data, { headers });
  } catch { return NextResponse.json({ error: "Could not save story review" }, { status: 503, headers }); }
}
