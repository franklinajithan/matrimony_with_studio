import { NextResponse } from "next/server";
import { z } from "zod";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const reviewInput = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().min(10).max(1000),
}).strict();

export async function POST(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403, headers });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers }); }
  const parsed = reviewInput.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Choose a decision and give a review reason (10–1000 characters)" }, { status: 400, headers });
  const { requestId, decision, note } = parsed.data;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("review_profile_verification_request", {
      p_request_id: requestId, p_decision: decision, p_reviewer_note: note,
    });
    if (error) {
      const status = error.code === "23505" ? 409 : error.code === "P0002" ? 404 : error.code === "42501" ? 403 : 503;
      const message = status === 409 ? "Request already reviewed. Refresh before reviewing another request."
        : status === 404 ? "Request no longer available. Refresh the queue."
        : status === 403 ? "Review permission expired. Sign in again."
        : "Unable to record review. Check the queue before retrying.";
      return NextResponse.json({ error: message }, { status, headers });
    }
    // Do not show success when the RPC did not return the persisted decision.
    if (data?.id !== requestId || data?.status !== decision) throw new Error("Invalid review result");
    return NextResponse.json({ review: { id: data.id, status: data.status } }, { headers });
  } catch {
    return NextResponse.json({ error: "Unable to confirm review. Refresh the queue before retrying." }, { status: 503, headers });
  }
}
