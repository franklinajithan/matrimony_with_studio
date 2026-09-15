import {
  ArrowRight,
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
  Wand2,
  Map,
  Users,
  CheckCircle2,
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
    { icon: Lock, label: "Privacy controls", description: "You choose what to share" },
    { icon: Shield, label: "Verification available", description: "Optional identity checks" },
    { icon: Languages, label: "Sinhala · Tamil · English", description: "Three languages supported" },
  ];

  return (
    <section className="border-y border-border bg-accent/10 px-4 py-12 sm:px-6" aria-label="Trust highlights">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-10 text-center text-2xl font-bold text-foreground sm:text-3xl">
          More than a match score
        </h2>
        <ul className="grid gap-6 sm:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="mt-3 text-sm font-semibold leading-5 text-foreground">{item.label}</span>
              <span className="mt-1 text-xs text-muted-foreground">{item.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function WhyCupidMatch() {
  const features = [
    {
      icon: "🤝",
      title: "Shared Values",
      subtitle: "More than surface compatibility",
      description: "Match based on life goals, communication style, and what truly matters to you both.",
    },
    {
      icon: "🌍",
      title: "Life Goals",
      subtitle: "Plan your future together",
      description: "Understand relocation openness, career flexibility, and where you both want to settle.",
    },
    {
      icon: "💬",
      title: "Communication Preferences",
      subtitle: "How you connect matters",
      description: "Discover how you both handle disagreements and build understanding.",
    },
    {
      icon: "👨‍👩‍👧",
      title: "Family Expectations",
      subtitle: "Respect and boundaries",
      description: "Define involvement levels, living arrangements, and responsibilities that work for you.",
    },
    {
      icon: "🏡",
      title: "Lifestyle",
      subtitle: "Day-to-day compatibility",
      description: "Explore daily routines, social preferences, and practical lifestyle alignment.",
    },
    {
      icon: "🎭",
      title: "Cultural Preferences",
      subtitle: "Optional and self-described",
      description: "Language, traditions, festivals — share what's meaningful while staying flexible.",
    },
  ];

  return (
    <section className="bg-background px-4 py-20 sm:px-6" aria-labelledby="why-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 id="why-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
            Designed around the whole relationship
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            Understand compatibility through shared values and practical future plans
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <div className="mb-3">
                <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                <p className="text-sm font-medium text-primary">{feature.subtitle}</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: "📝",
      title: "Tell us what matters",
      description: "Build your profile with your values, lifestyle, future plans, and what you're looking for in a partner.",
    },
    {
      number: "2",
      icon: "💡",
      title: "Understand each introduction",
      description: "See clear explanations for every match — why this person was suggested and what you have in common.",
    },
    {
      number: "3",
      icon: "💬",
      title: "Connect at your own pace",
      description: "Send interest, start conversations, and take things forward when it feels right for both of you.",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-accent/20 to-background px-4 py-20 sm:px-6" aria-labelledby="how-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Getting Started
          </p>
          <h2 id="how-heading" className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            How it works
          </h2>
        </div>

        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.number} className="relative">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {step.number}
                  </span>
                  <span className="text-4xl">{step.icon}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:block">
                  <ArrowRight className="h-8 w-8 text-border" aria-hidden="true" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FeatureGrid() {
  const features = [
    {
      icon: Wand2,
      title: "AI Profile Studio",
      description: "Get help crafting your biography and prompts. Translate approved text between languages.",
      status: "Coming soon" as const,
    },
    {
      icon: Map,
      title: "Future Map",
      description: "Compare current location, future plans, relocation openness, and career flexibility.",
      status: "Coming soon" as const,
    },
    {
      icon: Sparkles,
      title: "Culture Preferences",
      description: "Express language, festivals, food, and traditions with granular importance levels.",
      status: "Coming soon" as const,
    },
    {
      icon: Users,
      title: "Family Circle",
      description: "Invite family with member-controlled permissions. View, suggest, or comment with boundaries.",
      status: "Coming soon" as const,
    },
    {
      icon: CheckCircle2,
      title: "Verification",
      description: "Optional identity and liveness checks. Know exactly what each badge means.",
      status: "Coming soon" as const,
    },
    {
      icon: MessageCircle,
      title: "Guided Conversations",
      description: "Meaningful prompts and optional AI assistance to help start important conversations.",
      status: "Available" as const,
    },
  ];

  return (
    <section className="bg-accent/10 px-4 py-20 sm:px-6" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Platform Features
          </p>
          <h2 id="features-heading" className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Built for meaningful connections
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            Tools designed to help you understand compatibility and build confidence in your decisions
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md"
            >
              {feature.status === "Coming soon" && (
                <div className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  Coming soon
                </div>
              )}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Features marked "Coming soon" are in development. Only implemented features are shown in member-facing flows.
          </p>
        </div>
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

export function GlobalLocationsSection() {
  const locations = [
    {
      name: "London",
      country: "United Kingdom",
      image: "🏛️",
      members: "2.5k+ active",
    },
    {
      name: "Toronto",
      country: "Canada",
      image: "🍁",
      members: "1.8k+ active",
    },
    {
      name: "Colombo",
      country: "Sri Lanka",
      image: "🌴",
      members: "3.2k+ active",
    },
    {
      name: "Melbourne",
      country: "Australia",
      image: "🦘",
      members: "1.5k+ active",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-20 sm:px-6" aria-labelledby="locations-heading">
      <div className="mx-auto max-w-7xl text-center">
        <h2 id="locations-heading" className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Built for life between countries
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600">
          Whether you're in London, Toronto, Melbourne or Colombo, find someone who gets the beauty and complexity of living across cultures
        </p>

        <div className="relative mt-16">
          {/* Connecting lines */}
          <svg className="absolute left-0 top-0 h-full w-full" style={{ zIndex: 0 }}>
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: "#9333ea", stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: "#ec4899", stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
            <path
              d="M150,80 Q400,150 650,80"
              stroke="url(#line-gradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
            />
            <path
              d="M150,80 Q400,20 650,80"
              stroke="url(#line-gradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
            />
          </svg>

          <div className="relative z-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {locations.map((location) => (
              <div
                key={location.name}
                className="group relative overflow-hidden rounded-3xl border-2 border-purple-200 bg-white p-6 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
              >
                <div className="mb-4 text-6xl">{location.image}</div>
                <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
                <p className="text-sm text-gray-600">{location.country}</p>
                <p className="mt-2 text-xs font-semibold text-purple-600">{location.members}</p>
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-10 transition-all group-hover:scale-150" />
              </div>
            ))}
          </div>
        </div>
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

export function MemberShowcase() {
  const members = [
    {
      name: "Nishmi, 26",
      location: "London",
      verified: true,
      image: "👩",
      interests: ["Travel", "Reading", "Yoga"],
    },
    {
      name: "Dilshan, 29",
      location: "Toronto",
      verified: true,
      image: "👨",
      interests: ["Photography", "Hiking", "Cooking"],
    },
    {
      name: "Tara, 27",
      location: "Colombo",
      verified: true,
      image: "👩",
      interests: ["Art", "Music", "Dance"],
    },
    {
      name: "Kasthuri, 31",
      location: "Melbourne",
      verified: true,
      image: "👩",
      interests: ["Fitness", "Tech", "Food"],
    },
    {
      name: "Praveen, 28",
      location: "London",
      verified: true,
      image: "👨",
      interests: ["Sports", "Movies", "Travel"],
    },
    {
      name: "Saman, 30",
      location: "Sydney",
      verified: true,
      image: "👨",
      interests: ["Business", "Investing", "Golf"],
    },
  ];

  return (
    <section className="bg-white px-4 py-20 sm:px-6" aria-labelledby="members-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 id="members-heading" className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Meet some of our members
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Real people looking for meaningful connections
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.name}
              className="group overflow-hidden rounded-3xl border-2 border-purple-100 bg-white shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
            >
              <div className="relative h-64 bg-gradient-to-br from-purple-200 to-pink-200">
                <div className="flex h-full items-center justify-center text-8xl">{member.image}</div>
                {member.verified && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-600 shadow-lg">
                    <BadgeCheck className="h-4 w-4 fill-purple-500 text-white" />
                    Verified
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.location}</p>
                  </div>
                  <Heart className="h-6 w-6 text-gray-300 transition-colors hover:fill-pink-500 hover:text-pink-500" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {member.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
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
  const plans = [
    {
      name: "Free",
      price: "LKR 0",
      period: "per month",
      description: "Join and start looking for your match",
      features: [
        "Create your profile",
        "Unlimited messaging",
        "100,000+ profiles",
        "Organize",
      ],
      cta: "Get started",
      highlighted: false,
    },
    {
      name: "Plus",
      price: "LKR 1,200",
      period: "per month",
      description: "Get noticed faster",
      features: [
        "Unlimited messaging",
        "1-on-1 video call",
        "See who's visited you",
        "Organize",
      ],
      cta: "Choose Plus",
      highlighted: true,
    },
    {
      name: "Elite",
      price: "LKR 2,400",
      period: "per month",
      description: "Make the most of your search",
      features: [
        "Unlimited messaging",
        "Get top positioning",
        "1-on-1 video call",
        "See who's viewed you",
        "Organize",
      ],
      cta: "Choose Elite",
      highlighted: false,
    },
  ];

  return (
    <section className="bg-background px-4 py-20 sm:px-6" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Pricing
          </p>
          <h2 id="pricing-heading" className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Start free. Upgrade when you need more.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
            Create your profile free. Then upgrade to unlock additional features when you're ready.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border-2 p-8 transition-all ${
                plan.highlighted
                  ? "scale-105 border-primary bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-xl"
                  : "border-border bg-card hover:shadow-md"
              }`}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-block rounded-full bg-card px-4 py-1 text-xs font-bold text-primary">
                  MOST POPULAR
                </div>
              )}
              <h3
                className={`text-2xl font-bold ${
                  plan.highlighted ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {plan.name}
              </h3>
              <div className="mt-4">
                <span
                  className={`text-5xl font-bold ${
                    plan.highlighted ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`ml-2 text-sm ${
                    plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`mt-2 text-sm ${
                  plan.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}
              >
                {plan.description}
              </p>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 ${
                      plan.highlighted ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    <BadgeCheck
                      className={`h-5 w-5 ${
                        plan.highlighted ? "text-primary-foreground" : "text-primary"
                      }`}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-8 w-full rounded-full py-6 text-base font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-card text-primary hover:bg-card/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Link href="/pricing">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const faqs = [
    {
      q: "Who is CupidMatch for?",
      a: "CupidMatch is for Sri Lankan adults worldwide seeking marriage. We serve never-married, divorced, and widowed members aged 18+ in the UK, Canada, Australia, and other countries, as well as people in Sri Lanka open to international relationships.",
    },
    {
      q: "How do international matches work?",
      a: "Our Future Map feature (coming soon) helps you compare current location, future settlement plans, relocation openness, and long-distance tolerance. You can express where you are now and where you want to be.",
    },
    {
      q: "What verification is available?",
      a: "We offer optional identity and liveness checks. Each verification badge states exactly what was checked — we never imply that verification guarantees safety or honesty. Email and phone verification are also available.",
    },
    {
      q: "How does family involvement work?",
      a: "Family Circle (coming soon) allows member-controlled invitations with granular permissions. You decide who can view your profile, suggest matches, or comment privately. Family helpers cannot impersonate you or accept matches on your behalf.",
    },
    {
      q: "What privacy controls do I have?",
      a: "You control profile visibility, photo reveal requests, and who can contact you. Privacy defaults minimize exposure. You can block or report members, and pause your account at any time.",
    },
    {
      q: "How do AI recommendations work?",
      a: "Our matching algorithm is deterministic and explainable. You'll see clear evidence-based reasons for each suggestion, like shared settlement preferences or aligned family expectations. AI doesn't decide who is eligible — you do.",
    },
    {
      q: "Can I cancel my subscription?",
      a: "Yes. You can cancel anytime through your account settings or billing portal. Core safety features remain available to everyone, regardless of subscription status.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-24 bg-accent/10 px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl">
        <h2 id="faq-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="mt-10 space-y-4">
          {faqs.map((item, index) => (
            <AccordionItem 
              key={item.q} 
              value={`item-${index}`} 
              className="rounded-2xl border border-border bg-card px-6 shadow-sm"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline hover:text-primary">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
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
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary/90 px-6 py-14 text-center text-primary-foreground shadow-xl sm:px-12 sm:py-16">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-card/20 text-card">
          <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
        </div>
        <h2
          id="cta-heading"
          className="mx-auto mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Connect with clarity and confidence
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 opacity-90 sm:text-base">
          Create your profile, set your preferences, and meet people who understand where you come from — and where you're going.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-card px-8 font-semibold text-primary shadow-md hover:bg-card/90"
          >
            <Link href="/signup">Build my profile</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-2 border-card/40 bg-transparent px-8 font-semibold text-card hover:bg-card/10"
          >
            <Link href="/success-stories">Success stories</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm opacity-80">Free to join · Privacy controls built in</p>
      </div>
    </section>
  );
}
