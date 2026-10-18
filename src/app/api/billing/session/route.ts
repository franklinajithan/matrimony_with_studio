import { NextResponse } from "next/server";
import { billingConfigured } from "@/lib/subscriptions/checkout";
import { getServerSubscription } from "@/lib/subscriptions/server";
import { getStripe, isProviderTestMember, providerError } from "@/lib/providers/stripe";
export async function GET(request: Request) {
  const { user, subscription, plan } = await getServerSubscription();
  if (!user) return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  if (!billingConfigured() || !isProviderTestMember(user.id)) return NextResponse.json({ error: "Test checkout status is unavailable" }, { status: 503 });
  const id = new URL(request.url).searchParams.get("session_id") || "";
  if (!/^cs_test_[a-zA-Z0-9]{1,200}$/.test(id)) return NextResponse.json({ error: "Invalid checkout reference" }, { status: 400 });
  try {
    const session = await getStripe().checkout.sessions.retrieve(id);
    if (session.livemode || session.client_reference_id !== user.id || session.metadata?.member_id !== user.id) return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    return NextResponse.json({ status: session.status, paymentStatus: session.payment_status, synchronized: !!subId && subId === subscription?.provider_subscription_id, plan: plan.code, testMode: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: providerError() }, { status: 503 }); }
}
