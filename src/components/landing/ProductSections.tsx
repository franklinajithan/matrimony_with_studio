"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Bookmark,
  Eye,
  Flag,
  Languages,
  Lock,
  MessageCircle,
  MoonStar,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { focusRing, focusRingOnDark } from "@/components/landing/brand";
import { cn } from "@/lib/utils";

const orbitNodes = [
  { label: "Values", className: "left-[50%] top-[8%] -translate-x-1/2" },
  { label: "Personality", className: "right-[8%] top-[28%]" },
  { label: "Lifestyle", className: "right-[12%] bottom-[22%]" },
  { label: "Communication", className: "left-[50%] bottom-[6%] -translate-x-1/2" },
  { label: "Family", className: "left-[8%] bottom-[22%]" },
  { label: "Future plans", className: "left-[6%] top-[28%]" },
];

export function IntelligenceSection() {
  return (
    <section id="matching" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">
            Beyond basic filters
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">
            Matching built around real life
          </h2>
          <p className="mt-4 text-base leading-7 text-[#6F6A76]">
            CupidMatch considers multiple compatibility dimensions—values, personality, lifestyle,
            communication, family expectations and future plans—instead of only age, job and
            location.
          </p>
          <Button asChild className={`mt-7 rounded-full bg-[#6D28D9] px-6 text-white hover:bg-[#8B5CF6] ${focusRing}`}>
            <Link href="/suggestions">
              See why a profile was suggested
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div
            aria-hidden="true"
            className="cupid-orbit absolute inset-[12%] rounded-full border border-dashed border-[#8B5CF6]/35"
          />
          <div
            aria-hidden="true"
            className="absolute inset-[26%] rounded-full border border-[#E8E6EE] bg-gradient-to-br from-[#F1ECFF] to-[#FFF0EE]"
          />
          <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white shadow-[0_12px_40px_rgba(109,40,217,0.18)]">
            <Sparkles className="h-5 w-5 text-[#6D28D9]" aria-hidden="true" />
            <span className="mt-1 text-[11px] font-semibold text-[#17151C]">Fit</span>
          </div>
          {orbitNodes.map((node) => (
            <span
              key={node.label}
              className={cn(
                "absolute rounded-full border border-[#E8E6EE] bg-white px-3 py-1.5 text-xs font-medium text-[#17151C] shadow-sm",
                node.className
              )}
            >
              {node.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BentoFeatures() {
  return (
    <section className="bg-[#F7F5FB] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">
          Designed like a product, not a brochure
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-6 md:grid-rows-2">
          <article className="cupid-card rounded-3xl border border-[#E8E6EE] bg-white p-6 md:col-span-3">
            <Sparkles className="h-5 w-5 text-[#6D28D9]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-[#17151C]">Understand every suggestion</h3>
            <p className="mt-2 text-sm leading-6 text-[#6F6A76]">
              See meaningful reasons a profile may fit—shared goals, lifestyle alignment and
              communication style.
            </p>
            <div className="mt-5 space-y-2 rounded-2xl bg-[#F1ECFF]/70 p-4">
              {["Shared life goals", "Similar communication style", "Lifestyle compatibility"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-[#17151C]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6D28D9]" />
                    {item}
                  </div>
                )
              )}
            </div>
          </article>

          <article className="cupid-card rounded-3xl border border-[#E8E6EE] bg-[#17151C] p-6 text-white md:col-span-3">
            <Lock className="h-5 w-5 text-[#FF6B6B]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold">Privacy that adapts</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Control profile visibility, photo permissions and when contact details become
              available.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["Visibility", "Photos", "Contact"].map((item) => (
                <div key={item} className="rounded-xl bg-white/10 px-3 py-3 text-center text-xs font-medium">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="cupid-card rounded-3xl border border-[#E8E6EE] bg-white p-6 md:col-span-2">
            <MessageCircle className="h-5 w-5 text-[#FF6B6B]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-[#17151C]">Conversations with context</h3>
            <p className="mt-2 text-sm leading-6 text-[#6F6A76]">
              Secure messaging with optional prompts shaped by shared interests.
            </p>
          </article>

          <article className="cupid-card rounded-3xl border border-[#E8E6EE] bg-[#FFF0EE] p-6 md:col-span-2">
            <Languages className="h-5 w-5 text-[#6D28D9]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-[#17151C]">Culture when it matters</h3>
            <p className="mt-2 text-sm leading-6 text-[#6F6A76]">
              Language, community and optional horoscope preferences—without stereotypes.
            </p>
          </article>

          <article className="cupid-card rounded-3xl border border-[#E8E6EE] bg-white p-6 md:col-span-2">
            <BadgeCheck className="h-5 w-5 text-[#0F7A4A]" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-[#17151C]">Profile authenticity</h3>
            <p className="mt-2 text-sm leading-6 text-[#6F6A76]">
              Clear verification signals and profile-quality cues based on platform features.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

const sampleProfiles = [
  {
    initials: "A",
    gradient: "from-[#8B5CF6] to-[#6D28D9]",
    meta: "Manchester · Creative professional",
    tags: ["Tamil", "Family goals", "Travel"],
  },
  {
    initials: "B",
    gradient: "from-[#FF6B6B] to-[#8B5CF6]",
    meta: "Colombo · Technology",
    tags: ["Sinhala", "English", "Ambition"],
  },
  {
    initials: "C",
    gradient: "from-[#6D28D9] to-[#FF6B6B]",
    meta: "Toronto · Healthcare",
    tags: ["Values-led", "Local", "Communication"],
  },
];

export function DiscoveryPreview() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D28D9]">
              Product preview — sample profiles
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">
              Discover with clarity
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Recommended", "New", "Nearby", "Shared values", "Horoscope match"].map((pill, i) => (
              <span
                key={pill}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  i === 0
                    ? "border-[#6D28D9] bg-[#F1ECFF] text-[#6D28D9]"
                    : "border-[#E8E6EE] bg-white text-[#6F6A76]"
                )}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sampleProfiles.map((profile) => (
            <article
              key={profile.initials}
              className="cupid-card min-w-[260px] flex-1 rounded-3xl border border-[#E8E6EE] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-semibold text-white",
                    profile.gradient
                  )}
                >
                  {profile.initials}
                </div>
                <button
                  type="button"
                  aria-label="Shortlist sample profile"
                  className={`rounded-full border border-[#E8E6EE] p-2 text-[#6F6A76] hover:bg-[#F1ECFF] hover:text-[#6D28D9] ${focusRing}`}
                >
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-4 text-sm font-medium text-[#17151C]">Sample profile</p>
              <p className="mt-1 text-sm text-[#6F6A76]">{profile.meta}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#FAFAF8] px-2.5 py-1 text-[11px] text-[#6F6A76]">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-[#0F7A4A]">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified
                </span>
                <Button asChild size="sm" variant="outline" className={`rounded-full ${focusRing}`}>
                  <Link href="/signup">View profile</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    title: "Build a complete profile",
    text: "Share your personality, values, lifestyle and future plans.",
  },
  {
    title: "Set your boundaries",
    text: "Choose your preferences, privacy settings and who can contact you.",
  },
  {
    title: "Understand your matches",
    text: "See the meaningful reasons behind every suggestion.",
  },
  {
    title: "Connect intentionally",
    text: "Start a secure conversation and move forward at your own pace.",
  },
];

export function HowItWorksModern() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-[#F7F5FB] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">
          How CupidMatch works
        </h2>
        <ol className="mt-10 space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex gap-4 rounded-3xl border border-[#E8E6EE] bg-white p-5 sm:gap-6 sm:p-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1ECFF] text-sm font-semibold text-[#6D28D9]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[#17151C]">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#6F6A76]">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ConversationPreview() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">
            Better conversations start with context
          </h2>
          <p className="mt-4 text-base leading-7 text-[#6F6A76]">
            CupidMatch helps both people move beyond “hello” with shared interests and meaningful
            prompts.
          </p>
        </div>

        <div className="rounded-3xl border border-[#E8E6EE] bg-white p-5 shadow-[0_16px_40px_rgba(23,21,28,0.06)] sm:p-6">
          <div className="flex items-center justify-between border-b border-[#E8E6EE] pb-4">
            <div>
              <p className="text-sm font-semibold text-[#17151C]">Secure conversation</p>
              <p className="text-xs text-[#6F6A76]">Match context · Sample preview</p>
            </div>
            <button
              type="button"
              className={`rounded-full border border-[#E8E6EE] px-3 py-1.5 text-xs text-[#6F6A76] hover:bg-[#FFF0EE] ${focusRing}`}
              aria-label="Safety menu"
            >
              Safety
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-[#F1ECFF]/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6D28D9]">
              Shared interest
            </p>
            <p className="mt-1 text-sm text-[#17151C]">Both value family goals and open communication.</p>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-[#6F6A76]">Conversation starters</p>
            {["What does a typical weekend look like for you?", "What are you looking for in the next five years?"].map(
              (prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={`block w-full rounded-2xl border border-[#E8E6EE] bg-[#FAFAF8] px-4 py-3 text-left text-sm text-[#17151C] transition hover:border-[#8B5CF6]/40 hover:bg-[#F1ECFF]/40 ${focusRing}`}
                >
                  {prompt}
                </button>
              )
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#6F6A76]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF8EA] px-2.5 py-1 text-[#0F7A4A]">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Contact details protected
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0EE] px-2.5 py-1 text-[#B42318]">
              <Ban className="h-3 w-3" aria-hidden="true" />
              Block & report available
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SafetyCentre() {
  const items = [
    "Profile visibility controls",
    "Photo permission controls",
    "Verification indicators",
    "Block and report",
    "Contact-information protection",
    "Safety guidance",
    "Suspicious-behaviour reporting",
  ];

  return (
    <section id="safety" className="scroll-mt-24 bg-[#F7F5FB] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">
            Designed to protect your choices
          </h2>
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#17151C]">
                <Shield className="h-4 w-4 shrink-0 text-[#6D28D9]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Button
            asChild
            variant="outline"
            className={`mt-8 rounded-full border-[#E8E6EE] bg-white ${focusRing}`}
          >
            <Link href="/#faq">Explore safety</Link>
          </Button>
        </div>

        <div className="rounded-3xl border border-[#E8E6EE] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold text-[#17151C]">Settings preview</p>
          <div className="mt-4 space-y-3">
            {[
              { icon: Eye, label: "Who can view my profile", value: "Compatible matches" },
              { icon: Lock, label: "Photo sharing", value: "By permission" },
              { icon: Flag, label: "Reporting tools", value: "Available" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-2xl border border-[#E8E6EE] bg-[#FAFAF8] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <row.icon className="h-4 w-4 text-[#6D28D9]" aria-hidden="true" />
                  <span className="text-sm text-[#17151C]">{row.label}</span>
                </div>
                <span className="text-xs text-[#6F6A76]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CulturalPrefs() {
  const chips = [
    "Tamil",
    "Sinhala",
    "English",
    "Indian communities",
    "Sri Lankan communities",
    "Family values",
    "Religious preference",
    "Horoscope optional",
  ];

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-[#E8E6EE] bg-white p-8 sm:p-10">
        <div className="relative max-w-2xl">
          <div
            aria-hidden="true"
            className="cupid-weave pointer-events-none absolute -right-16 -top-10 hidden h-28 w-28 rounded-3xl opacity-40 md:block"
          />
          <h2 className="text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">
            Culture when it matters. Choice at every step.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#6F6A76]">
            Include language, community and tradition in your preferences—or focus entirely on
            personality, lifestyle and future goals.
          </p>
        </div>
        <ul className="mt-8 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-[#E8E6EE] bg-[#FAFAF8] px-3.5 py-2 text-sm text-[#17151C]"
            >
              {chip}
            </li>
          ))}
        </ul>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#6F6A76]">
          <MoonStar className="h-4 w-4 text-[#6D28D9]" aria-hidden="true" />
          Horoscope matching is optional and never required.
        </p>
      </div>
    </section>
  );
}

export function SuccessInvite() {
  return (
    <section className="bg-[#F7F5FB] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[#E8E6EE] bg-white p-8 sm:p-12">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">
          Every meaningful connection has a beginning.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#6F6A76]">
          We only share genuine stories when couples choose to. Until then, explore the space or
          submit your own when you are ready.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button asChild className={`rounded-full bg-[#6D28D9] px-6 text-white hover:bg-[#8B5CF6] ${focusRing}`}>
            <Link href="/success-stories">Explore success stories</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={`rounded-full border-[#E8E6EE] ${focusRing}`}
          >
            <Link href="/success-stories/submit">Share your story</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PricingPreview() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[#E8E6EE] bg-[#17151C] p-8 text-white sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start free. Upgrade when it feels useful.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/70">
            Create a profile free. Explore core matching features, then compare Free, Premium
            (£9.99/month) and Elite (£19.99/month) plans when you need more.
          </p>
        </div>
        <Button
          asChild
          className={`mt-6 h-12 shrink-0 rounded-full bg-white px-7 text-[#17151C] hover:bg-[#F1ECFF] lg:mt-0 ${focusRing}`}
        >
          <Link href="/pricing">Compare plans</Link>
        </Button>
      </div>
    </section>
  );
}

export function FaqModern() {
  const faqs = [
    {
      q: "How does matching work?",
      a: "CupidMatch uses your profile details and preferences—such as values, lifestyle and optional cultural or horoscope preferences—to surface considered suggestions rather than endless random profiles.",
    },
    {
      q: "Can I control who sees my photos?",
      a: "Yes. Profile and privacy settings are designed so you can manage visibility, including photo sharing, as conversations progress.",
    },
    {
      q: "Is CupidMatch only for specific communities?",
      a: "CupidMatch supports Indian and Sri Lankan communities and language preferences such as Tamil, Sinhala and English, while remaining open to people seeking serious, values-led relationships.",
    },
    {
      q: "Can family members help manage a profile?",
      a: "Profiles are created and managed by the account holder. Family involvement is a personal choice outside the core product flow.",
    },
    {
      q: "How does profile verification work?",
      a: "CupidMatch is designed to support clearer verification signals so members can feel more confident when browsing and connecting.",
    },
    {
      q: "Can I use CupidMatch outside the UK?",
      a: "Yes. CupidMatch is built for people in the UK and across the wider diaspora who want thoughtful, long-term introductions.",
    },
    {
      q: "Is horoscope matching compulsory?",
      a: "No. Horoscope matching is optional and available when it matters to you or your family.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-24 bg-[#F7F5FB] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-semibold tracking-tight text-[#17151C] sm:text-4xl">FAQ</h2>
        <Accordion type="single" collapsible className="mt-8 rounded-3xl border border-[#E8E6EE] bg-white px-5">
          {faqs.map((item, index) => (
            <AccordionItem key={item.q} value={`faq-${index}`} className="border-[#E8E6EE]">
              <AccordionTrigger className="text-left text-[#17151C] hover:no-underline hover:text-[#6D28D9] focus-visible:ring-2 focus-visible:ring-[#6D28D9]">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="leading-6 text-[#6F6A76]">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function FinalCtaModern() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-16">
        <div aria-hidden="true" className="cupid-mesh absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#6D28D9] via-[#8B5CF6] to-[#FF6B6B] opacity-95" aria-hidden="true" />
        <div className="relative">
          <UserRound className="mx-auto h-8 w-8 text-white/90" aria-hidden="true" />
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Meet people who make sense for your life.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
            Build a profile around who you are, what you value and where you want to go.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className={`h-12 rounded-full bg-white px-8 text-[#6D28D9] hover:bg-[#F1ECFF] ${focusRingOnDark}`}
            >
              <Link href="/signup">Create my profile</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={`h-12 rounded-full border-white/40 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white ${focusRingOnDark}`}
            >
              <Link href="/#how-it-works">Explore how it works</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-white/85">Private by default · Free to create a profile</p>
        </div>
      </div>
    </section>
  );
}
