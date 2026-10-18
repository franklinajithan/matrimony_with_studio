import { NextResponse } from "next/server";
import { z } from "zod";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
export async function POST(request: Request) {
  if (!(await requireServerAdmin("manage")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const input = z
    .object({
      memberId: z.string().uuid(),
      requestedAt: z.string().datetime({ offset: true }),
      reason: z.string().trim().min(20).max(500),
      retentionReviewed: z.literal(true),
      confirmation: z.literal("APPROVE ERASURE"),
    })
    .safeParse(await request.json().catch(() => null));
  if (!input.success)
    return NextResponse.json(
      {
        error:
          "Review retention, billing and safety holds; provide confirmation and reason",
      },
      { status: 400 },
    );
  const db = await createSupabaseServerClient();
  const result = await db.rpc("approve_account_deletion", {
    p_member: input.data.memberId,
    p_requested_at: input.data.requestedAt,
    p_reason: input.data.reason,
  });
  if (result.error) return mutationError(result.error);
  return NextResponse.json({
    ...result.data,
    message:
      "Approved for processing. Data has not yet been erased. The worker remains disabled until retention and provider setup are complete.",
  });
}
