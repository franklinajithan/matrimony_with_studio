import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Heart, Smartphone } from "lucide-react";
import { Footer } from "@/components/navigation/Footer";
import { primaryLink, secondaryLink } from "@/components/marketing/PublicPage";

export const metadata: Metadata = {
  title: "CupidMatch Links, Social Channels and Apps",
  description: "Explore CupidMatch, find our social channels, and check availability of our iPhone and Android apps.",
  alternates: { canonical: "/links" },
};

const socials = [
  { name: "Instagram", url: process.env.CUPIDMATCH_INSTAGRAM_URL, hosts: ["instagram.com", "www.instagram.com"] },
  { name: "Facebook", url: process.env.CUPIDMATCH_FACEBOOK_URL, hosts: ["facebook.com", "www.facebook.com"] },
  { name: "LinkedIn", url: process.env.CUPIDMATCH_LINKEDIN_URL, hosts: ["linkedin.com", "www.linkedin.com"] },
  { name: "TikTok", url: process.env.CUPIDMATCH_TIKTOK_URL, hosts: ["tiktok.com", "www.tiktok.com"] },
];

const stores = [
  { name: "App Store", device: "iPhone", url: process.env.CUPIDMATCH_APP_STORE_URL, hosts: ["apps.apple.com"] },
  { name: "Google Play", device: "Android", url: process.env.CUPIDMATCH_PLAY_STORE_URL, hosts: ["play.google.com"] },
];

function officialLink(raw: string | undefined, hosts: string[]) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && hosts.includes(url.host) && url.pathname !== "/" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export default function LinksPage() {
  const whatsapp = "https://wa.me/?text=" + encodeURIComponent(
    "Explore CupidMatch, a marriage-focused matrimony platform. https://cupidmatch.co.uk/links?utm_source=whatsapp&utm_medium=referral&utm_campaign=link_hub"
  );

  return (
    <>
      <main id="main-content" className="mx-auto max-w-3xl space-y-10 px-5 py-12 sm:py-16">
        <header className="space-y-5 text-center">
          <Heart aria-hidden className="mx-auto h-8 w-8 text-primary" />
          <h1 className="font-serif text-5xl font-semibold text-primary-dark">Connect with CupidMatch</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Explore marriage-focused matchmaking for Sri Lankan and South Asian communities worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={primaryLink}>Create a free profile</Link>
            <Link href="/launch-pricing" className={secondaryLink}>Compare memberships</Link>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={secondaryLink}>
              Share on WhatsApp <ArrowUpRight aria-hidden className="h-4 w-4" />
            </a>
          </div>
        </header>

        <section aria-labelledby="social-heading" className="rounded-3xl border bg-card p-6">
          <h2 id="social-heading" className="text-xl font-semibold text-primary-dark">Follow CupidMatch</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {socials.map(({ name, url, hosts }) => {
              const href = officialLink(url, hosts);
              return <li key={name} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4">
                {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-between gap-3 py-3 font-medium text-primary underline-offset-4 hover:underline">
                  {name} <ArrowUpRight aria-hidden className="h-4 w-4" />
                </a> : <><span className="font-medium">{name}</span><span className="text-sm text-muted-foreground">Link coming soon</span></>}
              </li>;
            })}
          </ul>
        </section>

        <section aria-labelledby="app-heading" className="rounded-3xl border bg-card p-6">
          <h2 id="app-heading" className="flex items-center gap-2 text-xl font-semibold text-primary-dark">
            <Smartphone aria-hidden className="h-5 w-5" /> CupidMatch apps
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {stores.map(({ name, device, url, hosts }) => {
              const href = officialLink(url, hosts);
              return <li key={name} className="rounded-xl border p-4">
                <span className="block text-sm text-muted-foreground">{device}</span>
                {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
                  Download on {name}
                </a> : <p className="font-semibold">{name} · Coming soon</p>}
              </li>;
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">You can use CupidMatch on your phone’s browser today.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
