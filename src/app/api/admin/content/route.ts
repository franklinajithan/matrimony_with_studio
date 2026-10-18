import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
export const dynamic = "force-dynamic";
import { mutationError, validOrigin } from "@/lib/admin/http";
const input = z.object({
  memberId: z.string().uuid(),
  kind: z.enum(["photo", "bio", "unpublish"]),
  content: z.string().max(20000).nullable(),
  reason: z.string().trim().min(10).max(1000),
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
  const { data, error } = await db.rpc("admin_moderate_content", {
    p_member_id: b.memberId,
    p_kind: b.kind,
    p_content: b.content,
    p_reason: b.reason,
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
  const parsed = z
    .object({
      search: z.string().max(100),
      page: z.coerce.number().int().min(1).max(100000),
    })
    .safeParse({
      search: params.get("search") || "",
      page: params.get("page") || 1,
    });
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc("admin_content_queue", {
    p_search: parsed.data.search,
    p_page: parsed.data.page,
  });
  if (error) return mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
