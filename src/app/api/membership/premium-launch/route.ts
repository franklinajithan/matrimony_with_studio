import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
 if (request.headers.get("origin") !== new URL(request.url).origin)
  return NextResponse.json({ error: "Invalid origin" }, { status: 403, headers });
 try {
  const db = await createSupabaseServerClient();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Sign in to choose Premium." }, { status: 401, headers });
  if (!auth.user.email_confirmed_at) return NextResponse.json({ error: "Confirm your email before starting Premium." }, { status: 403, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers }); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length)
   return NextResponse.json({ error: "This offer has a fixed six-month duration." }, { status: 400, headers });
  const { data, error } = await db.rpc("claim_premium_launch_offer");
  if (error) return NextResponse.json({ error: error.code === "42501" ? "Sign in with an active, email-confirmed account." : "The offer could not be started. Please try again." }, { status: error.code === "42501" ? 403 : 503, headers });
  if (data?.plan !== "premium" || data.durationMonths !== 6 || !Number.isFinite(Date.parse(data.startsAt)) || !Number.isFinite(Date.parse(data.endsAt)) || Date.parse(data.endsAt) <= Date.parse(data.startsAt)) throw Error("Unconfirmed grant");
  return NextResponse.json({ plan: "premium", durationMonths: 6, startsAt: data.startsAt, endsAt: data.endsAt }, { headers });
 } catch { return NextResponse.json({ error: "Unable to confirm Premium access. Please retry." }, { status: 503, headers }); }
}
