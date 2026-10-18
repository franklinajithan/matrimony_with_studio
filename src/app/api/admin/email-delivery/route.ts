import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError } from "@/lib/admin/http";
export async function GET(request: Request) {
  if (!(await requireServerAdmin("notifications"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const page = Number(new URL(request.url).searchParams.get("page") || 1);
  if (!Number.isInteger(page) || page < 1 || page > 100000) return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  const db = await createSupabaseServerClient(); const result = await db.rpc("email_delivery_admin", { p_page: page });
  if (result.error) return mutationError(result.error);
  return NextResponse.json(result.data, { headers: { "Cache-Control": "private, no-store" } });
}
