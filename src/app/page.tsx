"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowRight,
  Brain,
  Check,
  ChevronRight,
  Heart,
  Languages,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Telescope,
  UserCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { auth } from "@/lib/firebase/config";

const features = [
  {
    icon: Brain,
    title: "Meaningful matches",
    description:
      "Thoughtful suggestions shaped by your values, lifestyle and what truly matters to you.",
    accent: "bg-violet-50 text-violet-700",
  },
  {
    icon: Telescope,
    title: "Horoscope compatibility",
    description:
      "Explore traditional compatibility insights alongside modern matching preferences.",
    accent: "bg-amber-50 text-amber-700",
  },
  {
    icon: UserCheck,
    title: "Genuine profiles",
    description:
      "Profile checks and clear trust signals help you connect with greater confidence.",
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: LockKeyhole,
    title: "Privacy by choice",
    description:
      "You decide who can view your photos and personal details at every stage.",
    accent: "bg-rose-50 text-rose-700",
  },
  {
    icon: MessageCircle,
    title: "Secure conversations",
    description:
      "Get to know a match in one safe place before choosing to share contact details.",
    accent: "bg-sky-50 text-sky-700",
  },
  {
    icon: Languages,
    title: "Made for our community",
    description:
      "Built for Indian and Sri Lankan communities, with Tamil and Sinhala preferences.",
    accent: "bg-fuchsia-50 text-fuchsia-700",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your profile",
    description: "Tell us about yourself, your values and the future you imagine.",
  },
  {
    number: "02",
    title: "Discover compatible people",
    description: "Receive relevant matches and refine them with your preferences.",
  },
  {
    number: "03",
    title: "Start a real conversation",
    description: "Connect securely and take the next step when the time feels right.",
  },
];

const stories = [
  {
    names: "Priya & Rohan",
    location: "London",
    quote:
      "We connected across cities, but our values felt close from the very first conversation.",
    initials: "P&R",
    gradient: "from-rose-200 to-orange-100",
  },
  {
    names: "Aisha & Sameer",
    location: "Manchester",
    quote:
      "The suggestions felt personal, not random. We found someone our families adore too.",
    initials: "A&S",
    gradient: "from-violet-200 to-pink-100",
  },
  {
    names: "Lakshmi & Arjun",
    location: "Colombo",
    quote:
      "CupidMatch made it easier to find a person who understands our culture and ambitions.",
    initials: "L&A",
    gradient: "from-amber-200 to-rose-100",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
        return;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffaf7]">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-rose-200" />
          <div className="relative rounded-full bg-white p-4 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
          </div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-500">
          Preparing your experience...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#fffdfb] text-slate-900">
      <Navbar />

      <main>
        <section className="relative border-b border-rose-100 bg-[#fff8f4]">
          <div className="absolute left-0 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="container relative mx-auto grid min-h-[720px] items-center gap-12 px-4 py-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-20">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Modern matchmaking, rooted in your values
              </div>

              <h1 className="text-5xl font-black leading-[1.06] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
                Find someone who feels like{" "}
                <span className="relative whitespace-nowrap text-rose-600">
                  home.
                  <svg
                    aria-hidden="true"
                    className="absolute -bottom-2 left-0 w-full text-rose-300"
                    viewBox="0 0 220 12"
                    fill="none"
                  >
                    <path
                      d="M3 9C57 2 139 2 217 7"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-slate-600 lg:mx-0">
                A trusted matrimony experience for Indian and Sri Lankan
                communities—bringing together compatibility, culture and genuine
                intention.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-14 w-full rounded-full bg-rose-600 px-8 text-base font-bold text-white shadow-[0_14px_30px_rgba(225,29,72,.25)] hover:bg-rose-700 sm:w-auto"
                >
                  <Link href="/signup">
                    Create your free profile
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-14 w-full rounded-full px-7 text-base font-semibold text-slate-700 hover:bg-white hover:text-rose-700 sm:w-auto"
                >
                  <Link href="/discover">
                    Browse matches
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600 lg:justify-start">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 rounded-full bg-emerald-100 p-0.5 text-emerald-700" />
                  Free to join
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 rounded-full bg-emerald-100 p-0.5 text-emerald-700" />
                  Privacy controls
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 rounded-full bg-emerald-100 p-0.5 text-emerald-700" />
                  Genuine connections
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[570px]">
              <div className="absolute -inset-5 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-rose-200 to-amber-100" />
              <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-gradient-to-b from-rose-100 to-rose-50 shadow-[0_30px_80px_rgba(92,38,57,.18)]">
                <div className="absolute left-6 top-6 z-10 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-700 shadow-sm backdrop-blur">
                  Your story starts here
                </div>
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/matrimony-09-06-2025.firebasestorage.app/o/image%2Ferasebg-transformed.png?alt=media&token=643c5055-790b-4fbe-baa8-7815fe4498d9"
                  alt="Woman in elegant traditional attire"
                  width={570}
                  height={720}
                  priority
                  className="h-[540px] w-full object-contain object-bottom sm:h-[620px]"
                />
                <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <Heart className="h-5 w-5 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">
                        A new compatible match
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        Shared values · Family-minded · 92% match
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      Verified
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-5 top-1/3 hidden rounded-2xl border border-white bg-white/95 p-4 shadow-xl backdrop-blur sm:block">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Compatibility</p>
                    <p className="font-extrabold text-slate-900">Thoughtfully matched</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container relative mx-auto px-4 pb-10 lg:px-8">
            <div className="grid divide-y divide-rose-100 overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                ["10,000+", "members building meaningful futures"],
                ["Tamil · Sinhala · English", "preferences that feel familiar"],
                ["Safe by design", "privacy and trust at every step"],
              ].map(([title, text]) => (
                <div key={title} className="px-6 py-5 text-center">
                  <p className="font-extrabold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28" id="features">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-rose-600">
                Why CupidMatch
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                More than matching profiles
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                The right technology should make meeting someone feel more
                human—not less.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group rounded-3xl border border-slate-200/80 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-[0_20px_50px_rgba(80,30,50,.09)]"
                  >
                    <div
                      className={`inline-flex rounded-2xl p-3 ${feature.accent}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-xl font-extrabold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#28131d] py-20 text-white sm:py-28">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="container relative mx-auto px-4 lg:px-8">
            <div className="grid items-start gap-12 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-rose-300">
                  Simple, respectful, personal
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                  Three steps to a meaningful hello
                </h2>
                <p className="mt-6 max-w-lg text-lg leading-8 text-rose-100/70">
                  No endless swiping. Build a complete profile, discover real
                  compatibility and connect with intention.
                </p>
                <Button
                  asChild
                  className="mt-8 h-12 rounded-full bg-white px-7 font-bold text-[#28131d] hover:bg-rose-50"
                >
                  <Link href="/signup">
                    Begin your journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-4">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur sm:grid-cols-[64px_1fr] sm:items-center"
                  >
                    <div className="text-3xl font-black text-rose-300">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="mt-1 leading-7 text-rose-100/65">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fffaf7] py-20 sm:py-28" id="success-stories">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-rose-600">
                  Real beginnings
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Stories that started with hello
                </h2>
              </div>
              <Link
                href="/success-stories"
                className="inline-flex items-center font-bold text-rose-700 hover:text-rose-800"
              >
                Read all stories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {stories.map((story) => (
                <article
                  key={story.names}
                  className="rounded-3xl border border-rose-100 bg-white p-7 shadow-[0_12px_35px_rgba(70,30,45,.06)]"
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${story.gradient} text-lg font-black text-slate-800`}
                  >
                    {story.initials}
                  </div>
                  <div className="mt-6 flex gap-1 text-amber-400" aria-label="5 stars">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-5 text-lg font-medium leading-8 text-slate-700">
                    “{story.quote}”
                  </blockquote>
                  <div className="mt-7 border-t border-slate-100 pt-5">
                    <p className="font-extrabold text-slate-900">{story.names}</p>
                    <p className="text-sm text-slate-500">{story.location}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:py-24">
          <div className="container mx-auto overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-rose-600 via-rose-600 to-fuchsia-700 px-6 py-14 text-center text-white shadow-[0_30px_80px_rgba(190,24,93,.22)] sm:px-12 sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <Users className="h-7 w-7" />
            </div>
            <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Your person could be one conversation away.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-rose-50/90">
              Join a community looking for commitment, shared values and a
              future built together.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-14 rounded-full bg-white px-9 text-base font-bold text-rose-700 hover:bg-rose-50"
            >
              <Link href="/signup">
                Join CupidMatch free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-rose-100">
              <ShieldCheck className="h-4 w-4" />
              Your details stay under your control
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
