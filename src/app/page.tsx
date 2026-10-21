import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PremiumOpeningStory } from "@/components/landing/PremiumOpeningStory";
import { CompatibilityStory, StickyHowItWorks } from "@/components/landing/PremiumScrollSections";
import { GlobalCommunityStory, PremiumStories, PremiumFinalCta } from "@/components/landing/PremiumClosingSections";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { ModernMatchFeatures } from "@/components/landing/ModernMatchFeatures";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CupidMatch | Meaningful Matrimony & Partner Discovery",
  description: "Discover meaningful introductions on CupidMatch. Create a detailed biodata profile, set partner preferences and explore compatibility and horoscope profile features.",
  alternates: { canonical: "https://cupidmatch.co.uk/" },
  openGraph: {
    type: "website",
    url: "https://cupidmatch.co.uk/",
    title: "CupidMatch | Meaningful Connections Begin Here",
    description: "Explore thoughtful partner discovery, biodata, preferences and compatibility on CupidMatch.",
  },
};

export default async function HomePage() {
  const user = await getServerAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF8F4]">
      <Navbar />
      <main id="main-content" className="flex-grow homepage-card-flow">
        <PremiumOpeningStory />
        <ModernMatchFeatures />
        <CompatibilityStory />
        <StickyHowItWorks />
        <GlobalCommunityStory />
        <PremiumStories />
        <LandingFaq />
        <PremiumFinalCta />
      </main>
      <Footer />
    </div>
  );
}
