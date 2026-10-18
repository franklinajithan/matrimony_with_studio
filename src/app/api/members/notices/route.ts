import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
export async function GET() {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { data, error } = await db
    .from("member_notices")
    .select("id,title,body,created_at,read_at")
    .eq("member_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error)
    return NextResponse.json(
      { error: "Unable to load notices" },
      { status: 503 },
    );
  return NextResponse.json(
    { notices: data ?? [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PATCH(request: Request) {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const parsed = z
    .object({ id: z.string().uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid notice" }, { status: 400 });
  const { data, error } = await db.rpc("mark_member_notice_read", {
    p_notice_id: parsed.data.id,
  });
  if (error)
    return NextResponse.json(
      { error: "Unable to update notice" },
      { status: 503 },
    );
  if (data !== true)
    return NextResponse.json({ error: "Notice not found" }, { status: 404 });
  return NextResponse.json({ updated: true });
}
