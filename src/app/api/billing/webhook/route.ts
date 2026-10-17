import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  priceMapping,
  validatedPrice,
} from "@/lib/providers/stripe";
import { serviceClient } from "@/lib/supabase/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 1048576)
    return NextResponse.json({ error: "Event too large" }, { status: 413 });
  let event: Stripe.Event;
  let stripe;
  try {
    stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      raw,
      request.headers.get("stripe-signature") || "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
    if (event.livemode) throw new Error("Live mode disabled");
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature or mode" },
      { status: 400 },
    );
  }
  try {
    let subscriptionId: string | null = null;
    if (event.type.startsWith("customer.subscription."))
      subscriptionId = (event.data.object as Stripe.Subscription).id;
    else if (event.type === "checkout.session.completed")
      subscriptionId =
        typeof (event.data.object as Stripe.Checkout.Session).subscription ===
        "string"
          ? ((event.data.object as Stripe.Checkout.Session)
              .subscription as string)
          : null;
    else if (event.type.startsWith("invoice.")) {
      const invoice = event.data.object as Stripe.Invoice;
      const ref = invoice.parent?.subscription_details?.subscription;
      subscriptionId = typeof ref === "string" ? ref : ref?.id || null;
    }
    if (!subscriptionId)
      return NextResponse.json({ received: true, ignored: true });
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const item = subscription.items.data[0],
      mapping = item && priceMapping(item.price.id),
      memberId = subscription.metadata.member_id;
    if (!mapping || subscription.items.data.length !== 1 || !memberId || !item)
      throw new Error("Unrecognized subscription");
    await validatedPrice(mapping.plan, mapping.term);
    const status =
      subscription.status === "active"
        ? "active"
        : subscription.status === "trialing"
          ? "trialing"
          : subscription.status === "past_due"
            ? "past_due"
            : subscription.status === "canceled"
              ? "cancelled"
              : "expired";
    const db = serviceClient();
    const { error } = await db.rpc("apply_stripe_subscription", {
      p_event_id: event.id,
      p_event_type: event.type,
      p_member_id: memberId,
      p_subscription_id: subscription.id,
      p_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      p_plan: mapping.plan,
      p_status: status,
      p_start: new Date(item.current_period_start * 1000).toISOString(),
      p_end: new Date(item.current_period_end * 1000).toISOString(),
      p_cancel: subscription.cancel_at_period_end,
      p_event_created: event.created,
    });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Provider state could not be stored; retry event delivery" },
      { status: 503 },
    );
  }
}
