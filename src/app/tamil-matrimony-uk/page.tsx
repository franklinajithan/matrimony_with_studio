import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const title = "Tamil Matrimony in the UK";
const description = "Meet people who share your Tamil heritage and your hopes for marriage. CupidMatch helps you introduce yourself through biodata, values and partner preference";
const canonical = "https://cupidmatch.co.uk/tamil-matrimony-uk";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title: `${title} | CupidMatch`, description, url: canonical, type: "website" },
};
const sections = [["Tamil matchmaking with room for individual choice","Tamil backgrounds span different regions, languages, customs and family experiences. Describe what matters to you, whether that is shared language, family expectations, education, career goals or where you hope to settle."],["Create a thoughtful matrimonial profile","Introduce your interests, values and future plans through your biodata. Use partner preferences to explain the qualities you value, rather than relying on a photo or a single compatibility score."],["Connecting across the UK","Whether you live in London or elsewhere in the UK, online introductions can broaden your search beyond immediate family networks. Take time to talk and decide what feels right for you."]];
const questions = [["Do I need to follow a particular Tamil tradition?","No. You can describe your own background and preferences. Not everyone from the same community has the same expectations."],["Can I control my personal information?","Review the profile privacy controls available to you before sharing sensitive details. Never publish financial or identity documents in a public profile."]];
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
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{"Meet people who share your Tamil heritage and your hopes for marriage. CupidMatch helps you introduce yourself through biodata, values and partner preferences."}</p>
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
