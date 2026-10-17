import { NextResponse } from "next/server";
import { getStripe, isProviderTestMember } from "@/lib/providers/stripe";
import { serviceClient } from "@/lib/supabase/service";
import type Stripe from "stripe";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.STRIPE_IDENTITY_WEBHOOK_SECRET)
    return NextResponse.json(
      { error: "Identity webhook unavailable" },
      { status: 503 },
    );
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
      process.env.STRIPE_IDENTITY_WEBHOOK_SECRET,
    );
    if (event.livemode) throw new Error("Live mode disabled");
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature or mode" },
      { status: 400 },
    );
  }
  if (!event.type.startsWith("identity.verification_session."))
    return NextResponse.json({ received: true, ignored: true });
  try {
    const ref = event.data.object as Stripe.Identity.VerificationSession;
    const session = await stripe.identity.verificationSessions.retrieve(ref.id);
    if (
      !isProviderTestMember(
        session.metadata?.member_id || session.client_reference_id || "",
      )
    )
      throw new Error("Unauthorised sandbox member");
    const result = await serviceClient().rpc("apply_identity_event", {
      p_event_id: event.id,
      p_session_id: session.id,
      p_status: session.status,
      p_livemode: session.livemode,
      p_error: session.last_error?.code || null,
    });
    if (result.error) throw result.error;
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Identity status could not be stored; retry event delivery" },
      { status: 503 },
    );
  }
}
