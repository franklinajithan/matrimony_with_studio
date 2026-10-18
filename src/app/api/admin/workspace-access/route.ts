import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET() {
  if (!(await requireServerAdmin("workspace")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const scopes = [
    "manage",
    "members",
    "moderation",
    "content",
    "billing",
    "notifications",
    "member_read",
    "notes",
    "support",
  ] as const;
  try {
    const results = await Promise.all(
      scopes.map(async (permission) => {
        const { data, error } = await db.rpc("admin_has_permission", {
          p_permission: permission,
        });
        if (error) throw new Error("Permissions unavailable");
        return data === true ? permission : null;
      }),
    );
    return NextResponse.json(
      { permissions: results.filter(Boolean) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Permissions unavailable" },
      { status: 503 },
    );
  }
}
