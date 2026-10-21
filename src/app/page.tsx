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
  title: "Sri Lankan & Indian Matrimony UK | CupidMatch",
  description: "Explore Sri Lankan, Tamil, Sinhala and Indian matrimony in the UK. Create your biodata, set partner preferences and discover meaningful introductions.",
  alternates: { canonical: "https://cupidmatch.co.uk/" },
  openGraph: {
    type: "website",
    url: "https://cupidmatch.co.uk/",
    title: "Sri Lankan & Indian Matrimony UK | CupidMatch",
    description: "Explore Sri Lankan, Tamil, Sinhala and Indian matrimony in the UK with biodata, partner preferences and thoughtful introductions.",
  },
};

export default async function HomePage() {
  const user = await getServerAuthUser();
  if (user) redirect("/dashboard");

  const organisationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "CupidMatch", url: "https://cupidmatch.co.uk", logo: "https://cupidmatch.co.uk/images/cupidmatch-royal-logo-transparent.png" };
  const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "CupidMatch", url: "https://cupidmatch.co.uk", inLanguage: "en-GB" };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organisationSchema, websiteSchema]).replace(/</g, "\\u003c") }} />
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
