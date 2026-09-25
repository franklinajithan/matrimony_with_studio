import { redirect } from "next/navigation";
import { LandingHero } from "@/components/landing/LandingHero";
import { ConnectionScrollStory } from "@/components/landing/ConnectionScrollStory";
import { TaglineReveal } from "@/components/landing/TaglineReveal";
import { CompatibilityStory, StickyHowItWorks } from "@/components/landing/PremiumScrollSections";
import { GlobalCommunityStory, PremiumStories, PremiumFinalCta } from "@/components/landing/PremiumClosingSections";
import { TrustStrip, DiscoveryPreview } from "@/components/landing/LandingSections";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { getServerAuthUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getServerAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF8F4]">
      <Navbar />
      <main className="flex-grow">
        <LandingHero />
        <TrustStrip />
        <TaglineReveal />
        <DiscoveryPreview />
        <ConnectionScrollStory />
        <CompatibilityStory />
        <StickyHowItWorks />
        <GlobalCommunityStory />
        <PremiumStories />
        <PremiumFinalCta />
      </main>
      <Footer />
    </div>
  );
}
