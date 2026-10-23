import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: "Learn about accessibility at CupidMatch, including keyboard navigation, readable content, reporting barriers and requesting accessible support.",
  alternates: { canonical: "https://cupidmatch.co.uk/accessibility" },
};

const sections = [
  {
    id: "using",
    title: "Using CupidMatch",
    text: "CupidMatch is a matrimony platform serving the Sri Lankan community worldwide. We aim to make the experience usable by people with different abilities, assistive technologies and devices.",
    items: ["Navigate using a keyboard where supported by your browser and device.", "Zoom in using browser controls and adjust your device's text-size settings.", "Use the site on mobile, tablet or desktop.", "Contact us if a step in registration, profile editing or matchmaking is difficult to use."],
  },
  {
    id: "approach",
    title: "Our accessibility approach",
    text: "We use the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA as our accessibility target. This is a goal, not a claim that every page has been independently audited or fully conforms.",
    items: ["Clear headings, labels and descriptive links", "Visible keyboard focus and logical navigation", "Readable contrast, scalable text and responsive layouts", "Form errors that explain how to correct a problem", "Accessible names and descriptions for interactive controls"],
  },
  {
    id: "limitations",
    title: "Known limitations and ongoing improvements",
    text: "Some interactive areas, uploaded images or third-party services may not yet work equally well with every assistive technology. We are reviewing onboarding, profile editing, member search, image controls, verification and payment journeys. We cannot yet confirm full WCAG 2.2 AA conformance.",
    items: ["Third-party authentication and payment experiences may have their own accessibility limitations.", "Images uploaded by members may not always have useful alternative descriptions.", "Some complex member interactions may need improvements for keyboard or screen-reader use."],
  },
] as const;

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-5xl px-5 py-12 sm:py-20">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <Link className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/">Home</Link>
          <span aria-hidden="true" className="px-2">/</span>
          <span aria-current="page">Accessibility</span>
        </nav>
        <header className="max-w-3xl border-b border-border pb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">CupidMatch · Everyone deserves access</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-primary-dark sm:text-6xl">Accessibility statement</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">We want CupidMatch to be welcoming and usable for people across the Sri Lankan community worldwide, including people with disabilities.</p>
        </header>
        <div className="grid gap-10 py-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="mb-3 text-sm font-semibold text-primary-dark">On this page</h2>
            <ul className="space-y-2 text-sm leading-6">
              {[...sections, {id:"feedback",title:"Report an accessibility issue"}].map(section => (
                <li key={section.id}><a className="rounded text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={`#${section.id}`}>{section.title}</a></li>
              ))}
            </ul>
          </nav>
          <div className="space-y-12">
            {sections.map(section => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
                <h2 id={`${section.id}-title`} className="font-serif text-3xl font-semibold text-primary-dark">{section.title}</h2>
                <p className="mt-4 leading-8 text-muted-foreground">{section.text}</p>
                <ul className="mt-5 list-disc space-y-3 pl-6 leading-7 marker:text-primary">
                  {section.items.map(item=><li key={item}>{item}</li>)}
                </ul>
              </section>
            ))}
            <section id="feedback" aria-labelledby="feedback-title" className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 id="feedback-title" className="font-serif text-3xl font-semibold text-primary-dark">Report an accessibility issue</h2>
              <p className="mt-4 leading-8 text-muted-foreground">If you encounter an accessibility barrier, please tell us which page or feature caused difficulty, what happened and, if you wish, which device, browser or assistive technology you were using. Please do not share passwords or sensitive personal details.</p>
              <Link href="/contact" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Contact CupidMatch support
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">If a normal site form is inaccessible, mention that in your message so we can discuss an alternative way to help.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
