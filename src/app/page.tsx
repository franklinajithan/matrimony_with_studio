import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "https://cupidmatch.co.uk/" } };
import { PremiumOpeningStory } from "@/components/landing/PremiumOpeningStory";
import { CompatibilityStory, StickyHowItWorks } from "@/components/landing/PremiumScrollSections";
import { GlobalCommunityStory, PremiumFinalCta } from "@/components/landing/PremiumClosingSections";
import { CommunityStories } from "@/components/landing/CommunityStories";
import { FaqSection } from "@/components/landing/LandingSections";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { getServerAuthUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getServerAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF8F4]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "CupidMatch",
        url: "https://cupidmatch.co.uk/",
        description: "Sri Lankan and Indian matrimonial introductions and profiles.",
        publisher: {
          "@type": "Organization",
          name: "CupidMatch",
          url: "https://cupidmatch.co.uk/",
          logo: "https://cupidmatch.co.uk/images/cupidmatch-logo-new.png"
        }
      }).replace(/</g, "\\u003c") }} />
      <Navbar />
      <main id="main-content" className="flex-grow homepage-card-flow">
        <PremiumOpeningStory />
        <CompatibilityStory />
        <StickyHowItWorks />
        <GlobalCommunityStory />
        <CommunityStories />
        <FaqSection />
        <PremiumFinalCta />
      </main>
      <Footer />
    </div>
  );
}
