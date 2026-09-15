"use client";

import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { LandingHero } from "@/components/landing/LandingHero";
import {
  DiscoveryPreview,
  FamilyCirclePreview,
  FaqSection,
  FeatureGrid,
  FinalCta,
  HowItWorks,
  InternationalRelationships,
  PricingTeaser,
  PrivacySection,
  SuccessStoriesPreview,
  TrustStrip,
  WhyCupidMatch,
} from "@/components/landing/LandingSections";

export default function LandingPage() {
  // Note: Removed Firebase auth check from landing page to improve performance
  // Auth state is now checked only in Navbar component
  // This avoids loading 580KB Firebase SDK on public homepage

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <Navbar />
      <main>
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
