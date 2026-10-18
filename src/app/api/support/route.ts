import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json(
      { error: "Sign in to contact support" },
      { status: 401 },
    );

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
    p_staff: false,
    p_status: f.status,
    p_search: f.search,
    p_page: f.page,
  });
  if (error) return mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json(
      { error: "Sign in to contact support" },
      { status: 401 },
    );
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = z
    .object({
      category: z.enum([
        "account",
        "profile",
        "billing",
        "safety",
        "feedback",
        "other",
      ]),
      subject: z.string().trim().min(5).max(150),
      body: z.string().trim().min(10).max(4000),
      requestId: z.string().uuid(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Enter a subject (5–150 characters) and message (10–4000 characters).",
      },
      { status: 400 },
    );
  const b = parsed.data;
  const { data, error } = await db.rpc("create_support_ticket", {
    p_category: b.category,
    p_subject: b.subject,
    p_body: b.body,
    p_request_id: b.requestId,
  });
  if (error)
    return error.code === "P0001"
      ? NextResponse.json(
          {
            error:
              "You can create up to 3 requests per day. Reply to an existing request for further help.",
          },
          { status: 429 },
        )
      : mutationError(error);
  return NextResponse.json(
    { id: data },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
