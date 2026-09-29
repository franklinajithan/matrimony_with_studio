import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PhoneVerificationFlow } from "@/components/phone-verification/PhoneVerificationFlow";

export const metadata = {
  title: "Verify Phone | CupidMatch",
  description: "Verify your phone number to continue",
};

export default async function VerifyPhonePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/verify-phone");
  }

  // Check if phone is already verified
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, phone_number, phone_verified_at, onboarding_step")
    .eq("id", user.id)
    .single();

  if (profile?.phone_verified_at) {
    // Phone already verified, redirect based on onboarding status
    if (profile.onboarding_step < 8) {
      redirect("/onboarding");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-pink-50 to-white">
      <div className="w-full max-w-lg">
        <PhoneVerificationFlow
          redirectOnSuccess="/onboarding"
          allowSkip={true}
        />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Why verify your phone?</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>✓ Enhanced account security</li>
            <li>✓ Quick account recovery</li>
            <li>✓ Helps prevent fake profiles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
