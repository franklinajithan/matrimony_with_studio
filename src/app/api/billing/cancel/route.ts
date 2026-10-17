import { NextResponse } from "next/server";
import { billingConfigured } from "@/lib/subscriptions/checkout";
import { getServerSubscription } from "@/lib/subscriptions/server";
import { getStripe, providerError } from "@/lib/providers/stripe";
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
  try {
    const stripe = getStripe();
    const current = await stripe.subscriptions.retrieve(
      subscription.provider_subscription_id,
    );
    if (current.customer !== subscription.provider_customer_id)
      return NextResponse.json(
        { error: "Subscription ownership could not be confirmed" },
        { status: 403 },
      );
    await stripe.subscriptions.update(
      current.id,
      { cancel_at_period_end: true },
      { idempotencyKey: `member-cancel:${user.id}:${current.id}` },
    );
    return NextResponse.json({
      requested: true,
      message:
        "Cancellation requested at the end of your paid period. Membership status updates after the verified provider event.",
    });
  } catch {
    return NextResponse.json({ error: providerError() }, { status: 503 });
  }
}
