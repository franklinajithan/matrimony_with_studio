import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
export const dynamic = "force-dynamic";
import { mutationError, validOrigin } from "@/lib/admin/http";
const input = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["support", "moderator", "none"]),
  reason: z.string().trim().min(10).max(1000),
});
export async function POST(request: Request) {
  if (!(await requireServerAdmin("manage")))
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
  const { data, error } = await db.rpc("admin_set_staff", {
    p_member_id: b.memberId,
    p_role: b.role,
    p_reason: b.reason,
  });
  if (error) return mutationError(error);
  return NextResponse.json(
    { result: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function GET() {
  if (!(await requireServerAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const [staff, admins] = await Promise.all([
    db
      .from("admin_staff")
      .select("user_id,role,created_at")
      .order("created_at", { ascending: false }),
    db.from("profiles").select("id,display_name,email").eq("is_admin", true),
  ]);
  if (staff.error || admins.error)
    return NextResponse.json(
      { error: "Unable to load staff" },
      { status: 503 },
    );
  const ids = (staff.data ?? []).map((s) => s.user_id);
  const people = ids.length
    ? await db.from("profiles").select("id,display_name,email").in("id", ids)
    : { data: [], error: null };
  if (people.error)
    return NextResponse.json(
      { error: "Unable to load staff" },
      { status: 503 },
    );
  const names = new Map((people.data ?? []).map((p) => [p.id, p]));
  return NextResponse.json(
    {
      staff: (staff.data ?? []).map((s) => ({
        ...s,
        member: names.get(s.user_id),
      })),
      administrators: admins.data ?? [],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
