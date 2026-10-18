import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { serviceClient, serviceConfigured } from "@/lib/supabase/service";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (
    process.env.EMAIL_NOTIFICATIONS_ENABLED !== "true" ||
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM ||
    !process.env.RESEND_WEBHOOK_SECRET ||
    !serviceConfigured()
  )
    return NextResponse.json(
      { error: "Email delivery is not configured" },
      { status: 503 },
    );
  const allowlist = (process.env.EMAIL_TEST_RECIPIENTS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const mode = process.env.EMAIL_DELIVERY_MODE || "test";
  if (
    !["test", "live"].includes(mode) ||
    (mode === "live" && process.env.EMAIL_LIVE_DELIVERY_APPROVED !== "true")
  )
    return NextResponse.json(
      { error: "Email delivery mode requires operator configuration" },
      { status: 503 },
    );
  if (mode === "test" && !allowlist.length)
    return NextResponse.json(
      {
        error:
          "Authorised test recipients must be configured before email testing",
      },
      { status: 503 },
    );
  const db = serviceClient();
  const jobs = await db.rpc("claim_email_jobs");
  if (jobs.error)
    return NextResponse.json(
      { error: "Email queue unavailable" },
      { status: 503 },
    );
  let sent = 0,
    skipped = 0;
  for (const job of (jobs.data || []) as {
    id: string;
    category: string;
    email: string;
    eligible: boolean;
  }[]) {
    if (
      !job.eligible ||
      (mode === "test" && !allowlist.includes(job.email.toLowerCase()))
    ) {
      const skippedUpdate = await db
        .from("email_outbox")
        .update({ status: "skipped", updated_at: new Date().toISOString() })
        .eq("id", job.id);
      if (skippedUpdate.error)
        return NextResponse.json(
          { error: "Email queue update failed" },
          { status: 503 },
        );
      skipped++;
      continue;
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `cupidmatch-email/${job.id}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [job.email],
          subject:
            job.category === "support"
              ? "You have a CupidMatch support update"
              : job.category === "messages"
                ? "You have a new CupidMatch message"
                : "You have a new CupidMatch interest",
          text: `Sign in to CupidMatch to view your ${job.category === "support" ? "support update" : job.category === "messages" ? "message" : "interest"}: ${process.env.NEXT_PUBLIC_SITE_URL || "https://cupidmatch.co.uk"}/${job.category === "support" ? "support" : job.category}\n\nChange optional email preferences in account settings: ${process.env.NEXT_PUBLIC_SITE_URL || "https://cupidmatch.co.uk"}/settings`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const result = await response.json();
      if (!response.ok || !result.id)
        throw new Error("Provider rejected delivery");
      const saved = await db
        .from("email_outbox")
        .update({
          status: "sent",
          provider_id: result.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "sending");
      if (saved.error) throw saved.error;
      sent++;
    } catch {
      const reset = await db
        .from("email_outbox")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", job.id)
        .eq("status", "sending");
      if (reset.error)
        return NextResponse.json(
          { error: "Email retry state could not be saved" },
          { status: 503 },
        );
    }
  }
  return NextResponse.json(
    { sent, skipped, testMode: mode === "test" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
