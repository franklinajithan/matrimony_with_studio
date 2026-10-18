import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
import { requireServerAdmin } from "@/lib/auth/admin";
type Context = { params: Promise<{ ticketId: string }> };
export async function GET(request: Request, context: Context) {
  if (!(await requireServerAdmin("support")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { ticketId } = await context.params;
  if (!z.string().uuid().safeParse(ticketId).success)
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  const { data, error } = await db.rpc("support_ticket_thread", {
    p_ticket_id: ticketId,
  });
  if (error)
    return error.code === "P0001"
      ? NextResponse.json(
          { error: "Reply limit reached. Please try again later." },
          { status: 429 },
        )
      : mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request, context: Context) {
  if (!(await requireServerAdmin("support")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { ticketId } = await context.params;
  if (!z.string().uuid().safeParse(ticketId).success)
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = z
    .object({
      body: z.string().trim().min(1).max(4000),
      requestId: z.string().uuid(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check the required fields and try again." },
      { status: 400 },
    );
  const b = parsed.data;
  const { data, error } = await db.rpc("reply_support_ticket", {
    p_ticket_id: ticketId,
    p_body: b.body,
    p_request_id: b.requestId,
  });
  if (error)
    return error.code === "P0001"
      ? NextResponse.json(
          { error: "Reply limit reached. Please try again later." },
          { status: 429 },
        )
      : mutationError(error);
  return NextResponse.json(
    { result: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PATCH(request: Request, context: Context) {
  if (!(await requireServerAdmin("support")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { ticketId } = await context.params;
  if (!z.string().uuid().safeParse(ticketId).success)
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = z
    .object({
      status: z.enum(["open", "in_progress", "waiting_on_member", "resolved"]),
      claim: z.boolean().nullable(),
      reason: z.string().trim().min(10).max(1000),
      expectedUpdatedAt: z.string().datetime({ offset: true }),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Check the required fields and try again." },
      { status: 400 },
    );
  const b = parsed.data;
  const { data, error } = await db.rpc("update_support_ticket", {
    p_ticket_id: ticketId,
    p_status: b.status,
    p_claim: b.claim,
    p_reason: b.reason,
    p_expected_updated_at: b.expectedUpdatedAt,
  });
  if (error)
    return error.code === "P0001"
      ? NextResponse.json(
          { error: "Reply limit reached. Please try again later." },
          { status: 429 },
        )
      : mutationError(error);
  return NextResponse.json(
    { result: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
