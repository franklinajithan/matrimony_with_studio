import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Matrimony Guide for Sri Lankan and Tamil Singles in the UK",
  description: "Learn how to prepare a matrimony profile, involve your family and discuss relocation when looking for a Sri Lankan or Tamil marriage match in the UK.",
  alternates: { canonical: "/matrimony-guides" },
  openGraph: { url: "/matrimony-guides", title: "Matrimony Guide for Sri Lankan and Tamil Singles in the UK" },
};

export default function MatrimonyGuide() {
  return <article className="mx-auto max-w-3xl space-y-8 px-5 py-12 sm:py-16">
    <header className="space-y-4">
      <h1 className="font-headline text-4xl font-bold text-primary">Looking for a Sri Lankan or Tamil marriage match in the UK</h1>
      <p className="text-lg text-muted-foreground">Before you start sending introductions, think about what married life would look like in practice. These questions can help you write a clearer profile and make early conversations easier.</p>
    </header>
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Write a profile that starts a conversation</h2>
      <p>Share your general location, the languages you use at home and the values you want to build a marriage around. Specific details help. If speaking Tamil with your family matters to you, say whether you need a partner who already speaks it or would welcome someone interested in learning.</p>
      <p>Keep your home address, workplace and private contact details out of your public introduction. You can decide what to share as you get to know someone.</p>
    </section>
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Talk about where you would live</h2>
      <p>If one of you lives in the UK and the other lives overseas, discuss where you would both like to settle. Ask what that would mean for work, family visits and caring responsibilities. If neither person can relocate, knowing that early gives both of you a clearer decision.</p>
      <Link className="font-semibold text-primary underline" href="/international-matrimony">Explore international matrimony</Link>
    </section>
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Agree how and when to involve family</h2>
      <p>Some people prefer family introductions early. Others want a few conversations first. Agree on when to introduce relatives and what you are both comfortable sharing. If a family member helps with a profile, the person looking for a match should approve the information and choose who receives it.</p>
      <Link className="font-semibold text-primary underline" href="/family-assisted-matrimony">Read about family-assisted matrimony</Link>
    </section>
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Start with your community or location</h2>
      <ul className="space-y-2 text-primary underline">
        <li><Link href="/matrimony-biodata-guide">How to write a marriage biodata</Link></li>
        <li><Link href="/sri-lankan-matrimony-uk">Sri Lankan matrimony in the UK</Link></li>
        <li><Link href="/tamil-matrimony-uk">Tamil matrimony in the UK</Link></li>
        <li><Link href="/safety">Safety guidance for introductions</Link></li>
      </ul>
    </section>
    <Link className="inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground" href="/signup">Create your CupidMatch profile</Link>
  </article>;
}
