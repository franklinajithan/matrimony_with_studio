import { redirect } from "next/navigation";
import { PremiumOpeningStory } from "@/components/landing/PremiumOpeningStory";
import { CompatibilityStory, StickyHowItWorks } from "@/components/landing/PremiumScrollSections";
import { GlobalCommunityStory, PremiumStories, PremiumFinalCta } from "@/components/landing/PremiumClosingSections";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { getServerAuthUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getServerAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF8F4]">
      <Navbar />
      <main className="flex-grow homepage-card-flow">
        <PremiumOpeningStory />
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
