import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validOrigin, mutationError } from "@/lib/admin/http";
const input = z.object({
  action: z.enum([
    "account",
    "preferences",
    "deactivate",
    "reactivate",
    "request_deletion",
    "cancel_deletion",
    "export",
    "plan_list",
    "plan_save",
    "plan_share",
    "plan_unshare",
    "family_list",
    "family_invite",
    "family_respond",
    "family_revoke",
    "family_permissions",
    "family_post",
    "family_activity",
  ]),
  payload: z.record(z.unknown()).default({}),
});
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { data, error: authError } = await db.auth.getUser();
  if (authError || !data.user)
    return NextResponse.json(
      { error: "Your session expired. Sign in again." },
      { status: 401 },
    );
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 32000)
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  const parsed = input.safeParse(
    (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })(),
  );
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { data: result, error } = await db.rpc("member_workspace", {
    p_action: parsed.data.action,
    p_payload: parsed.data.payload,
  });
  if (error) return mutationError(error);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
