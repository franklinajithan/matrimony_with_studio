import { NextResponse } from "next/server";
import { getServerAuthUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { publishOnboarding } from "@/lib/onboarding/persist";

export async function POST(request: Request) {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = await createSupabaseServerClient();
    const published = await publishOnboarding(supabase, user.id, { draft: body?.draft });
    return NextResponse.json({
      ok: true,
      isPublished: published.is_published,
      step: published.onboarding_step,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not publish profile.";
    const details = (error as Error & { details?: string[] }).details;
    return NextResponse.json({ error: message, details }, { status: 400 });
  }
}
