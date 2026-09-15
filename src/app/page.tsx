"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { MatchSearchPanel } from "@/components/landing/MatchSearchPanel";
import {
  CommunitySection,
  FaqSection,
  FeaturesOverview,
  FinalCta,
  GlobalLocationsSection,
  HowItWorks,
  MemberShowcase,
  PricingTeaser,
  PrivacySection,
  ProductPreview,
  SuccessStoriesPreview,
  TrustStrip,
  WhyCupidMatch,
} from "@/components/landing/LandingSections";
import { auth } from "@/lib/firebase/config";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
        return;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFFDF9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B164C]" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-[#725E6D]">Preparing CupidMatch...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <Navbar />
      <main>
        <LandingHero />
        <TrustStrip />
        <GlobalLocationsSection />
        <WhyCupidMatch />
        <MemberShowcase />
        <HowItWorks />
        <PrivacySection />
        <PricingTeaser />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
