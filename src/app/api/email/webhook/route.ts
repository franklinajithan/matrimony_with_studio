import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailSignature } from "@/lib/providers/email-signature";
import { serviceClient, serviceConfigured } from "@/lib/supabase/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!process.env.RESEND_WEBHOOK_SECRET || !serviceConfigured())
    return NextResponse.json(
      { error: "Email delivery tracking unavailable" },
      { status: 503 },
    );
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 262144)
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  let eventId: string;
  try {
    eventId = verifyEmailSignature(
      raw,
      request.headers,
      process.env.RESEND_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const parsed = z
    .object({
      type: z.string().max(100),
      created_at: z.string().datetime({ offset: true }),
      data: z.object({ email_id: z.string().uuid() }),
    })
    .safeParse(
      await Promise.resolve()
        .then(() => JSON.parse(raw))
        .catch(() => null),
    );
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const statuses: Record<string, string> = {
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.failed": "failed",
    "email.suppressed": "bounced",
  };
  const status = statuses[parsed.data.type];
  if (!status) return NextResponse.json({ received: true, ignored: true });
  const saved = await serviceClient().rpc("record_email_delivery", {
    p_event: eventId,
    p_provider: parsed.data.data.email_id,
    p_status: status,
    p_created: parsed.data.created_at,
  });
  if (saved.error)
    return NextResponse.json(
      { error: "Delivery state unavailable; retry event" },
      { status: 503 },
    );
  return NextResponse.json({ received: true });
}
