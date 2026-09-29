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
  const phone = normalizePhone((body as { phoneNumber?: unknown } | null)?.phoneNumber);
  if (!phone) return NextResponse.json({ error: "Enter a valid international phone number" }, { status: 400 });

  // Supabase Auth owns OTP generation, expiry, resend throttling and SMS delivery.
  const { error } = await supabase.auth.updateUser({ phone });
  if (error) {
    const status = error.status === 429 ? 429 : 400;
    return NextResponse.json({ error: status === 429 ? "Please wait before requesting another code." : error.message }, { status });
  }
  return NextResponse.json({ success: true, phoneNumber: phone, resendAfterSeconds: 60 }, { headers: { "Cache-Control": "no-store" } });
}
