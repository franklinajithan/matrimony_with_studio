import { NextResponse } from "next/server";
import { z } from "zod";
import { billingConfigured } from "@/lib/subscriptions/checkout";
import { getServerSubscription } from "@/lib/subscriptions/server";
import {
  getStripe,
  providerError,
  isProviderTestMember,
} from "@/lib/providers/stripe";
import { validOrigin } from "@/lib/admin/http";
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const { user, subscription } = await getServerSubscription();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!billingConfigured() || !subscription?.provider_subscription_id)
    return NextResponse.json(
      { error: "No provider subscription is available" },
      { status: 503 },
    );
  if (!isProviderTestMember(user.id))
    return NextResponse.json(
      {
        error: "Sandbox billing is available only to authorised test accounts.",
      },
      { status: 403 },
    );
  try {
    const parsed = z
      .object({
        cancel: z.boolean().default(true),
        requestId: z.string().uuid(),
      })
      .safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid renewal request" },
        { status: 400 },
      );
    const stripe = getStripe();
    const current = await stripe.subscriptions.retrieve(
      subscription.provider_subscription_id,
    );
    const customer =
      typeof current.customer === "string"
        ? current.customer
        : current.customer.id;
    if (current.livemode || customer !== subscription.provider_customer_id)
      return NextResponse.json(
        { error: "Subscription ownership could not be confirmed" },
        { status: 403 },
      );
    await stripe.subscriptions.update(
      current.id,
      { cancel_at_period_end: parsed.data.cancel },
      { idempotencyKey: `member-renewal:${user.id}:${parsed.data.requestId}` },
    );
    return NextResponse.json({
      requested: true,
      message: parsed.data.cancel
        ? "Cancellation requested at the end of your paid period. Status updates after the verified provider event."
        : "Renewal resume requested. Status updates after the verified provider event.",
    });
  } catch {
    return NextResponse.json({ error: providerError() }, { status: 503 });
  }
}
