import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookHeart, Heart, MessageCircle, ShieldCheck } from "lucide-react";
import { PublicPage, PublicHero, PublicClosing, primaryLink, secondaryLink } from "@/components/marketing/PublicPage";

export const metadata: Metadata = {
  title: "Community Stories | CupidMatch",
  description: "Celebrate meaningful connections with the CupidMatch community. Share your story and inspire someone at the beginning of their journey.",
};

const steps = [
  { icon: MessageCircle, title: "Tell it in your own words", text: "How did you meet? What made the connection feel different? It’s the little details that make it yours." },
  { icon: Heart, title: "Share what feels right", text: "Add a favourite photograph if you’d like. Only include details you and your partner are comfortable sharing." },
  { icon: ShieldCheck, title: "A little care before publishing", text: "Our team reviews each submission before it can be featured in the CupidMatch community." },
];

export default function SuccessStoriesPage() {
  return <PublicPage>
    <PublicHero eyebrow="The CupidMatch community" title="Every connection" accent="has a story."
      description="A first hello. A shared understanding. The moment a conversation becomes something more. We’re making space for the journeys that bring our community together."
      image="/images/values/shared.jpg" imageAlt="A couple enjoying time together">
      <Link href="/success-stories/submit" className={primaryLink}>Share your story <ArrowRight aria-hidden className="h-4 w-4" /></Link>
      <Link href="#sharing-your-story" className={secondaryLink}>How sharing works</Link>
    </PublicHero>

    <section aria-labelledby="community-stories" className="rounded-[2rem] border border-[#EADFED] bg-white/70 px-6 py-10 text-center sm:px-12 sm:py-14">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4EBFA]"><BookHeart aria-hidden className="h-6 w-6 text-[#A52A8A]" /></span>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-[#846294]">Stories shared with care</p>
      <h2 id="community-stories" className="mx-auto mt-3 max-w-xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">Your journey could inspire<br className="hidden sm:block" /> someone else’s beginning.</h2>
      <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#6B5A78]">We’re gathering stories from our community. If CupidMatch has been part of your journey, we’d love to hear about it.</p>
      <Link href="/success-stories/submit" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#6D28D9] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7C3AED]">Tell us your story <ArrowRight aria-hidden className="h-4 w-4" /></Link>
    </section>

    <section id="sharing-your-story" aria-labelledby="sharing-title" className="scroll-mt-24"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#846294]">A story worth sharing</p><h2 id="sharing-title" className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Your words. Your experience.</h2><p className="mt-3 max-w-xl text-base leading-7 text-[#6B5A78]">There’s no perfect way to tell a love story. Just start with what mattered to you.</p><div className="mt-7 grid gap-4 md:grid-cols-3">{steps.map(({icon: Icon,title,text},i)=><article key={title} className="rounded-3xl border border-[#EADFED] bg-[#FBF5F1] p-6 sm:p-7"><div className="flex items-center justify-between"><Icon aria-hidden className="h-6 w-6 text-[#A52A8A]" /><span aria-hidden className="font-serif text-3xl text-[#CDBDD9]">0{i+1}</span></div><h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#6B5A78]">{text}</p></article>)}</div></section>
    <PublicClosing title="Still at the beginning of your story?" description="Meet people who share your values, culture and hopes for the future. A meaningful introduction could be your next step." href="/signup" label="Create your profile" />
  </PublicPage>;
}
