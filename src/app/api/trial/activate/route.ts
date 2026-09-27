import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!auth.user.phone || !auth.user.phone_confirmed_at)
    return NextResponse.json({ error: "Verify your mobile number first." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = body as { code?: unknown };
  if (input.code !== undefined && typeof input.code !== "string")
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });
  const code = typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
  if (code && !/^CUPID-[A-F0-9]{18}$/.test(code))
    return NextResponse.json({ error: "Invalid invitation code format." }, { status: 400 });
  const codeHash = code ? createHash("sha256").update(code).digest("hex") : null;
  const { data, error } = await db.rpc("activate_member_trial", { p_code_hash: codeHash });
  if (error) {
    const known = /verify your mobile|invalid, expired|already|sign in/i.test(error.message);
    return NextResponse.json({ error: known ? error.message : "Could not activate your trial. Please try again." }, { status: known ? 400 : 500 });
  }
  const trial = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ durationMonths: trial?.duration_months, trialEndsAt: trial?.trial_ends_at, offerApplied: trial?.offer_applied }, { headers: { "Cache-Control": "no-store" } });
}
