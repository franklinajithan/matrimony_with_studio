import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
import { requireServerAdmin } from "@/lib/auth/admin";
export async function GET(request: Request) {
  if (!(await requireServerAdmin("support")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const params = new URL(request.url).searchParams;
  const parsed = z
    .object({
      status: z.enum([
        "all",
        "open",
        "in_progress",
        "waiting_on_member",
        "resolved",
      ]),
      search: z.string().max(100),
      page: z.coerce.number().int().min(1).max(100000),
    })
    .safeParse({
      status: params.get("status") || "all",
      search: params.get("search") || "",
      page: params.get("page") || 1,
    });
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  const f = parsed.data;
  const { data, error } = await db.rpc("support_tickets_list", {
    p_staff: true,
    p_status: f.status,
    p_search: f.search,
    p_page: f.page,
  });
  if (error) return mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
