import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const page = Number(new URL(request.url).searchParams.get("page") || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000)
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  const { data, error } = await db.rpc("profile_visitors", { p_page: page });
  if (error) return mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = z
    .object({ memberId: z.string().uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  const { error } = await db.rpc("record_profile_visit", {
    p_viewed_id: parsed.data.memberId,
  });
  if (error) return mutationError(error);
  return NextResponse.json(
    { accepted: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
