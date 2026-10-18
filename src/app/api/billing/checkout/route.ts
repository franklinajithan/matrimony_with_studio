import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertBillingConfiguration,
  billingConfigured,
} from "@/lib/subscriptions/checkout";
import { getServerSubscription } from "@/lib/subscriptions/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { validOrigin, mutationError } from "@/lib/admin/http";
import {
  getStripe,
  isProviderTestMember,
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
  if (!isProviderTestMember(user.id))
    return NextResponse.json(
      {
        error:
          "Sandbox checkout is available only to authorised test accounts.",
      },
      { status: 403 },
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
  const service = serviceClient();
  const { requestId, plan, term } = parsed.data;
  const lock = await service.rpc("billing_checkout_lock", { p_member: user.id, p_request: requestId, p_release: false });
  if (lock.error) return mutationError(lock.error);
  if (!lock.data) return NextResponse.json({ error: "Another checkout is being prepared. Please retry shortly." }, { status: 409 });
  try {
    assertBillingConfiguration(plan, term);
    const price = await validatedPrice(plan, term);
    const stripe = getStripe();
    const binding = await service.rpc("billing_customer", { p_member: user.id, p_customer: null });
    if (binding.error) throw binding.error;
    let customerId = binding.data as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { member_id: user.id } }, { idempotencyKey: `member-customer:${user.id}` });
      const saved = await service.rpc("billing_customer", { p_member: user.id, p_customer: customer.id });
      if (saved.error || saved.data !== customer.id) throw new Error("Customer binding failed");
      customerId = customer.id;
    }
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
    if (subscriptions.has_more || subscriptions.data.some(s => !["canceled", "incomplete_expired"].includes(s.status))) return NextResponse.json({ error: "An existing or pending subscription is present. Manage billing through the portal or contact support." }, { status: 409 });
    const open = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 });
    if (open.has_more) throw new Error("Too many pending checkout sessions");
    for (const pending of open.data) {
      if (pending.livemode || pending.client_reference_id !== user.id) throw new Error("Checkout owner mismatch");
      if (pending.metadata?.plan === plan && pending.metadata?.term === term && pending.url) return NextResponse.json({ url: pending.url, testMode: true });
      await stripe.checkout.sessions.expire(pending.id);
    }
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        client_reference_id: user.id,
        customer: customerId,
        allow_promotion_codes: true,
        metadata: { member_id: user.id, plan, term },
        subscription_data: { metadata: { member_id: user.id } },
        success_url: `${origin}/membership?checkout=returned&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/membership?checkout=cancelled`,
      },
      { idempotencyKey: `checkout:${user.id}:${requestId}` },
    );
    return NextResponse.json({ url: session.url, testMode: true });
  } catch {
    return NextResponse.json({ error: providerError() }, { status: 503 });
  } finally {
    await service.rpc("billing_checkout_lock", { p_member: user.id, p_request: requestId, p_release: true });
  }
}
