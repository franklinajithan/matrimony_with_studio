import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { primaryLink, secondaryLink } from "@/components/marketing/PublicPage";

const regions = {
  canada: {
    name: "Canada",
    location: "in Canada",
    intro: "Build a marriage-focused profile for introductions in Canada or with families overseas. Share where you live, where you would consider settling and how you want family to be involved.",
    guide: "If you are open to introductions across provinces, discuss travel and where each of you could realistically settle. Include the languages you use at home and whether an initial video call would work across time zones.",
    related: [["Sri Lankan matrimony in Canada", "/sri-lankan-matrimony-canada"]],
  },
  australia: {
    name: "Australia",
    location: "in Australia",
    intro: "Explore marriage-focused introductions within Australia and across borders. Use your biodata to describe your background and what you want to build together.",
    guide: "If you are considering introductions across states or overseas, be clear about your time zone, availability for family calls and willingness to travel or relocate. Discuss whether you both prefer to settle in Australia.",
    related: [["Sri Lankan matrimony in Australia", "/sri-lankan-matrimony-australia"]],
  },
  europe: {
    name: "Europe",
    location: "across Europe",
    intro: "Explore marriage-focused introductions across European countries, including France, Germany and Switzerland. Set your country preferences and share which languages you are comfortable using with a partner and their family.",
    guide: "For cross-border introductions, talk about where you could build a home, how often you can meet in person and how you would involve families living in different countries. Discuss language preferences for both everyday life and family conversations.",
    related: [
      ["Sri Lankan matrimony in France", "/sri-lankan-matrimony-france"],
      ["Sri Lankan matrimony in Germany", "/sri-lankan-matrimony-germany"],
      ["Sri Lankan matrimony in Switzerland", "/sri-lankan-matrimony-switzerland"],
    ],
  },
} as const;

type PageProps = { params: Promise<{ region: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(regions).map(region => ({ region }));
}

async function getRegion(params: PageProps["params"]) {
  const { region } = await params;
  if (!Object.hasOwn(regions, region)) notFound();
  return { region, ...regions[region as keyof typeof regions] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region, name } = await getRegion(params);
  return {
    title: `Tamil, Sri Lankan & Indian Matrimony in ${name}`,
    description: `Explore marriage-focused Tamil, Sri Lankan and Indian matrimony in ${name}. Create a biodata, share your values and set partner preferences on CupidMatch.`,
    alternates: { canonical: `/matrimony/${region}` },
  };
}

export default async function RegionalMatrimonyPage({ params }: PageProps) {
  const area = await getRegion(params);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-5xl space-y-10 px-5 py-14 sm:py-20">
        <header className="space-y-5">
          <Link href="/international-matrimony" className="text-sm text-primary underline">International matrimony</Link>
          <h1 className="font-serif text-4xl font-semibold text-primary-dark sm:text-5xl">
            Tamil, Sri Lankan &amp; Indian matrimony {area.location}
          </h1>
          <p className="max-w-3xl leading-8 text-muted-foreground">{area.intro}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className={primaryLink}>Create a free profile</Link>
            <Link href="/matrimony-biodata-guide" className={secondaryLink}>Read the biodata guide</Link>
          </div>
        </header>

        <section className="rounded-3xl border bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-primary-dark">What to discuss before an introduction</h2>
          <p className="mt-3 leading-8 text-muted-foreground">{area.guide}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary-dark">Make your profile reflect what matters to you</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li><strong className="text-foreground">Tamil matrimony.</strong> Share whether speaking Tamil at home or with family is important to you.</li>
            <li><strong className="text-foreground">Sri Lankan matrimony.</strong> Describe your family ties and any preferences around introductions in Sri Lanka or abroad.</li>
            <li><strong className="text-foreground">Indian matrimony.</strong> Describe the regional, language and family traditions that matter to you and how flexible you are about them.</li>
          </ul>
          <p className="text-sm text-muted-foreground">Available profiles vary by location and current membership.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary-dark">Explore more</h2>
          <ul className="flex flex-wrap gap-4 text-sm font-semibold text-primary">
            {area.related.map(([label, href]) => <li key={href}><Link className="underline" href={href}>{label}</Link></li>)}
            <li><Link className="underline" href="/matrimony-guides/long-distance-matrimony">Long-distance matrimony checklist</Link></li>
            <li><Link className="underline" href="/matrimony-guides/first-matrimony-call">Questions for a first matrimony call</Link></li>
            <li><Link className="underline" href="/family-assisted-matrimony">Family introductions</Link></li>
            <li><Link className="underline" href="/safety">Online safety</Link></li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
