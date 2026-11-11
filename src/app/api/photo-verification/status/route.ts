import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Read-only member status. Never asserts Photo Verified: liveness != an
 * independently validated match against the uploaded primary profile photo.
 */
export async function GET() {
  const user = await getServerAuthUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const db = await createSupabaseServerClient();
  const { data, error } = await db.from("photo_verification_sessions")
    .select("id,status,created_at,primary_photo_url,provider_session_id")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "Verification records unavailable." }, { status: 503 });
  if (!data) return NextResponse.json({ status: "not_started", photoVerified: false });

  let status: string = data.status;
  if ((status === "pending" || status === "review") && process.env.DIDIT_API_KEY) {
    // Only request the latest session, and never return sensitive provider evidence.
    const decisionResponse = await fetch(
      `https://verification.didit.me/v3/session/${encodeURIComponent(data.provider_session_id)}/decision/`,
      { headers: { "x-api-key": process.env.DIDIT_API_KEY }, cache: "no-store", signal: AbortSignal.timeout(10000) }
    ).catch(() => null);
    if (decisionResponse?.ok) {
      const decision = await decisionResponse.json().catch(() => null) as {
        session_id?: string; vendor_data?: string; status?: string;
        liveness_checks?: Array<{ status?: string }>;
      } | null;
      const providerMatchesSession = decision?.session_id === data.provider_session_id &&
        decision?.vendor_data === user.id;
      if (providerMatchesSession) {
        const providerStatus = decision?.status;
        if (providerStatus === "Declined") status = "failed";
        else if (providerStatus === "Expired") status = "expired";
        else if (providerStatus === "In Review") status = "review";
        else if (providerStatus === "Approved") {
          // Provider approval is not the same as matching the saved CupidMatch photo.
          status = decision?.liveness_checks?.some(check => check.status === "Approved")
            ? "passed_liveness" : "review";
        }
        if (status !== data.status && ["failed","expired","review","passed_liveness"].includes(status)) {
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (key && url) {
            const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
            const { error: updateError } = await admin.from("photo_verification_sessions").update({
              status, updated_at: new Date().toISOString()
            }).eq("id", data.id).eq("user_id", user.id).eq("status", data.status);
            if (updateError) status = data.status;
          } else status = data.status;
        }
      }
    }
  }

  const { data: profile } = await db.from("profiles").select("photo_url").eq("id", user.id).maybeSingle();
  if (profile?.photo_url && profile.photo_url !== data.primary_photo_url) {
    status = "expired";
  }
  return NextResponse.json({ status, photoVerified: false, createdAt: data.created_at },
    { headers: { "Cache-Control": "private, no-store" } });
}
