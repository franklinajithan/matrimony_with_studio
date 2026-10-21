import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const title = "Sinhala Matrimony & Sri Lankan Connections";
const description = "Find meaningful matrimonial introductions that respect your Sinhala background and your own priorities for a long-term relationship.";
const canonical = "https://cupidmatch.co.uk/sinhala-matrimony";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title: `${title} | CupidMatch`, description, url: canonical, type: "website" },
};
const sections = [["Heritage and compatibility","A shared cultural background can be a starting point for conversation, not a substitute for getting to know someone. Explore language, family values, life goals and expectations at your own pace."],["Your biodata tells your story","A useful matrimonial introduction explains more than age and location. Describe your education, work, interests, family involvement preferences and the kind of partnership you hope to build."],["Choice comes first","Whether families are involved early or later, mutual respect and consent matter. Use conversations to understand differences and agree on expectations."]];
const questions = [["Is Sinhala matrimony only for people in Sri Lanka?","No. People living overseas, including the UK, may also want to connect around shared Sri Lankan heritage."],["Is horoscope compatibility required?","That is a personal preference. Astrology is a traditional belief, not a reliable predictor of relationship success."]];
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
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{"Find meaningful matrimonial introductions that respect your Sinhala background and your own priorities for a long-term relationship."}</p>
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
