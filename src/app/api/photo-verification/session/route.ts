import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerAuthUser, createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await getServerAuthUser();
  if (!user) return NextResponse.json({ error: "Sign in to verify your profile photo." }, { status: 401 });

  if (process.env.PHOTO_VERIFICATION_ENABLED !== "true" ||
      !process.env.DIDIT_API_KEY || !process.env.DIDIT_WORKFLOW_ID) {
    return NextResponse.json({
      error: "Live biometric verification is not yet enabled. Photo checks are still available.",
      code: "NOT_CONFIGURED"
    }, { status: 503 });
  }

  let body: { consent?: unknown } = {};
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Explicit consent is required before opening the live scan." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("photo_url").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Could not check profile photo." }, { status: 503 });
  if (!profile?.photo_url) return NextResponse.json({ error: "Upload and save a primary profile photo first." }, { status: 400 });

  // Do not create duplicate billable sessions when one remains active.
  const { data: last, error: historyError } = await supabase
    .from("photo_verification_sessions")
    .select("created_at,status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (historyError) return NextResponse.json({ error: "Verification storage is not yet configured." }, { status: 503 });
  if (last?.[0]) {
    const age = Date.now() - new Date(last[0].created_at).getTime();
    if (age < 2 * 60 * 1000) {
      return NextResponse.json({ error: "Please wait two minutes before starting another scan." }, { status: 429 });
    }
    if (last[0].status === "pending" && age < 15 * 60 * 1000) {
      return NextResponse.json({ error: "A verification is already in progress. Return to it or try again later." }, { status: 409 });
    }
  }

  // The provider owns the live liveness UI; never simulate liveness in the browser.
  const response = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: {
      "x-api-key": process.env.DIDIT_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      vendor_data: user.id,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  }).catch(() => null);
  if (!response?.ok) {
    return NextResponse.json({ error: "Verification provider unavailable. Please retry later." }, { status: 502 });
  }
  const result = await response.json().catch(() => null) as { session_id?: unknown; url?: unknown } | null;
  if (typeof result?.session_id !== "string" || typeof result?.url !== "string") {
    return NextResponse.json({ error: "Verification provider returned an invalid session." }, { status: 502 });
  }
  let providerUrl: URL;
  try {
    providerUrl = new URL(result.url.startsWith("https://") ? result.url : "https://" + result.url);
    if (providerUrl.protocol !== "https:" || !providerUrl.hostname.endsWith(".didit.me")) throw Error();
  } catch {
    return NextResponse.json({ error: "Verification provider returned an invalid destination." }, { status: 502 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return NextResponse.json({ error: "Secure verification storage is unavailable." }, { status: 503 });
  // Server-only credential; never expose this client or its key to browsers.
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: insertError } = await admin.from("photo_verification_sessions").insert({
    user_id: user.id,
    provider: "didit",
    provider_session_id: result.session_id,
    primary_photo_url: profile.photo_url,
    status: "pending",
    consented_at: new Date().toISOString(),
  });
  if (insertError) {
    // Fail closed: a provider session is not sufficient to issue a badge.
    return NextResponse.json({ error: "Could not record verification session. Please contact support." }, { status: 503 });
  }
  return NextResponse.json({ url: providerUrl.toString(), state: "pending" }, { headers: { "Cache-Control": "no-store" } });
}
