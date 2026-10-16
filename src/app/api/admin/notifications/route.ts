import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
export const dynamic = "force-dynamic";
import { mutationError, validOrigin } from "@/lib/admin/http";
const input = z.object({
  memberId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
});
export async function POST(request: Request) {
  if (!(await requireServerAdmin("notifications")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check the required fields and try again." },
      { status: 400 },
    );
  const b = parsed.data;
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc("admin_send_member_notice", {
    p_member_id: b.memberId,
    p_title: b.title,
    p_body: b.body,
  });
  if (error) return mutationError(error);
  return NextResponse.json(
    { result: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function GET() {
  if (!(await requireServerAdmin("notifications")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("member_notices")
    .select("id,member_id,title,body,created_at,read_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error)
    return NextResponse.json(
      { error: "Unable to load notification history" },
      { status: 503 },
    );
  return NextResponse.json(
    { notices: data ?? [], limit: 100 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
