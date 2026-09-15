import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeInternalPath(searchParams.get("next"), "/onboarding");
  const authError = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (authError || errorCode) {
    const expired =
      errorCode === "otp_expired" ||
      authError === "access_denied" ||
      `${errorDescription || ""}`.toLowerCase().includes("expired");
    const target = expired ? "/login?error=expired_link" : "/login?error=invalid_link";
    return NextResponse.redirect(`${origin}${target}`);
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const expired = error.message.toLowerCase().includes("expired");
      return NextResponse.redirect(
        `${origin}/login?error=${expired ? "expired_link" : "invalid_link"}`
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "signup" | "recovery" | "email" | "magiclink" | "invite" | "email_change",
      token_hash: tokenHash,
    });
    if (error) {
      const expired = error.message.toLowerCase().includes("expired");
      return NextResponse.redirect(
        `${origin}/login?error=${expired ? "expired_link" : "invalid_link"}`
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
