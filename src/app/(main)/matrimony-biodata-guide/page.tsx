import type { Metadata } from "next";
import Link from "next/link";

const path = "/matrimony-biodata-guide";
const title = "How to Write a Matrimony Biodata With an Example";
const description = "Write a marriage biodata with a practical example for Sri Lankan, Tamil and Indian families. Learn what to include, what to keep private and how to share it.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { title, description, url: path, type: "article" },
};

export default function MatrimonyBiodataGuide() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-5 py-12 sm:py-16">
      <header className="space-y-4">
        <h1 className="font-headline text-4xl font-bold text-primary">How to write a matrimony biodata</h1>
        <p className="text-lg text-muted-foreground">
          A marriage biodata is a short introduction you can share with a potential match or their family.
          Start with one page that explains who you are, what matters to you and what you hope to build together.
        </p>
      </header>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">What to include</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Give your first name, age, general location and the languages you speak.</li>
          <li>Describe your education and line of work in a sentence. Add an interest that gives someone an easy way to start a conversation.</li>
          <li>Say where you hope to live after marriage and whether you are open to relocating.</li>
          <li>Explain how you would like families to be involved and which cultural or religious practices matter in your daily life.</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Example for a UK-based Tamil match</h2>
        <p>Use this fictional example as a starting point and replace the details with your own.</p>
        <blockquote className="space-y-2 rounded-xl border bg-card p-5">
          <p><strong>About me.</strong> I’m Kavya, 31, based in Greater London. I speak Tamil and English and work in education. Most weekends I’m cooking with family or walking with friends.</p>
          <p><strong>What I’m looking for.</strong> I’d like to meet someone who wants to build a life in the UK and enjoys staying close to family. I’m open to living outside London if we can both keep doing work we enjoy.</p>
          <p><strong>Introductions.</strong> I’d prefer an initial conversation between us, then a family introduction if we both feel comfortable.</p>
        </blockquote>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Share a shorter version first</h2>
        <p>
          Leave your street address, full date of birth, documents and private phone number out of the first copy.
          If horoscope matching matters to both of you, agree privately on which birth details to share.
          If a relative prepares the biodata, ask the person it describes to review it and approve who receives it.
        </p>
        <Link className="font-semibold text-primary underline" href="/safety">Read CupidMatch’s safety guidance</Link>
      </section>
      <nav aria-label="Related matrimony guidance" className="flex flex-wrap gap-4 text-primary underline">
        <Link href="/matrimony-guides">Sri Lankan and Tamil matrimony guide</Link>
        <Link href="/tamil-matrimony-uk">Tamil matrimony in the UK</Link>
        <Link href="/family-assisted-matrimony">Family-assisted matrimony</Link>
      </nav>
      <Link className="inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground" href="/signup">
        Create your CupidMatch profile
      </Link>
    </article>
  );
}
