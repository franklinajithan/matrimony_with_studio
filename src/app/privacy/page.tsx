import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Understand how CupidMatch handles personal information, profile visibility, and privacy requests.",
  alternates: { canonical: "https://cupidmatch.co.uk/privacy" },
};

export default function Page() {
  return <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main id="main-content" className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link href="/" className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Home</Link><span aria-hidden="true" className="px-2">/</span><span aria-current="page">Privacy Policy</span></nav>
      <header className="mt-10 border-b border-border pb-10">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">CupidMatch · Sri Lankan roots, worldwide connections</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-primary-dark sm:text-6xl">Privacy Policy</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">Understand how CupidMatch handles personal information, profile visibility, and privacy requests.</p>
      </header>
      <div className="mt-10 space-y-9"><section id="section-1" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">What information you provide</h2><p className="mt-3 leading-8 text-muted-foreground">When you register or use CupidMatch, you may provide account information, profile details, photographs, partner preferences, messages and information you choose to share about your cultural background. Some of this information may be sensitive. Only provide information you are comfortable sharing.</p></section>
<section id="section-2" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Why information is used</h2><p className="mt-3 leading-8 text-muted-foreground">Information is used to operate account registration, profiles, matchmaking, communication, moderation, safety and support. Specific processing purposes, lawful bases and retention periods must be confirmed against CupidMatch’s production services before this policy is treated as final.</p></section>
<section id="section-3" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Profiles and other members</h2><p className="mt-3 leading-8 text-muted-foreground">Published profile information may be visible to other members according to your privacy settings. Other members may save or share information they see. Avoid adding home addresses, identity documents or sensitive contact details to your public profile.</p></section>
<section id="section-4" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Service providers and international use</h2><p className="mt-3 leading-8 text-muted-foreground">CupidMatch serves people worldwide. Its hosting, authentication, analytics, email and payment providers, their locations, and applicable international transfer safeguards must be verified and listed in the final policy.</p></section>
<section id="section-5" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Your choices and requests</h2><p className="mt-3 leading-8 text-muted-foreground">You can update profile information and use available privacy settings. For access, correction, deletion, restriction or other applicable privacy rights, contact CupidMatch. The exact deletion and retention process must reflect the implemented account-deletion system.</p></section>
<section id="section-6" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Cookies and tracking</h2><p className="mt-3 leading-8 text-muted-foreground">Details of essential cookies, optional analytics, consent choices and third-party tools must be completed from the live deployment configuration.</p></section></div>
      <aside className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-primary-dark">Questions or concerns?</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Contact CupidMatch support if you need clarification or would like to report a concern.</p>
        <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Contact support</Link>
      </aside>
    </main>
    <Footer />
  </div>;
}
