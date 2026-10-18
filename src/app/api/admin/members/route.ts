import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError } from "@/lib/admin/http";
import { z } from "zod";
export async function GET(request: Request) {
  if (!(await requireServerAdmin("members")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const parsed = z
    .object({
      filter: z.enum([
        "all",
        "verified",
        "unverified",
        "admins",
        "published",
        "unpublished",
        "suspended",
      ]),
      search: z.string().max(100),
      sort: z.enum(["newest", "oldest", "name"]),
      page: z.coerce.number().int().min(1).max(100000),
    })
    .safeParse({
      filter: params.get("filter") || "all",
      search: params.get("search") || "",
      sort: params.get("sort") || "newest",
      page: params.get("page") || 1,
    });
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid member filters" },
      { status: 400 },
    );
  const f = parsed.data;
  const db = await createSupabaseServerClient();
  const { data, error } = await db.rpc("admin_members_list", {
    p_filter: f.filter,
    p_search: f.search.trim(),
    p_sort: f.sort,
    p_page: f.page,
  });
  if (error) return mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
