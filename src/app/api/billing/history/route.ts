import { NextResponse } from "next/server";
import { billingConfigured } from "@/lib/subscriptions/checkout";
import { getServerSubscription } from "@/lib/subscriptions/server";
import { isProviderTestMember, providerError } from "@/lib/providers/stripe";
import { billingHistory } from "@/lib/providers/billing-history";
export async function GET(request: Request) {
  const { user, subscription } = await getServerSubscription();
  if (!user)
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  const after = new URL(request.url).searchParams.get("after") || undefined;
  if (after && !/^in_[a-zA-Z0-9]{1,100}$/.test(after))
    return NextResponse.json(
      { error: "Invalid invoice cursor" },
      { status: 400 },
    );
  if (!billingConfigured() || !isProviderTestMember(user.id))
    return NextResponse.json(
      { error: "Test invoice history is unavailable for this account" },
      { status: 503 },
    );
  try {
    const result = subscription?.provider_customer_id
      ? await billingHistory(subscription.provider_customer_id, after)
      : { invoices: [], next: null, testMode: true };
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: providerError() }, { status: 503 });
  }
}
