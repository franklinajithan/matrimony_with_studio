import { NextResponse } from "next/server";
import { billingConfigured } from "@/lib/subscriptions/checkout";
export async function GET() {
  return NextResponse.json(
    {
      configured: billingConfigured(),
      checkoutEnabled: billingConfigured(),
      webhookEnabled: billingConfigured(),
      portalEnabled: billingConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
