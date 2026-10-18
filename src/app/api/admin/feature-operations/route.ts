import { NextResponse } from "next/server";
import { z } from "zod";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validOrigin, mutationError } from "@/lib/admin/http";
const section = z.enum([
  "deletion",
  "identity",
  "family",
  "plans",
  "calls",
  "attachments",
  "payments",
]);
export async function GET(request: Request) {
  if (!(await requireServerAdmin("workspace")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const query = new URL(request.url).searchParams;
  const parsed = z
    .object({
      section,
      page: z.coerce.number().int().min(1).max(100000),
      search: z.string().max(100),
    })
    .safeParse({
      section: query.get("section"),
      page: query.get("page") || 1,
      search: query.get("search") || "",
    });
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  const db = await createSupabaseServerClient();
  const result = await db.rpc("feature_operations", {
    p_section: parsed.data.section,
    p_page: parsed.data.page,
    p_search: parsed.data.search,
  });
  if (result.error) return mutationError(result.error);
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(request: Request) {
  if (!(await requireServerAdmin("moderation")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = z
    .object({
      section: z.enum(["family", "plans", "calls", "attachments"]),
      id: z.string().min(1).max(80),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a reason of at least 10 characters" },
      { status: 400 },
    );
  const db = await createSupabaseServerClient();
  const result = await db.rpc("moderate_feature", {
    p_section: parsed.data.section,
    p_id: parsed.data.id,
    p_reason: parsed.data.reason,
  });
  if (result.error) return mutationError(result.error);
  return NextResponse.json({ saved: true });
}
