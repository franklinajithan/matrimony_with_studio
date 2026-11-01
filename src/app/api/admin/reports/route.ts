import { NextResponse } from "next/server";
import { z } from "zod";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const status = z.enum(["pending", "reviewing", "resolved", "dismissed"]);
const patch = z.object({ id: z.string().uuid(), status, expectedStatus: status }).strict();
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const selected = params.get("status"); const offset = Number(params.get("offset") || 0);
  if ((selected && !status.safeParse(selected).success) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000)
    return NextResponse.json({ error: "Invalid report filter" }, { status: 400 });
  try {
    const db = await createSupabaseServerClient();
    let query = db.from("reports").select("id,reporter_id,reported_id,reason,description,status,reviewed_by,reviewed_at,created_at")
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 19);
    if (selected) query = query.eq("status", selected);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ reports: data || [] }, { headers });
  } catch { return NextResponse.json({ error: "Could not load reports" }, { status: 503, headers }); }
}
export async function PATCH(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid report and status" }, { status: 400 });
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db.from("reports").update({ status: parsed.data.status }).eq("id", parsed.data.id)
      .eq("status", parsed.data.expectedStatus).select("id,status,reviewed_by,reviewed_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Report changed or is no longer available. Refresh and try again." }, { status: 409, headers });
    return NextResponse.json(data, { headers });
  } catch { return NextResponse.json({ error: "Could not update report" }, { status: 503, headers }); }
}
