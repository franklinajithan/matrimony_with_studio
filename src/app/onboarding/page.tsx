import { Suspense } from "react";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading your profile…</div>}>
      <OnboardingWizard />
    </Suspense>
  );
}
