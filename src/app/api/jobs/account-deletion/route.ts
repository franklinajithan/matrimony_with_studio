import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { serviceClient, serviceConfigured } from "@/lib/supabase/service";
import { eraseApprovedAccount } from "@/lib/account/deletion";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET, supplied = request.headers.get("authorization") || "", expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (process.env.ACCOUNT_DELETION_ENABLED !== "true" || process.env.RETENTION_POLICY_APPROVED !== "true" || !serviceConfigured()) return NextResponse.json({ error: "Account erasure requires approved retention and worker configuration" }, { status: 503 });
  const db = serviceClient(), claimed = await db.rpc("claim_account_deletion");
  if (claimed.error) return NextResponse.json({ error: "Erasure queue unavailable or held for review" }, { status: 503 });
  if (!claimed.data) return NextResponse.json({ processed: 0 });
  const job = claimed.data as { id: string; member_id: string; lease: string };
  try { await eraseApprovedAccount(db, job); return NextResponse.json({ processed: 1 }, { headers: { "Cache-Control": "no-store" } }); }
  catch { await db.rpc("account_deletion_step", { p_id: job.id, p_lease: job.lease, p_stage: "failed" }); return NextResponse.json({ error: "Erasure incomplete. Job requires retry or operator review; do not report erased." }, { status: 503 }); }
}
