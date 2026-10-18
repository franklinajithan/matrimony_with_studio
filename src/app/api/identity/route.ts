import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serviceClient, serviceConfigured } from "@/lib/supabase/service";
import {
  getStripe,
  isProviderTestMember,
  providerError,
  stripeTestConfigured,
} from "@/lib/providers/stripe";
import { mutationError, validOrigin } from "@/lib/admin/http";
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user)
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  if (!isProviderTestMember(data.user.id))
    return NextResponse.json(
      {
        error:
          "Sandbox verification is available only to authorised test accounts.",
      },
      { status: 403 },
    );
  if (
    process.env.IDENTITY_ENABLED !== "true" ||
    !serviceConfigured() ||
    !stripeTestConfigured() ||
    !process.env.STRIPE_IDENTITY_WEBHOOK_SECRET
  )
    return NextResponse.json(
      {
        error:
          "Identity verification is unavailable until the provider is configured and tested.",
      },
      { status: 503 },
    );
  const parsed = z
    .object({ consent: z.literal(true), requestId: z.string().uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Consent is required before continuing to the verification provider.",
      },
      { status: 400 },
    );
  const attempt = await db.rpc("reserve_integration_attempt", {
    p_kind: "identity",
  });
  if (attempt.error) return mutationError(attempt.error);
  try {
    const service = serviceClient();
    const stripe = getStripe();
    const existing = await service
      .from("identity_sessions")
      .select("provider_session_id,status")
      .eq("member_id", data.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (
      existing.data?.status === "processing" ||
      existing.data?.status === "verified"
    )
      return NextResponse.json(
        {
          error:
            "Your existing verification is processing or already completed. Refresh your status.",
        },
        { status: 409 },
      );
    if (existing.data?.status === "requires_input") {
      const current = await stripe.identity.verificationSessions.retrieve(
        existing.data.provider_session_id,
      );
      if (current.url)
        return NextResponse.json({ url: current.url, testMode: true });
    }
    const session = await stripe.identity.verificationSessions.create(
      {
        type: "document",
        client_reference_id: data.user.id,
        metadata: { member_id: data.user.id },
        options: { document: { require_matching_selfie: true } },
        return_url: `${new URL(request.url).origin}/verification?identity=returned`,
      },
      { idempotencyKey: `identity:${data.user.id}:${parsed.data.requestId}` },
    );
    const saved = await service.from("identity_sessions").upsert(
      {
        member_id: data.user.id,
        provider_session_id: session.id,
        status: session.status,
        livemode: session.livemode,
      },
      { onConflict: "provider_session_id", ignoreDuplicates: true },
    );
    if (saved.error) throw saved.error;
    return NextResponse.json({ url: session.url, testMode: true });
  } catch {
    return NextResponse.json({ error: providerError() }, { status: 503 });
  }
}
