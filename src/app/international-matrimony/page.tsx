import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const url = "https://cupidmatch.co.uk/international-matrimony";
export const metadata: Metadata = {
  title: "Sri Lankan Matrimony Worldwide",
  description: "Discover marriage-focused introductions for the Sri Lankan community worldwide, across countries, cities and diaspora communities.",
  alternates: { canonical: url },
  openGraph: { type: "website", url, title: "International Matrimony | CupidMatch", description: "Meaningful Sri Lankan community matrimonial introductions worldwide." },
};
const regions = [
  { name: "United Kingdom", context: "Build meaningful introductions across British cities while staying connected with family, language and cultural traditions." },
  { name: "Sri Lanka", context: "Connect your family roots and personal goals, whether you live locally or are open to meeting someone overseas." },
  { name: "Australia", context: "Explore introductions that consider lifestyle, long-distance communication and future relocation preferences." },
  { name: "Canada", context: "Share your values, family background and expectations when exploring a serious marriage-focused relationship." },
  { name: "France", context: "Find a starting point for introductions while navigating language, location and cross-border expectations." },
  { name: "Germany", context: "Be clear about education, work, family plans and preferences for where to build a future together." },
  { name: "Switzerland", context: "Explore shared values and practical considerations for introductions across countries and communities." },
];
export default function InternationalMatrimonyPage() {
  const schema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://cupidmatch.co.uk/" },
    { "@type": "ListItem", position: 2, name: "International Matrimony", item: url },
  ] };
  return <div className="min-h-screen bg-background">
    <Navbar />
    <main id="main-content" className="mx-auto max-w-6xl px-5 py-14 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link href="/" className="underline">Home</Link> / International matrimony</nav>
      <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-gold-foreground">CupidMatch · Across borders, connected by values</p>
      <h1 className="mt-4 max-w-4xl font-serif text-4xl font-semibold leading-tight text-primary-dark sm:text-6xl">Sri Lankan Matrimony Worldwide</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">A meaningful connection does not have to stop at a border. CupidMatch helps Sri Lankan communities around the world explore marriage-focused introductions across different countries, languages and backgrounds.</p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/signup" className="rounded-full bg-primary px-6 py-3 font-semibold text-white">Create your biodata</Link>
        <Link href="/how-it-works" className="rounded-full border border-gold/40 px-6 py-3 font-semibold text-primary">How CupidMatch works</Link>
      </div>
      <section className="mt-16" aria-labelledby="regions">
        <h2 id="regions" className="font-serif text-3xl font-semibold text-primary-dark">Sri Lankan communities around the world</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">These countries are examples, not restrictions. CupidMatch supports worldwide country selection and city search. Available members and matches depend on registrations and individual preferences.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{regions.map(({name,context})=><article key={name} className="rounded-2xl border border-gold/25 bg-card p-6"><h3 className="font-serif text-2xl font-semibold text-primary">{name}</h3><p className="mt-3 leading-7 text-muted-foreground">{context}</p></article>)}</div>
      </section>
      <section className="mt-16 max-w-4xl space-y-5">
        <h2 className="font-serif text-3xl font-semibold text-primary-dark">Cross-border relationships need clarity</h2>
        <p className="leading-8 text-muted-foreground">When considering someone in another country, discuss language, time zones, travel, willingness to relocate, career plans and family expectations early. Create a clear biodata profile, share your partner preferences and take your time before making commitments.</p>
        <p className="leading-8 text-muted-foreground">Always verify the identity of someone you meet online, protect sensitive information and avoid sending money. CupidMatch does not guarantee a match or a visa outcome.</p>
        <h2 className="pt-5 font-serif text-3xl font-semibold text-primary-dark">Explore matrimonial communities</h2>
        <div className="flex flex-wrap gap-5 text-sm font-semibold text-primary">
          <Link href="/sri-lankan-matrimony-uk">Sri Lankan matrimony</Link>
          <Link href="/tamil-matrimony-uk">Tamil matrimony</Link>
          <Link href="/indian-matrimony-uk">Indian matrimony</Link>
          <Link href="/sinhala-matrimony">Sinhala matrimony</Link>
          <Link href="/horoscope-matching">Horoscope matching</Link>
          <Link href="/safety">Online safety</Link>
        </div>
      </section>
    </main><Footer />
  </div>;
}
