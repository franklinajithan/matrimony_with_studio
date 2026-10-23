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

const shareTitle = 'CupidMatch | Sri Lankan Matrimony Worldwide';
const shareDescription = 'Find your perfect match with CupidMatch. Meaningful matrimonial connections for the Sri Lankan community worldwide.';
const shareImage = 'https://cupidmatch.co.uk/images/cupidmatch-og.jpg';

export const metadata: Metadata = {
  // All homepage URLs are absolute; preserve the canonical root trailing slash.
  metadataBase: null,
  title: { absolute: shareTitle },
  description: shareDescription,
  alternates: { canonical: 'https://cupidmatch.co.uk/' },
  openGraph: {
    type: 'website',
    siteName: 'CupidMatch',
    url: 'https://cupidmatch.co.uk/',
    title: shareTitle,
    description: shareDescription,
    images: [{ url: shareImage, secureUrl: shareImage, width: 1200, height: 630, type: 'image/jpeg', alt: 'CupidMatch — Find Your Perfect Match' }],
  },
  twitter: { card: 'summary_large_image', title: shareTitle, description: shareDescription, images: [shareImage] },
};

export default async function HomePage() {
  const user = await getServerAuthUser();
  if (user) redirect("/dashboard");

  const organisationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "CupidMatch", url: "https://cupidmatch.co.uk", logo: "https://cupidmatch.co.uk/images/cupidmatch-royal-logo-transparent.png" };
  const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "CupidMatch", url: "https://cupidmatch.co.uk", inLanguage: "en" };
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
