import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { PublicPage, PublicHero, PublicClosing, primaryLink, secondaryLink } from "@/components/marketing/PublicPage";

export const metadata: Metadata = {
  title: "About CupidMatch | Culture, connection and shared values",
  description: "Get to know CupidMatch, a matrimony community connecting Sri Lankans around the world through shared values and meaningful introductions.",
};

const values = [
  { icon: Users, title: "Culture feels like home", text: "A place where your background, traditions and family values are understood, wherever you live." },
  { icon: HeartHandshake, title: "Compatibility comes first", text: "Explore introductions around the preferences and life goals that matter to you." },
  { icon: ShieldCheck, title: "Your pace. Your choice.", text: "Choose what you share, who you connect with and when a conversation feels right." },
];

export default function AboutUsPage() {
  return <PublicPage>
    <PublicHero eyebrow="Our story · CupidMatch" title="Rooted in culture." accent="Open to possibility."
      description="Finding a life partner is personal. CupidMatch brings Sri Lankans around the world closer through shared values, thoughtful introductions and room to build something meaningful."
      image="/images/values/culture.jpg" imageAlt="A couple sharing a moment together">
      <Link href="/signup" className={primaryLink}>Find your beginning <ArrowRight aria-hidden className="h-4 w-4" /></Link>
      <Link href="/success-stories" className={secondaryLink}>Our community stories</Link>
    </PublicHero>

    <section aria-labelledby="purpose" className="grid gap-6 border-y border-border py-8 sm:py-10 md:grid-cols-[1fr_1.4fr] md:gap-12">
      <div><p className="text-xs font-bold uppercase tracking-[.2em] text-muted-foreground">Why we’re here</p><h2 id="purpose" className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">A connection that<br className="hidden sm:block" /> understands you.</h2></div>
      <div className="space-y-4 text-base leading-7 text-muted-foreground"><p>We believe that shared culture can be a starting point for a lasting relationship. But a meaningful match also leaves space for your individuality, ambitions and hopes for the future.</p><p>Our purpose is to make those introductions feel more thoughtful, whether you’re close to home or building a life abroad.</p></div>
    </section>

    <section aria-labelledby="values"><p className="text-xs font-bold uppercase tracking-[.2em] text-muted-foreground">What matters to us</p><h2 id="values" className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Built around real connection.</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{values.map(({icon: Icon,title,text})=><article key={title} className="rounded-3xl border border-border bg-white/70 p-6 sm:p-7"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent"><Icon aria-hidden className="h-5 w-5 text-primary" /></span><h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></section>

    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-background p-7 sm:flex-row sm:items-start sm:p-9"><Globe2 aria-hidden className="h-9 w-9 shrink-0 text-primary" /><div><h2 className="font-serif text-2xl font-semibold sm:text-3xl">Across borders, close to home.</h2><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">From Sri Lanka to the UK, Canada, Australia and beyond, CupidMatch is a meeting place for people who want culture and compatibility to be part of their next chapter.</p><Link href="/safety" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Learn about privacy and safety <ArrowRight aria-hidden className="h-4 w-4" /></Link></div></section>
    <PublicClosing title="Your next chapter starts with a hello." description="Tell your story, share what matters to you and discover people looking for a meaningful connection." href="/signup" label="Create your profile" />
  </PublicPage>;
}
