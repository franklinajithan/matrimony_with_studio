import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

const title = "Sri Lankan Matrimony in Australia";
const url = "https://cupidmatch.co.uk/sri-lankan-matrimony-australia";
const description = "Explore Sri Lankan matrimonial introductions in Australia, including Tamil and Sinhala communities, partner preferences and safe connections.";
export const metadata: Metadata = { title, description, alternates: { canonical: url }, openGraph: { title: title + " | CupidMatch", description, url, type: "website" } };

export default function Page() {
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://cupidmatch.co.uk/" },
    { "@type": "ListItem", position: 2, name: title, item: url },
  ] };
  return <div className="min-h-screen bg-background">
    <Navbar />
    <main id="main-content" className="mx-auto max-w-4xl px-5 py-14 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link href="/" className="underline">Home</Link> / {title}</nav>
      <h1 className="mt-10 font-serif text-4xl font-semibold text-primary-dark sm:text-6xl">{title}</h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground">CupidMatch is designed for marriage-focused introductions among Sri Lankan communities worldwide, including people living in Australia. Members can share their personal values, cultural background and partner preferences.</p>
      <section className="mt-12 space-y-5">
        <h2 className="font-serif text-3xl text-primary">Planning a meaningful introduction</h2>
        <p className="leading-8 text-muted-foreground">For introductions involving Australia, consider distance, career plans and family expectations. Discuss these subjects early and respectfully, alongside compatibility and communication.</p>
        <p className="leading-8 text-muted-foreground">Tamil, Sinhala and other Sri Lankan communities are diverse. Individual preferences matter more than assumptions about someone&apos;s background. The availability of members in any location depends on registrations.</p>
      </section>
      <section className="mt-12 space-y-5">
        <h2 className="font-serif text-3xl text-primary">Safety and privacy</h2>
        <p className="leading-8 text-muted-foreground">Verify identity before meeting, protect personal details and never send money to someone you have only met online. International introductions do not guarantee a match or visa outcome.</p>
        <Link href="/safety" className="font-semibold text-primary underline">Read our safety guidance</Link>
      </section>
      <div className="mt-12 flex flex-wrap gap-5">
        <Link href="/signup" className="rounded-full bg-primary px-6 py-3 font-semibold text-white">Create your profile</Link>
        <Link href="/international-matrimony" className="rounded-full border border-gold/40 px-6 py-3 font-semibold text-primary">International matrimony</Link>
      </div>
    </main><Footer />
  </div>;
}
