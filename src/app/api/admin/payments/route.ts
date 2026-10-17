import { NextResponse } from "next/server";
import { z } from "zod";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serviceClient, serviceConfigured } from "@/lib/supabase/service";
import { getStripe, providerError } from "@/lib/providers/stripe";
import { billingConfigured } from "@/lib/subscriptions/checkout";
import { validOrigin, mutationError } from "@/lib/admin/http";
const Input = z.object({
  memberId: z.string().uuid(),
  action: z.enum(["refund", "cancel_subscription"]),
  chargeId: z
    .string()
    .regex(/^ch_[a-zA-Z0-9]+$/)
    .optional(),
  amount: z.number().int().positive().max(1000000).optional(),
  reason: z.string().trim().min(10).max(500),
  requestId: z.string().uuid(),
});
export async function POST(request: Request) {
  const actor = await requireServerAdmin("billing");
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (!billingConfigured() || !serviceConfigured())
    return NextResponse.json(
      { error: "Stripe test billing is not configured" },
      { status: 503 },
    );
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a member, action, provider charge and audit reason" },
      { status: 400 },
    );
  const b = parsed.data;
  if (b.memberId === actor.id)
    return NextResponse.json(
      { error: "Cannot administer your own billing" },
      { status: 403 },
    );
  const db = await createSupabaseServerClient();
  const prepared = await db.rpc("prepare_provider_operation", {
    p_member_id: b.memberId,
    p_action: b.action,
    p_reason: b.reason,
    p_request_id: b.requestId,
  });
  if (prepared.error) return mutationError(prepared.error);
  try {
    const service = serviceClient();
    const sub = await service
      .from("user_subscriptions")
      .select("provider_customer_id,provider_subscription_id")
      .eq("user_id", b.memberId)
      .eq("provider", "stripe")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub.error || !sub.data?.provider_customer_id)
      throw new Error("No provider record");
    const stripe = getStripe();
    let reference: string;
    if (b.action === "refund") {
      if (!b.chargeId || !b.amount)
        return NextResponse.json(
          { error: "Provider charge and amount in pence are required" },
          { status: 400 },
        );
      const charge = await stripe.charges.retrieve(b.chargeId);
      const customer =
        typeof charge.customer === "string"
          ? charge.customer
          : charge.customer?.id;
      if (
        charge.livemode ||
        customer !== sub.data.provider_customer_id ||
        charge.currency !== "gbp" ||
        !charge.paid ||
        b.amount > charge.amount - charge.amount_refunded
      )
        return NextResponse.json(
          {
            error:
              "The charge, ownership, currency or available refund amount could not be validated",
          },
          { status: 400 },
        );
      const refund = await stripe.refunds.create(
        {
          charge: charge.id,
          amount: b.amount,
          reason: "requested_by_customer",
          metadata: { operation_id: b.requestId },
        },
        { idempotencyKey: `refund:${b.requestId}` },
      );
      reference = refund.id;
    } else {
      const subscription = await stripe.subscriptions.retrieve(
        sub.data.provider_subscription_id,
      );
      if (subscription.customer !== sub.data.provider_customer_id)
        throw new Error("Owner mismatch");
      await stripe.subscriptions.update(
        subscription.id,
        { cancel_at_period_end: true },
        { idempotencyKey: `admin-cancel:${b.requestId}` },
      );
      reference = subscription.id;
    }
    const final = await service.rpc("complete_provider_operation", {
      p_id: b.requestId,
      p_status: "succeeded",
      p_reference: reference,
    });
    if (final.error) throw final.error;
    return NextResponse.json({ requested: true, reference, testMode: true });
  } catch {
    await serviceClient().rpc("complete_provider_operation", {
      p_id: b.requestId,
      p_status: "failed",
      p_reference: "provider_error",
    });
    return NextResponse.json({ error: providerError() }, { status: 503 });
  }
}
