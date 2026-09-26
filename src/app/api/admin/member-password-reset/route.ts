import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const admin = await requireServerAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const memberId = payload && typeof payload === "object" && "memberId" in payload ? payload.memberId : null;
  if (typeof memberId !== "string" || !uuid.test(memberId)) return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase.from("profiles").select("id,email").eq("id", memberId).single();
  if (error || !profile?.email) return NextResponse.json({ error: "Member email unavailable" }, { status: 404 });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || !/^https:\/\//.test(siteUrl)) return NextResponse.json({ error: "Password reset configuration unavailable" }, { status: 503 });
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(profile.email, {
    redirectTo: new URL("/auth/callback?next=/reset-password", siteUrl).toString(),
  });
  if (resetError) return NextResponse.json({ error: "Unable to send password reset email" }, { status: 503 });
  // Do not log member email or a reset token.
  return NextResponse.json({ message: "Password reset email requested" }, { headers: { "Cache-Control": "no-store" } });
}
