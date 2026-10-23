import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The basic expectations and responsibilities when using CupidMatch’s worldwide matrimony platform.",
  alternates: { canonical: "https://cupidmatch.co.uk/terms" },
};

export default function Page() {
  return <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main id="main-content" className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link href="/" className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Home</Link><span aria-hidden="true" className="px-2">/</span><span aria-current="page">Terms of Service</span></nav>
      <header className="mt-10 border-b border-border pb-10">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">CupidMatch · Sri Lankan roots, worldwide connections</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-primary-dark sm:text-6xl">Terms of Service</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">The basic expectations and responsibilities when using CupidMatch’s worldwide matrimony platform.</p>
      </header>
      <div className="mt-10 space-y-9"><section id="section-1" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Who CupidMatch is for</h2><p className="mt-3 leading-8 text-muted-foreground">CupidMatch is designed for marriage-focused connections within the Sri Lankan community worldwide. Members must be at least 18 years old, provide accurate account details, and use the service lawfully.</p></section>
<section id="section-2" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Accounts and security</h2><p className="mt-3 leading-8 text-muted-foreground">Keep login credentials confidential and tell support if you suspect unauthorised access. Do not impersonate someone else, create deceptive profiles or misuse other people's information.</p></section>
<section id="section-3" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Introductions, not guarantees</h2><p className="mt-3 leading-8 text-muted-foreground">CupidMatch facilitates introductions and communication. It does not guarantee compatibility, a relationship, marriage, travel permission or immigration outcomes. Make your own decisions and verify information independently.</p></section>
<section id="section-4" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Acceptable use</h2><p className="mt-3 leading-8 text-muted-foreground">Treat others respectfully. No harassment, threats, sexual exploitation, scams, spam, hate speech or attempts to obtain money through deception. Follow the Community Guidelines.</p></section>
<section id="section-5" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Plans and payments</h2><p className="mt-3 leading-8 text-muted-foreground">Available plans, billing frequency, renewal terms, cancellation methods and refund rights must be displayed accurately at purchase and confirmed against the actual payment setup. This page does not replace checkout disclosures.</p></section>
<section id="section-6" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Safety and moderation</h2><p className="mt-3 leading-8 text-muted-foreground">Content or accounts may be reviewed or restricted to protect members and enforce platform rules, subject to the final moderation process and applicable law.</p></section>
<section id="section-7" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Legal details and changes</h2><p className="mt-3 leading-8 text-muted-foreground">The contracting legal entity, business address, governing law, dispute process, effective date and contact information require verification before these terms are adopted as the final binding agreement.</p></section></div>
      <aside className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-primary-dark">Questions or concerns?</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Contact CupidMatch support if you need clarification or would like to report a concern.</p>
        <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Contact support</Link>
      </aside>
    </main>
    <Footer />
  </div>;
}
