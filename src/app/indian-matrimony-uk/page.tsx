import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const title = "Indian Matrimony in the UK";
const description = "Discover Indian matrimony in the UK with CupidMatch. Create your matrimonial biodata, share partner preferences and explore meaningful introductions.";
const canonical = "https://cupidmatch.co.uk/indian-matrimony-uk";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title: `${title} | CupidMatch`, description, url: canonical, type: "website" },
};

const questions = [
  ["Is CupidMatch only for one Indian community?", "CupidMatch supports people with different backgrounds and individual priorities. You can describe your own heritage, values and partner preferences."],
  ["Can I look for someone interested in marriage?", "CupidMatch is designed around matrimonial introductions. You can create a biodata profile and communicate your marriage and partner expectations."],
  ["Can I use CupidMatch outside London?", "CupidMatch is available online, although your results depend on the members and search options currently available."],
];

export default function IndianMatrimonyPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://cupidmatch.co.uk/" },
      { "@type": "ListItem", position: 2, name: title, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-4xl px-5 py-14 sm:py-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }} />
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link href="/" className="underline">Home</Link> / {title}</nav>
        <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-gold-foreground">CupidMatch · Matrimonial introductions</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-primary-dark sm:text-6xl">{title}</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{description}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-full bg-primary px-6 py-3 font-semibold text-white">Create matrimonial profile</Link>
          <Link href="/how-it-works" className="rounded-full border border-gold/40 px-6 py-3 font-semibold text-primary">How it works</Link>
        </div>
        <section className="mt-14 border-b border-gold/20 pb-9">
          <h2 className="font-serif text-3xl text-primary">Marriage-focused matchmaking for Indian communities</h2>
          <p className="mt-4 leading-8 text-muted-foreground">Searching for a marriage partner can mean considering family expectations, location, future plans, language, lifestyle and personal compatibility. CupidMatch offers a place to introduce yourself thoughtfully and explain what matters most to you.</p>
        </section>
        <section className="mt-10 border-b border-gold/20 pb-9">
          <h2 className="font-serif text-3xl text-primary">Share more than a photograph</h2>
          <p className="mt-4 leading-8 text-muted-foreground">Build your matrimonial biodata and set partner preferences to help potential introductions start with a clearer understanding of your values. You can also add relevant cultural information where supported in your profile.</p>
        </section>
        <section className="mt-10">
          <h2 className="font-serif text-3xl text-primary">Indian matrimony: common questions</h2>
          <div className="mt-7 space-y-7">{questions.map(([question, answer]) => (
            <div key={question}><h3 className="font-semibold text-foreground">{question}</h3><p className="mt-2 leading-7 text-muted-foreground">{answer}</p></div>
          ))}</div>
        </section>
        <aside className="mt-14 rounded-3xl border border-gold/25 bg-card p-7 sm:p-10">
          <h2 className="font-serif text-2xl text-primary">Find the right path for you</h2>
          <p className="mt-3 leading-7 text-muted-foreground">Explore communities and learn how to use CupidMatch safely before meeting anyone in person.</p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-primary">
            <Link href="/sri-lankan-matrimony-uk">Sri Lankan matrimony UK</Link>
            <Link href="/tamil-matrimony-uk">Tamil matrimony UK</Link>
            <Link href="/sinhala-matrimony">Sinhala matrimony</Link>
            <Link href="/horoscope-matching">Horoscope information</Link>
            <Link href="/safety">Safety guidance</Link>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
