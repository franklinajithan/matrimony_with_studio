import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const url = "https://cupidmatch.co.uk/family-assisted-matrimony";
export const metadata: Metadata = {
  title: "Family-Assisted Sri Lankan Matrimony | CupidMatch",
  description: "Guidance for Sri Lankan families helping an adult relative find a matrimonial introduction, with consent, privacy and respectful communication.",
  alternates: { canonical: url },
  openGraph: {
    title: "Family-Assisted Sri Lankan Matrimony | CupidMatch",
    description: "A respectful guide to family involvement, consent and privacy in Sri Lankan matrimony.",
    url, type: "website",
  },
};

const questions = [
  { q: "Can my family help me search for a partner?", a: "Family members can offer advice and support, but the person seeking marriage should decide what information is shared and whom to contact." },
  { q: "Should a relative create a profile without asking?", a: "No. Get clear permission from the adult whose details or photographs would be used. Never impersonate them or share their private information without consent." },
  { q: "Can parents decide whom someone must marry?", a: "No. A matrimonial introduction is not consent to marriage. Both people must be free to decide whether to continue a conversation or relationship." },
  { q: "Does CupidMatch currently offer separate family-managed accounts?", a: "This page provides guidance, not a promise of a family-managed account feature. Members should use the registration and account features currently available." },
];

export default function FamilyAssistedMatrimonyPage() {
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: questions.map(({q,a}) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return <div className="min-h-screen bg-background">
    <Navbar />
    <main id="main-content" className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link href="/" className="underline">Home</Link> / Family-assisted matrimony</nav>
      <p className="mt-10 text-xs font-bold uppercase tracking-[.2em] text-gold-foreground">A guide for families</p>
      <h1 className="mt-4 font-serif text-4xl font-semibold text-primary-dark sm:text-6xl">Family-Assisted Sri Lankan Matrimony</h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">In many Sri Lankan families, parents, siblings and trusted relatives help introduce prospective partners. Their support can be valuable when the person seeking marriage stays in control of their own choices.</p>
      <section className="mt-12 space-y-5">
        <h2 className="font-serif text-3xl text-primary">Start with consent</h2>
        <p className="leading-8 text-muted-foreground">Before sharing someone&apos;s name, photographs, background or contact details, ask for their informed permission. Discuss what may be visible to others and respect their decision if they change their mind.</p>
        <h2 className="font-serif text-3xl text-primary">Discuss what matters</h2>
        <p className="leading-8 text-muted-foreground">Talk openly about location, language, career, family expectations and future plans. Avoid assuming that everyone in a Tamil, Sinhala or other Sri Lankan community wants the same things.</p>
        <h2 className="font-serif text-3xl text-primary">Keep introductions safe</h2>
        <p className="leading-8 text-muted-foreground">Do not send money to someone you have only met online. Verify identities, protect sensitive information and give both people space to make their own decisions.</p>
        <Link href="/safety" className="font-semibold text-primary underline">Read the safety guidance</Link>
      </section>
      <section className="mt-12 space-y-6" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-serif text-3xl text-primary">Frequently asked questions</h2>
        {questions.map(({q,a}) => <div key={q} className="border-b border-gold/20 pb-5"><h3 className="text-lg font-semibold text-foreground">{q}</h3><p className="mt-2 leading-7 text-muted-foreground">{a}</p></div>)}
      </section>
      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/signup" className="rounded-full bg-primary px-6 py-3 font-semibold text-white">Explore registration</Link>
        <Link href="/how-it-works" className="rounded-full border border-gold/40 px-6 py-3 font-semibold text-primary">How CupidMatch works</Link>
      </div>
    </main>
    <Footer />
  </div>;
}
