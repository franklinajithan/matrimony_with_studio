import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validOrigin, mutationError } from "@/lib/admin/http";
const input = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send"),
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  }),
  z.object({
    action: z.literal("verify"),
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
    token: z.string().regex(/^\d{6}$/),
  }),
]);
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user)
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Enter a valid international phone number and six-digit code." },
      { status: 400 },
    );
  if (process.env.SMS_ENABLED !== "true")
    return NextResponse.json(
      {
        error:
          "SMS verification is unavailable until the SMS provider is configured and tested.",
      },
      { status: 503 },
    );
  const b = parsed.data;
  const limit = await db.rpc("reserve_integration_attempt", {
    p_kind: b.action === "send" ? "sms_send" : "sms_verify",
  });
  if (limit.error)
    return NextResponse.json(
      {
        error:
          "Too many attempts. Wait before requesting or entering another code.",
      },
      { status: 429 },
    );
  if (b.action === "send") {
    const result = await db.auth.updateUser({ phone: b.phone });
    if (result.error)
      return NextResponse.json(
        {
          error: "SMS could not be sent. Check the number or try again later.",
        },
        { status: 503 },
      );
    return NextResponse.json({ sent: true, retryAfter: 60 });
  }
  const result = await db.auth.verifyOtp({
    phone: b.phone,
    token: b.token,
    type: "phone_change",
  });
  if (result.error)
    return NextResponse.json(
      {
        error:
          "Code is incorrect or expired. Request another code after the cooldown.",
      },
      { status: 400 },
    );
  const confirmed = await db.auth.getUser();
  if (
    !confirmed.data.user?.phone_confirmed_at ||
    confirmed.data.user.phone !== b.phone
  )
    return NextResponse.json(
      { error: "Phone confirmation could not be verified" },
      { status: 409 },
    );
  return NextResponse.json({ verified: true });
}
