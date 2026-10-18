import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
export const dynamic = "force-dynamic";
import { mutationError, validOrigin } from "@/lib/admin/http";
const input = z.object({
  storyId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
  note: z.string().trim().min(10).max(1000),
  expectedUpdatedAt: z.string().datetime({ offset: true }).nullable(),
});
export async function POST(request: Request) {
  if (!(await requireServerAdmin("content")))
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
  const { data, error } = await db.rpc("admin_review_story", {
    p_story_id: b.storyId,
    p_status: b.status,
    p_note: b.note,
    p_expected_updated_at: b.expectedUpdatedAt,
  });
  if (error) return mutationError(error);
  return NextResponse.json(
    { result: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function GET(request: Request) {
  if (!(await requireServerAdmin("content")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const status = params.get("status") || "pending";
  const page = Number(params.get("page") || 1);
  if (
    !["pending", "approved", "rejected", "all"].includes(status) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000
  )
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc("admin_stories_list", {
    p_status: status,
    p_page: page,
  });
  if (error) return mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
