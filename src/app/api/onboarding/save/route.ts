import { NextResponse } from "next/server";
import { getServerAuthUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { saveOnboardingDraft } from "@/lib/onboarding/persist";
import { parseOnboardingDraft } from "@/lib/onboarding/schema";

export async function POST(request: Request) {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    parseOnboardingDraft(body?.draft);
    const supabase = await createSupabaseServerClient();
    const saved = await saveOnboardingDraft(supabase, user.id, {
      draft: body?.draft,
      step: body?.step,
      email: user.email,
    });
    return NextResponse.json({
      ok: true,
      step: saved.onboarding_step,
      updatedAt: saved.updated_at,
      draft: saved.draft,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save onboarding.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
