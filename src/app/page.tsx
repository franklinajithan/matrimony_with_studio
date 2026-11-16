import Link from "next/link";
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
        <section className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <div className="rounded-3xl border border-gold/25 bg-card p-7 sm:p-10">
            <p className="text-sm font-semibold text-gold-foreground">Planned feature</p>
            <h2 className="mt-2 font-serif text-3xl text-primary sm:text-4xl">AI-assisted horoscope matching</h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
              Explore Tamil Vedha Porutham with a plain-language AI explanation and conversation starters. Both members choose whether to share their horoscope details.
            </p>
            <Link className="mt-5 inline-block font-semibold text-primary underline" href="/horoscope-matching">
              Learn about horoscope matching
            </Link>
          </div>
        </section>
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
