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
    localAdvice: [
      { title: "Search locally before widening your area", text: "Start with the distance you could manage for an ordinary weekend visit. A person in the Greater Toronto Area might begin nearby, then decide whether Ottawa or Montréal is realistic. An introduction between Vancouver and Toronto needs a different plan for calls and visits. Share your current city or province and your realistic search area separately." },
      { title: "Write a profile that explains your plans", text: "Example: ‘I’m based in Mississauga and speak Tamil and English. I’d like to stay in Ontario for the next few years, but I’m open to an introduction from another province if we can agree on a plan for visits. I’d prefer to talk one-to-one before arranging a family call.’ This tells someone how an introduction might work without sharing an address or employer." },
      { title: "Plan an introduction with family overseas", text: "If relatives live in Sri Lanka or India, choose a call time that works for both households. Ask the person you are speaking with who they would like to join and which language would make everyone comfortable. After the call, agree privately on what you want to share with family." },
    ],
    questions: [
      { question: "Can I look for a match outside my province?", answer: "Yes. Decide whether you are open to visits only or would also consider settling elsewhere. Put your preferred locations in your profile and discuss practical travel before either person books a trip." },
      { question: "Should I put my work or study details in my biodata?", answer: "A broad description of your field and work pattern is enough for a first introduction. Mention commitments that affect location or call times, and keep identifying documents and exact workplace details private." },
    ],
    related: [["Sri Lankan matrimony in Canada", "/sri-lankan-matrimony-canada"]],
  },
  australia: {
    name: "Australia",
    location: "in Australia",
    intro: "Explore marriage-focused introductions within Australia and across borders. Use your biodata to describe your background and what you want to build together.",
    guide: "If you are considering introductions across states or overseas, be clear about your time zone, availability for family calls and willingness to travel or relocate. Discuss whether you both prefer to settle in Australia.",
    localAdvice: [
      { title: "Decide what interstate introductions would involve", text: "A match within Melbourne may be straightforward to meet, while introductions between Sydney and Perth may require a planned visit. If you work shifts or weekends, share when you are usually free. Before arranging travel, discuss how often you could meet and whether either person would genuinely consider moving states." },
      { title: "Give people a concrete starting point", text: "Example: ‘I’m based in Melbourne and speak English and Tamil. I’m looking to build a life in Australia and would consider introductions in other states. I can usually make a weekend video call, and I’d like to introduce family after we’ve had a few conversations.’ Adapt the example to your own plans and availability." },
      { title: "Coordinate calls across Australia and overseas", text: "Specify the city and date when proposing a time. Check both calendars before inviting relatives in Sri Lanka, India or the UK, especially when a location changes its clocks. If an initial call runs late for one household, keep it short and arrange a second conversation at a better time." },
    ],
    questions: [
      { question: "How do I discuss staying in Australia after marriage?", answer: "Say whether staying in Australia is an essential preference or whether you would consider living elsewhere. If you are open to an interstate move but unsure about an overseas move, explain those two choices separately." },
      { question: "What can I do before arranging an interstate meeting?", answer: "Have a video conversation first and agree on a public place for the meeting. Keep your own transport and accommodation arrangements, and let someone you trust know your plans." },
    ],
    related: [["Sri Lankan matrimony in Australia", "/sri-lankan-matrimony-australia"]],
  },
  europe: {
    name: "Europe",
    location: "across Europe",
    intro: "Explore marriage-focused introductions across European countries, including France, Germany and Switzerland. Set your country preferences and share which languages you are comfortable using with a partner and their family.",
    guide: "For cross-border introductions, talk about where you could build a home, how often you can meet in person and how you would involve families living in different countries. Discuss language preferences for both everyday life and family conversations.",
    localAdvice: [
      { title: "Choose countries based on where you could settle", text: "Start with your current country and the places you could genuinely consider. Someone in France might be open to nearby cross-border introductions but want to stay close to family. Someone in Germany or Switzerland may have different work or caring commitments. State your preferred home base and whether you are open to relocation." },
      { title: "Talk about language in daily life and with relatives", text: "A couple might speak English together, use French or German at work and speak Tamil or Sinhala with relatives. Ask how the other person imagines language working at home and at family gatherings. Discuss whether you would help each other learn a language if one person moved." },
      { title: "Show how an introduction would work", text: "Example: ‘I’m based near Lyon and speak Tamil, French and English. I’d like to stay in France initially, but I’m open to an introduction with someone in a neighbouring country. I’d prefer a video call first, followed by a family introduction if we both want to continue.’" },
    ],
    questions: [
      { question: "How do we compare different places to live?", answer: "Pick one or two realistic locations. Compare the effect on work, family visits, language and everyday routines. Keep unresolved administrative questions separate and verify them independently before making commitments." },
      { question: "Can family join from outside Europe?", answer: "Yes, if both people are comfortable with that. Agree who will join, choose a language for the call and let each household know the local date and time before sharing the invitation." },
    ],
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

        <section className="space-y-5" aria-labelledby="regional-advice">
          <h2 id="regional-advice" className="text-2xl font-semibold text-primary-dark">Planning a matrimony search {area.location}</h2>
          {area.localAdvice.map(({ title, text }) => (
            <div key={title} className="space-y-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="max-w-3xl leading-8 text-muted-foreground">{text}</p>
            </div>
          ))}
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

        <section className="space-y-4" aria-labelledby="regional-questions">
          <h2 id="regional-questions" className="text-2xl font-semibold text-primary-dark">Common questions</h2>
          {area.questions.map(({ question, answer }) => (
            <div key={question} className="space-y-2 rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{question}</h3>
              <p className="leading-7 text-muted-foreground">{answer}</p>
            </div>
          ))}
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
