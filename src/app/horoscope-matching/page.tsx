import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const title = "Horoscope Matching for Matrimony";
const description = "Understand how traditional horoscope discussions may fit alongside practical conversations about values, lifestyle and long-term compatibility.";
const canonical = "https://cupidmatch.co.uk/horoscope-matching";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title: `${title} | CupidMatch`, description, url: canonical, type: "website" },
};
const sections = [["What a horoscope comparison means","In some South Asian matrimonial traditions, families compare birth-chart details as part of introductions. The particular factors considered vary by tradition and practitioner."],["Astrology is one personal consideration","A horoscope cannot scientifically predict whether a marriage will succeed. Mutual consent, communication, trust, shared goals and practical compatibility are important regardless of astrological beliefs."],["Protect birth details and personal information","Birth dates, times and places can be sensitive. Only share details when you are comfortable and check your account's privacy options. Do not treat an automated interpretation as a definitive decision."]];
const questions = [["Is horoscope matching essential to use CupidMatch?","No. Whether astrology matters in your partner search is a personal choice."],["Does a high astrological score guarantee marriage compatibility?","No. An astrological result is not a scientific guarantee of relationship outcomes."]];
export default function Page() {
  const schema = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://cupidmatch.co.uk/" },
      { "@type": "ListItem", position: 2, name: title, item: canonical }
    ] }
  ];
  return <div className="min-h-screen bg-background">
    <Navbar />
    <main id="main-content" className="mx-auto max-w-4xl px-5 py-14 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link className="underline" href="/">Home</Link><span aria-hidden="true"> / </span><span>{title}</span></nav>
      <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-gold-foreground">CupidMatch · Meaningful connections</p>
      <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-primary-dark sm:text-6xl">{title}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{"Understand how traditional horoscope discussions may fit alongside practical conversations about values, lifestyle and long-term compatibility."}</p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link className="rounded-full bg-primary px-6 py-3 font-semibold text-white" href="/signup">Create your profile</Link>
        <Link className="rounded-full border border-gold/40 px-6 py-3 font-semibold text-primary" href="/how-it-works">How CupidMatch works</Link>
      </div>
      <div className="mt-14 space-y-10">{sections.map(([heading, body]) =>
        <section key={heading} className="border-b border-gold/20 pb-9"><h2 className="font-serif text-2xl text-primary sm:text-3xl">{heading}</h2><p className="mt-4 leading-8 text-muted-foreground">{body}</p></section>
      )}</div>
      <section className="mt-14"><h2 className="font-serif text-3xl text-primary">Questions people ask</h2><div className="mt-7 space-y-6">{questions.map(([question, answer]) =>
        <div key={question}><h3 className="font-semibold text-foreground">{question}</h3><p className="mt-2 leading-7 text-muted-foreground">{answer}</p></div>
      )}</div></section>
      <aside className="mt-14 rounded-3xl border border-gold/25 bg-card p-7 sm:p-10">
        <h2 className="font-serif text-2xl text-primary">Explore CupidMatch</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Learn more about profile creation, community connections and staying safe when getting to know someone.</p>
        <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-primary">
          <Link href="/sri-lankan-matrimony-uk">Sri Lankan matrimony</Link>
          <Link href="/tamil-matrimony-uk">Tamil matrimony</Link>
          <Link href="/sinhala-matrimony">Sinhala matrimony</Link>
          <Link href="/horoscope-matching">Horoscope information</Link>
          <Link href="/safety">Safety tips</Link>
        </div>
      </aside>
    </main><Footer />
  </div>;
}
