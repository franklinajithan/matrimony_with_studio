import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePhoneNumberFromString } from "libphonenumber-js";

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = parsePhoneNumberFromString(value.trim());
  return parsed?.isValid() ? parsed.number : null;
}
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const input = body as { phoneNumber?: unknown; code?: unknown } | null;
  const phone = normalizePhone(input?.phoneNumber);
  const code = typeof input?.code === "string" && /^\d{6}$/.test(input.code) ? input.code : null;
  if (!phone || !code) return NextResponse.json({ error: "Enter a valid phone number and 6-digit code" }, { status: 400 });

  const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token: code, type: "phone_change" });
  if (verifyError) {
    const status = verifyError.status === 429 ? 429 : 400;
    return NextResponse.json({ error: status === 429 ? "Too many attempts. Please try again later." : "The verification code is invalid or expired." }, { status });
  }
  const { data, error: syncError } = await supabase.rpc("sync_verified_phone_from_auth");
  if (syncError) return NextResponse.json({ error: "Phone verified, but profile synchronization failed. Please refresh and try again." }, { status: 503 });
  return NextResponse.json({ success: true, phoneNumber: data?.phone_number ?? phone, verifiedAt: data?.phone_verified_at ?? null }, { headers: { "Cache-Control": "no-store" } });
}
