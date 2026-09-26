import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const memberId = new URL(request.url).searchParams.get("memberId");
  if (!memberId || !uuid.test(memberId)) return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  try {
    const supabase = await createSupabaseServerClient();
    const [connections, subscriptions] = await Promise.all([
      supabase.from("connections").select("id,member_a_id,member_b_id,connected_at")
        .or(`member_a_id.eq.${memberId},member_b_id.eq.${memberId}`)
        .order("connected_at", { ascending: false }).limit(100),
      supabase.from("user_subscriptions").select("id,plan_code,status,provider,current_period_start,current_period_end,cancel_at_period_end,created_at")
        .eq("user_id", memberId).order("created_at", { ascending: false }).limit(30),
    ]);
    if (connections.error || subscriptions.error) throw new Error("Member operations unavailable");
    const otherIds = [...new Set((connections.data ?? []).map(c => c.member_a_id === memberId ? c.member_b_id : c.member_a_id))];
    const people = otherIds.length ? await supabase.from("profiles").select("id,display_name").in("id", otherIds) : { data: [], error: null };
    if (people.error) throw new Error("Connection details unavailable");
    const names = new Map((people.data ?? []).map(p => [p.id, p.display_name]));
    return NextResponse.json({
      connections: (connections.data ?? []).map(c => ({ id: c.id, memberId: c.member_a_id === memberId ? c.member_b_id : c.member_a_id,
        displayName: names.get(c.member_a_id === memberId ? c.member_b_id : c.member_a_id) || "Member", connectedAt: c.connected_at })),
      subscriptions: subscriptions.data ?? [],
      connectionsShown: connections.data?.length ?? 0,
      connectionsLimit: 100,
      paymentHistoryAvailable: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load member operations" }, { status: 503 });
  }
}
