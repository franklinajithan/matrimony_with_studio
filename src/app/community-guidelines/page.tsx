import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "A respectful, safe space for Sri Lankan community connections around the world.",
  alternates: { canonical: "https://cupidmatch.co.uk/community-guidelines" },
};

export default function Page() {
  return <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main id="main-content" className="mx-auto max-w-4xl px-5 py-12 sm:py-20">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link href="/" className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Home</Link><span aria-hidden="true" className="px-2">/</span><span aria-current="page">Community Guidelines</span></nav>
      <header className="mt-10 border-b border-border pb-10">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary">CupidMatch · Sri Lankan roots, worldwide connections</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-primary-dark sm:text-6xl">Community Guidelines</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">A respectful, safe space for Sri Lankan community connections around the world.</p>
      </header>
      <div className="mt-10 space-y-9"><section id="section-1" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Respect every member</h2><p className="mt-3 leading-8 text-muted-foreground">People across the Sri Lankan diaspora have different languages, faiths, ethnicities, backgrounds and life experiences. Treat everyone with dignity. No racist, caste-based, religious or other hateful abuse.</p></section>
<section id="section-2" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Be genuine</h2><p className="mt-3 leading-8 text-muted-foreground">Use accurate profile details and photos of yourself. Do not impersonate someone, misrepresent marital status or create fake accounts.</p></section>
<section id="section-3" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Consent and boundaries</h2><p className="mt-3 leading-8 text-muted-foreground">Respect refusals and personal boundaries. Never pressure anyone to reply, meet, send photographs or share private contact details.</p></section>
<section id="section-4" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">No scams or solicitation</h2><p className="mt-3 leading-8 text-muted-foreground">Do not request money, promote fraudulent investment schemes, demand gifts or use matchmaking to solicit commercial services.</p></section>
<section id="section-5" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Protect privacy</h2><p className="mt-3 leading-8 text-muted-foreground">Do not post someone else's personal information, screenshots, private messages or photos without permission. Avoid sharing sensitive details too early.</p></section>
<section id="section-6" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Meet safely</h2><p className="mt-3 leading-8 text-muted-foreground">Get to know people gradually, verify claims, use public meeting places and tell someone you trust about in-person plans. Report suspicious behaviour.</p></section>
<section id="section-7" className="scroll-mt-24 border-b border-border pb-8 last:border-0"><h2 className="font-serif text-2xl font-semibold text-primary-dark">Report problems</h2><p className="mt-3 leading-8 text-muted-foreground">If you experience abuse or suspicious behaviour, use available reporting tools or contact support. For an immediate threat, contact local emergency services. Decisions about reports depend on context and applicable rules.</p></section></div>
      <aside className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-semibold text-primary-dark">Questions or concerns?</h2>
        <p className="mt-3 leading-7 text-muted-foreground">Contact CupidMatch support if you need clarification or would like to report a concern.</p>
        <Link href="/contact" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Contact support</Link>
      </aside>
    </main>
    <Footer />
  </div>;
}
