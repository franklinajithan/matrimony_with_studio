import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError } from "@/lib/admin/http";
import {
  isProviderTestMember,
  stripeTestConfigured,
} from "@/lib/providers/stripe";
import { serviceConfigured } from "@/lib/supabase/service";
export async function GET(request: Request) {
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user)
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  const memberId = new URL(request.url).searchParams.get("memberId");
  if (memberId && !/^[0-9a-f-]{36}$/i.test(memberId))
    return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  const result = await db.rpc("identity_status", {
    p_member_id: memberId || null,
  });
  if (result.error) return mutationError(result.error);
  return NextResponse.json(
    {
      ...result.data,
      optional: true,
      enabled:
        process.env.IDENTITY_ENABLED === "true" &&
        stripeTestConfigured() &&
        serviceConfigured() &&
        !!process.env.STRIPE_IDENTITY_WEBHOOK_SECRET &&
        isProviderTestMember(data.user.id),
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
