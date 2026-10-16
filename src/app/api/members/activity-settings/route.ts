import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await db.rpc("profile_activity_settings", {
    p_incognito: null,
  });
  if (error) return mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request) {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const parsed = z
    .object({ incognito: z.boolean() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  const { data, error } = await db.rpc("profile_activity_settings", {
    p_incognito: parsed.data.incognito,
  });
  if (error) return mutationError(error);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
