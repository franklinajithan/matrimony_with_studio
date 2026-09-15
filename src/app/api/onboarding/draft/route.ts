import { NextResponse } from "next/server";
import { getServerAuthUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { loadOnboardingState } from "@/lib/onboarding/persist";

export async function GET() {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const state = await loadOnboardingState(supabase, user.id);
    return NextResponse.json({
      draft: state.draft,
      step: state.step,
      isPublished: state.isPublished,
      displayName: state.profile?.display_name || user.user_metadata?.display_name || "",
      email: user.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load onboarding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
