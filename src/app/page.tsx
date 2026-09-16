import { redirect } from "next/navigation";
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
import { getServerAuthUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getServerAuthUser();

  if (user) {
    redirect("/dashboard");
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
