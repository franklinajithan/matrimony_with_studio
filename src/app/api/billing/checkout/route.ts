import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertBillingConfiguration,
  billingConfigured,
} from "@/lib/subscriptions/checkout";
import { getServerSubscription } from "@/lib/subscriptions/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validOrigin, mutationError } from "@/lib/admin/http";
import {
  getStripe,
  validatedPrice,
  providerError,
} from "@/lib/providers/stripe";
const Input = z.object({
  plan: z.enum(["premium", "premium_plus"]),
  term: z.enum(["monthly", "three_months", "six_months"]),
  requestId: z.string().uuid(),
});
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { user, subscription } = await getServerSubscription();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to choose a plan" },
      { status: 401 },
    );
  if (!billingConfigured())
    return NextResponse.json(
      { error: "Test checkout is not configured. No payment will be taken." },
      { status: 503 },
    );
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid plan or billing term" },
      { status: 400 },
    );
  if (
    subscription &&
    ["active", "trialing", "past_due"].includes(subscription.status)
  )
    return NextResponse.json(
      {
        error: "Manage your existing subscription through the billing portal.",
      },
      { status: 409 },
    );
  const db = await createSupabaseServerClient();
  const attempt = await db.rpc("reserve_integration_attempt", {
    p_kind: "checkout",
  });
  if (attempt.error) return mutationError(attempt.error);
  try {
    const { plan, term, requestId } = parsed.data;
    assertBillingConfiguration(plan, term);
    const price = await validatedPrice(plan, term);
    const origin = new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        client_reference_id: user.id,
        customer_email: user.email,
        metadata: { member_id: user.id },
        subscription_data: { metadata: { member_id: user.id } },
        success_url: `${origin}/membership?checkout=returned`,
        cancel_url: `${origin}/membership?checkout=cancelled`,
      },
      { idempotencyKey: `checkout:${user.id}:${requestId}` },
    );
    return NextResponse.json({ url: session.url, testMode: true });
  } catch {
    return NextResponse.json({ error: providerError() }, { status: 503 });
  }
}
