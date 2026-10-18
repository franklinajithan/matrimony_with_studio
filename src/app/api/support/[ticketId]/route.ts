import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ ticketId: string }> };
export async function GET(request: Request, context: Context) {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json(
      { error: "Sign in to contact support" },
      { status: 401 },
    );

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
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json(
      { error: "Sign in to contact support" },
      { status: 401 },
    );

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
