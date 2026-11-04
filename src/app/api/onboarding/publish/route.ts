import { NextResponse } from "next/server";
import { getServerAuthUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { loadOnboardingState, publishOnboarding } from "@/lib/onboarding/persist";
import { getServerSubscription } from "@/lib/subscriptions/server";

export async function POST(request: Request) {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = await createSupabaseServerClient();
    const current = await loadOnboardingState(supabase, user.id);
    // Legacy published profiles may be edited without repeating the first-publication plan decision.
    if (!current.isPublished) {
      if (body?.membershipChoice !== "free" && body?.membershipChoice !== "premium") {
        return NextResponse.json({ error: "Choose Free or Premium before publishing." }, { status: 400 });
      }
      if (body.membershipChoice === "premium") {
        const membership = await getServerSubscription();
        if (!membership.user || membership.user.id !== user.id || membership.plan.code !== "premium") {
          return NextResponse.json({ error: "Activate or confirm your Premium access before publishing." }, { status: 409 });
        }
      }
    }
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
