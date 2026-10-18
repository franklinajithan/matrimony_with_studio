import { NextResponse } from "next/server";
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
  if (!billingConfigured() || !subscription?.provider_customer_id)
    return NextResponse.json(
      { error: "Billing portal is unavailable" },
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
    const portal = await getStripe().billingPortal.sessions.create({
      customer: subscription.provider_customer_id,
      return_url: `${new URL(request.url).origin}/membership`,
    });
    return NextResponse.json({ url: portal.url, testMode: true });
  } catch {
    return NextResponse.json({ error: providerError() }, { status: 503 });
  }
}
