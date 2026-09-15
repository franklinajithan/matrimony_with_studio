"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingHero } from "@/components/landing/LandingHero";
import {
  TrustStrip,
  WhyCupidMatch,
  InternationalRelationships,
  FeatureGrid,
  DiscoveryPreview,
  HowItWorks,
  PrivacySection,
  FamilyCirclePreview,
  SuccessStoriesPreview,
  PricingTeaser,
  FaqSection,
  FinalCta,
} from "@/components/landing/LandingSections";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { onAuthStateChanged, auth } from "@/lib/supabase/auth";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Redirect authenticated users to dashboard
        router.replace("/dashboard");
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow">
        <LandingHero />
        <TrustStrip />
        <WhyCupidMatch />
        <InternationalRelationships />
        <FeatureGrid />
        <DiscoveryPreview />
        <HowItWorks />
        <PrivacySection />
        <FamilyCirclePreview />
        <SuccessStoriesPreview />
        <PricingTeaser />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
