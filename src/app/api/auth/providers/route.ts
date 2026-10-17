import { NextResponse } from "next/server";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = getSupabaseUrl(),
    key = getSupabaseAnonKey();
  if (!url || !key)
    return NextResponse.json(
      { providers: [], error: "Additional sign-in options are unavailable." },
      { status: 503 },
    );
  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Auth settings unavailable");
    const settings = await response.json();
    return NextResponse.json(
      {
        providers: ["google", "facebook"].filter(
          (p) => settings.external?.[p] === true,
        ),
        phoneEnabled: settings.external?.phone === true,
        emailConfirmationRequired: settings.mailer_autoconfirm !== true,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        providers: [],
        error:
          "Additional sign-in options are unavailable. Use email or retry.",
      },
      { status: 503 },
    );
  }
}
