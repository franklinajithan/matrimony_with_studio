import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const pageSize = 20;
export async function GET(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  const params = new URL(request.url).searchParams;
  function offset(name: string) {
    const raw = params.get(name) ?? "0";
    return /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : -1;
  }
  const profileOffset = offset("profileOffset");
  const requestOffset = offset("requestOffset");
  if (profileOffset < 0 || requestOffset < 0 || profileOffset > Number.MAX_SAFE_INTEGER - pageSize || requestOffset > Number.MAX_SAFE_INTEGER - pageSize)
    return NextResponse.json({ error: "Invalid queue page" }, { status: 400, headers });
  try {
    const supabase = await createSupabaseServerClient();
    // One extra row indicates whether a next page exists. ID breaks timestamp ties.
    const [profiles, requests] = await Promise.all([
      supabase.from("profiles").select("id,display_name,created_at")
        .eq("is_published", true).eq("is_verified", false).eq("is_admin", false)
        .order("created_at", { ascending: true }).order("id", { ascending: true })
        .range(profileOffset, profileOffset + pageSize),
      supabase.from("verification_requests").select("id,member_id,member_note,created_at,status")
        .eq("status", "pending").order("created_at", { ascending: true }).order("id", { ascending: true })
        .range(requestOffset, requestOffset + pageSize),
    ]);
    if (profiles.error || requests.error) throw new Error("Queue unavailable");
    return NextResponse.json({
      profiles: (profiles.data ?? []).slice(0, pageSize),
      requests: (requests.data ?? []).slice(0, pageSize),
      hasMoreProfiles: (profiles.data?.length ?? 0) > pageSize,
      hasMoreRequests: (requests.data?.length ?? 0) > pageSize,
    }, { headers });
  } catch {
    return NextResponse.json({ error: "Verification backlog unavailable" }, { status: 503, headers });
  }
}
