import {
  BadgeCheck,
  Eye,
  Filter,
  Globe2,
  Heart,
  Languages,
  Lock,
  MessageCircle,
  MoonStar,
  Shield,
  Smartphone,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { focusRing, focusRingOnDark } from "@/components/landing/brand";

export function TrustStrip() {
  const items = [
    { icon: Heart, label: "Profiles built for serious intentions" },
    { icon: Lock, label: "Privacy controls" },
    { icon: Languages, label: "Cultural and language preferences" },
    { icon: MessageCircle, label: "Secure conversations" },
  ];

  return (
    <section className="px-4 py-10 sm:px-6" aria-label="Trust highlights">
      <ul className="mx-auto grid max-w-6xl gap-4 rounded-2xl border border-[#EADFD6] bg-white px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-sm text-[#271624]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8EAF1] text-[#4B164C]">
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="leading-5 text-[#725E6D]">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WhyCupidMatch() {
  const cards = [
    {
      icon: UserRound,
      title: "Profiles with purpose",
      description: "Detailed profiles help you understand the person beyond a photograph.",
      highlighted: true,
    },
    {
      icon: Sparkles,
      title: "Smarter compatibility",
      description: "Suggestions shaped by your values, lifestyle and long-term preferences.",
      highlighted: false,
    },
    {
      icon: MoonStar,
      title: "Tradition, respected",
      description: "Horoscope compatibility is available when it matters to you and your family.",
      highlighted: false,
    },
    {
      icon: Lock,
      title: "Privacy in your hands",
      description: "Choose what you share, who can see it and when you are ready to connect.",
      highlighted: false,
    },
  ];

  return (
    <section className="bg-[#FBF5F1] px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="why-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A52A68]">
          The CupidMatch difference
        </p>
        <h2 id="why-heading" className="mt-3 max-w-2xl font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
          Modern matching. Cultural understanding.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#725E6D]">
          Technology can introduce you. Trust, shared values and honest conversation help you
          decide what comes next.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className={
                  card.highlighted
                    ? "rounded-2xl border border-[#4B164C]/25 bg-[#4B164C] p-7 text-[#FFFDF9] shadow-[0_16px_40px_rgba(48,18,42,0.16)]"
                    : "rounded-2xl border border-[#EADFD6] bg-white p-7 transition duration-200 hover:-translate-y-0.5 hover:border-[#D6B56D]/70 hover:shadow-[0_12px_30px_rgba(48,18,42,0.08)]"
                }
              >
                <div
                  className={
                    card.highlighted
                      ? "flex h-11 w-11 items-center justify-center rounded-xl bg-[#D6B56D]/20 text-[#F2C96D]"
                      : "flex h-11 w-11 items-center justify-center rounded-xl bg-[#F8EAF1] text-[#4B164C]"
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3
                  className={`mt-5 font-serif text-xl font-semibold ${
                    card.highlighted ? "text-[#FFFDF9]" : "text-[#271624]"
                  }`}
                >
                  {card.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    card.highlighted ? "text-[#F0E0E8]" : "text-[#725E6D]"
                  }`}
                >
                  {card.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Tell us who you are",
      description: "Create a thoughtful profile and share the values that matter to you.",
    },
    {
      number: "02",
      title: "Meet compatible people",
      description: "Explore considered suggestions instead of endless random profiles.",
    },
    {
      number: "03",
      title: "Build a real connection",
      description: "Start a secure conversation and take the next step with confidence.",
    },
  ];

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A52A68]">How it works</p>
        <h2 id="how-heading" className="mt-3 font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
          From profile to possibility
        </h2>

        <ol className="relative mt-10 grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.number} className="relative rounded-2xl border border-[#EADFD6] bg-white p-7">
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute right-[-13px] top-1/2 z-10 hidden h-px w-6 -translate-y-1/2 border-t border-dashed border-[#D6B56D] lg:block"
                />
              )}
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[-18px] left-8 h-5 w-px border-l border-dashed border-[#D6B56D] lg:hidden"
                />
              )}
              <span className="font-serif text-3xl font-semibold text-[#D6B56D]">{step.number}</span>
              <h3 className="mt-4 text-lg font-semibold text-[#271624]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#725E6D]">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ProductPreview() {
  return (
    <section className="bg-[#FBF5F1] px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="preview-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A52A68]">
            Product experience
          </p>
          <h2 id="preview-heading" className="mt-3 font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
            Designed for considered introductions
          </h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <aside
            className="rounded-[1.75rem] border border-[#EADFD6] bg-white p-5 shadow-[0_16px_40px_rgba(48,18,42,0.08)] sm:p-6"
            aria-label="Sample profile preview"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="rounded-full bg-[#F8EAF1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4B164C]">
                Sample profile
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3F6B54]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#EADFD6] bg-[#FFFDF9]">
              <div className="flex items-center gap-4 border-b border-[#EADFD6] p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D6B56D]/35 font-serif text-xl font-semibold text-[#4B164C]">
                  CM
                </div>
                <div>
                  <p className="font-semibold text-[#271624]">Member preview</p>
                  <p className="text-sm text-[#725E6D]">Colombo · Tamil · Professionally settled</p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2">
                  {["Family-minded", "Values-led", "Open to relocate"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#EADFD6] bg-white px-3 py-1 text-xs font-medium text-[#4B164C]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="rounded-xl border border-[#EADFD6] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D6B56D]">
                      Profile readiness
                    </p>
                    <p className="text-xs font-medium text-[#725E6D]">Thoughtfully completed</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F8EAF1]">
                    <div className="h-full w-[82%] rounded-full bg-[#4B164C]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className={`h-11 rounded-xl border-[#EADFD6] text-[#271624] hover:bg-[#FBF5F1] ${focusRing}`}
                  >
                    <Link href="/signup">View Profile</Link>
                  </Button>
                  <Button asChild className={`h-11 rounded-xl bg-[#4B164C] text-white hover:bg-[#742158] ${focusRing}`}>
                    <Link href="/signup">Connect</Link>
                  </Button>
                </div>

                <p className="text-xs leading-5 text-[#725E6D]">
                  Illustrative sample only. This is not a real member profile.
                </p>
              </div>
            </div>
          </aside>

          <div className="grid gap-5 content-start">
            <article className="rounded-2xl border border-[#EADFD6] bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8EAF1] text-[#4B164C]">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-[#271624]">Secure conversation</h3>
              <p className="mt-2 text-sm leading-6 text-[#725E6D]">
                Get to know each other inside CupidMatch before sharing contact details.
              </p>
            </article>
            <article className="rounded-2xl border border-[#EADFD6] bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8EAF1] text-[#4B164C]">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-[#271624]">Thoughtful compatibility</h3>
              <p className="mt-2 text-sm leading-6 text-[#725E6D]">
                Review values, preferences and optional horoscope information in one place.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PrivacySection() {
  const points = [
    "Choose who can view your personal details",
    "Control photo and contact-information visibility",
    "Use clear verification signals",
    "Block or report inappropriate users",
    "Chat securely before sharing external contact information",
  ];

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="privacy-heading">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A52A68]">
            Built around trust
          </p>
          <h2 id="privacy-heading" className="mt-3 font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
            Take your time. Stay in control.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#725E6D]">
            A matrimony profile contains personal information. CupidMatch is designed to help you
            share thoughtfully, connect securely and move forward at your own pace.
          </p>
        </div>
        <ul className="space-y-3 rounded-2xl border border-[#EADFD6] bg-white p-6 sm:p-7">
          {points.map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-6 text-[#271624]">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B56D]" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CommunitySection() {
  const chips = [
    "Indian communities",
    "Sri Lankan communities",
    "Tamil",
    "Sinhala",
    "English",
    "UK & diaspora",
    "London",
    "Chennai",
    "Colombo",
    "Toronto",
    "Sydney",
  ];

  return (
    <section className="bg-[#F8EAF1] px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="community-heading">
      <div className="mx-auto max-w-6xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4B164C]">
          <Globe2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2
          id="community-heading"
          className="mt-5 font-serif text-3xl font-semibold text-[#271624] sm:text-4xl"
        >
          Made for communities that cross borders
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#725E6D]">
          CupidMatch is built for Indian and Sri Lankan communities—with Tamil, Sinhala and English
          preferences—whether you live locally or across the UK and the wider diaspora.
        </p>
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-[#4B164C]/15 bg-white px-3.5 py-1.5 text-sm text-[#4B164C]"
            >
              {chip}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-[#725E6D]">
          Location labels reflect communities we design for, not claims about current member
          activity in each city.
        </p>
      </div>
    </section>
  );
}

export function SuccessStoriesPreview() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="stories-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 id="stories-heading" className="font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
            Stories that began with an introduction
          </h2>
          <p className="mt-4 text-base leading-7 text-[#725E6D]">
            We are carefully gathering real journeys from couples who met through CupidMatch. Until
            verified stories are ready to share, you can browse the success stories space or submit
            your own.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-[#EADFD6] bg-[#FBF5F1] p-8 sm:p-10">
          <p className="font-serif text-2xl font-semibold text-[#4B164C]">
            Real stories. Shared with care.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#725E6D]">
            Success stories will appear here once couples choose to share them. We do not publish
            invented testimonials.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className={`rounded-full bg-[#4B164C] px-6 text-white hover:bg-[#742158] ${focusRing}`}>
              <Link href="/success-stories">View success stories</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={`rounded-full border-[#EADFD6] px-6 text-[#4B164C] hover:bg-white ${focusRing}`}
            >
              <Link href="/success-stories/submit">Share your story</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesOverview() {
  const features = [
    { icon: Sparkles, label: "Smart match suggestions" },
    { icon: MoonStar, label: "Horoscope matching" },
    { icon: Filter, label: "Preference filters" },
    { icon: BadgeCheck, label: "Verified-profile signals" },
    { icon: Eye, label: "Private photo controls" },
    { icon: MessageCircle, label: "Secure messaging" },
    { icon: Languages, label: "Tamil, Sinhala & English" },
    { icon: Smartphone, label: "Responsive mobile experience" },
  ];

  return (
    <section className="bg-[#FBF5F1] px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="features-heading" className="font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
          Everything you need to begin thoughtfully
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li
              key={feature.label}
              className="flex items-center gap-3 rounded-2xl border border-[#EADFD6] bg-white px-4 py-4 text-sm font-medium text-[#271624]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8EAF1] text-[#4B164C]">
                <feature.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {feature.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PricingTeaser() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[#EADFD6] bg-white p-8 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          <h2 id="pricing-heading" className="font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
            Start free. Upgrade when you need more.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#725E6D]">
            Creating a profile is free, and you can explore core matching features at your own pace.
            Premium and Elite plans are available when you want additional capabilities.
          </p>
          <p className="mt-3 text-sm text-[#725E6D]">
            Current plans include Free (£0), Premium (£9.99/month) and Elite (£19.99/month).
          </p>
        </div>
        <Button asChild className={`mt-6 h-12 shrink-0 rounded-full bg-[#4B164C] px-7 text-white hover:bg-[#742158] lg:mt-0 ${focusRing}`}>
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>
    </section>
  );
}

export function FaqSection() {
  const faqs = [
    {
      q: "Is creating a CupidMatch profile free?",
      a: "Yes. You can create a profile at no cost and explore core matching features. Paid plans are available if you want additional capabilities.",
    },
    {
      q: "Who can see my photos and personal details?",
      a: "CupidMatch is designed so you remain in control of what you share. Profile settings help you manage visibility as conversations progress.",
    },
    {
      q: "Can I use CupidMatch outside India or Sri Lanka?",
      a: "Yes. CupidMatch is built for Indian and Sri Lankan communities worldwide, including people living in the UK and across the diaspora.",
    },
    {
      q: "Does CupidMatch support horoscope matching?",
      a: "Yes. Horoscope compatibility tools are available for members who want to include them in their matching journey.",
    },
    {
      q: "How do profile verification and reporting work?",
      a: "CupidMatch is designed to support clearer verification signals and reporting tools so members can flag inappropriate behaviour and feel more confident while connecting.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-24 bg-[#FBF5F1] px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl">
        <h2 id="faq-heading" className="font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="mt-8 rounded-2xl border border-[#EADFD6] bg-white px-5">
          {faqs.map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`} className="border-[#EADFD6]">
              <AccordionTrigger className="text-left text-[#271624] hover:no-underline hover:text-[#4B164C] focus-visible:ring-2 focus-visible:ring-[#4B164C]">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[#725E6D] leading-6">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-24" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#30122A] px-6 py-14 text-center text-[#FFFDF9] sm:px-12 sm:py-16">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D6B56D]/15 text-[#F2C96D]">
          <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
        </div>
        <h2
          id="cta-heading"
          className="mx-auto mt-5 max-w-3xl font-serif text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          A meaningful future can start with one introduction.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#F0E0E8] sm:text-base">
          Create your profile, set your preferences and meet people looking for the same kind of
          commitment.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className={`h-12 rounded-full bg-[#D6B56D] px-8 text-[#30122A] hover:bg-[#F2C96D] ${focusRingOnDark}`}
          >
            <Link href="/signup">Create my free profile</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={`h-12 rounded-full border-[#D6B56D]/40 bg-transparent px-8 text-[#FFFDF9] hover:bg-white/10 hover:text-white ${focusRingOnDark}`}
          >
            <Link href="/success-stories">View success stories</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-[#F2C96D]">Free to join · Your privacy stays in your hands</p>
      </div>
    </section>
  );
}
