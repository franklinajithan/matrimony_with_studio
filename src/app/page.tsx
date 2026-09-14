"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  ChevronDown,
  Heart,
  Languages,
  Loader2,
  LockKeyhole,
  MessageCircleHeart,
  Search,
  ShieldCheck,
  Sparkles,
  Telescope,
  UserRoundCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { auth } from "@/lib/firebase/config";

const highlights = [
  {
    icon: UserRoundCheck,
    title: "Profiles with purpose",
    text: "Detailed profiles help you understand the person beyond a photograph.",
  },
  {
    icon: BrainCircuit,
    title: "Smarter compatibility",
    text: "Suggestions shaped by your values, lifestyle and long-term preferences.",
  },
  {
    icon: Telescope,
    title: "Tradition, respected",
    text: "Horoscope compatibility is available when it matters to you and your family.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy in your hands",
    text: "Choose what you share, who can see it and when you are ready to connect.",
  },
];

const journey = [
  {
    number: "1",
    title: "Tell us who you are",
    text: "Create a thoughtful profile and share the values that matter to you.",
  },
  {
    number: "2",
    title: "Meet compatible people",
    text: "Explore considered suggestions instead of endless random profiles.",
  },
  {
    number: "3",
    title: "Build a real connection",
    text: "Start a secure conversation and take the next step with confidence.",
  },
];

function Field({
  label,
  defaultValue,
  options,
}: {
  label: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#745b70]">
        {label}
      </span>
      <span className="relative block">
        <select
          defaultValue={defaultValue}
          className="h-12 w-full appearance-none rounded-xl border border-[#eadfe7] bg-white px-4 pr-10 text-sm font-semibold text-[#32122f] outline-none transition focus:border-[#8d2b70] focus:ring-4 focus:ring-[#8d2b70]/10"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7085]" />
      </span>
    </label>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffaf4]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_16px_50px_rgba(75,22,76,.12)]">
          <Loader2 className="h-7 w-7 animate-spin text-[#7c245f]" />
        </div>
        <p className="mt-5 text-sm font-semibold text-[#806979]">
          Opening CupidMatch...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#fffdf9] text-[#271624]">
      <Navbar />

      <main>
        <section className="relative isolate bg-[#4b164c] text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_80%_10%,rgba(244,183,96,.2),transparent_28%),radial-gradient(circle_at_15%_80%,rgba(210,83,138,.22),transparent_35%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:72px_72px]"
          />

          <div className="container mx-auto grid min-h-[650px] items-center gap-12 px-4 pb-32 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:pb-36 lg:pt-20">
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-[#ffe3b6] backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Matrimony with meaning
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[4.7rem]">
                Where shared values become a{" "}
                <span className="text-[#ffc86f]">shared future.</span>
              </h1>

              <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-white/72 lg:mx-0">
                Discover genuine people from Indian and Sri Lankan communities
                who are ready for commitment, family and a life built together.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-white/72 lg:justify-start">
                <span className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-[#ffc86f]" />
                  Genuine profiles
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#ffc86f]" />
                  Private by design
                </span>
                <span className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-[#ffc86f]" />
                  Tamil · Sinhala · English
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-4 rotate-2 rounded-[2rem] border border-[#ffc86f]/30" />
              <div className="relative overflow-hidden rounded-[2rem] bg-[#f7e8e4] shadow-[0_35px_100px_rgba(20,4,19,.38)]">
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-5">
                  <span className="rounded-full bg-[#4b164c]/85 px-4 py-2 text-xs font-bold tracking-wide text-white backdrop-blur">
                    A thoughtful beginning
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#a52a68] shadow-lg">
                    <Heart className="h-5 w-5 fill-current" />
                  </span>
                </div>

                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/matrimony-09-06-2025.firebasestorage.app/o/image%2Ferasebg-transformed.png?alt=media&token=643c5055-790b-4fbe-baa8-7815fe4498d9"
                  alt="Woman wearing elegant traditional attire"
                  width={520}
                  height={650}
                  priority
                  className="h-[520px] w-full object-contain object-bottom sm:h-[590px]"
                />

                <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/70 bg-white/92 p-4 text-[#32122f] shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f9e7ef] text-[#9c2d6a]">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold">Compatibility that matters</p>
                      <p className="mt-0.5 truncate text-sm text-[#7c6577]">
                        Values · Culture · Lifestyle · Family
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-8 top-1/2 hidden -translate-y-1/2 rounded-2xl border border-white/60 bg-white p-4 text-[#32122f] shadow-2xl xl:block">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-[#8b7085]">Built for</p>
                    <p className="font-extrabold">Serious intentions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-20 px-4">
          <div className="container mx-auto max-w-6xl rounded-[1.75rem] border border-[#ede2e9] bg-white p-5 shadow-[0_25px_70px_rgba(66,22,55,.14)] sm:p-7 lg:p-8">
            <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-lg font-black text-[#351331]">
                  Start your search
                </p>
                <p className="mt-1 text-sm text-[#806979]">
                  Tell us who you would like to meet.
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm font-bold text-[#8d2b70] hover:text-[#651d51]"
              >
                Already a member? Sign in
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
              <Field
                label="I'm looking for"
                defaultValue="A life partner"
                options={["A life partner", "Bride", "Groom"]}
              />
              <Field
                label="Age"
                defaultValue="25–35 years"
                options={["21–30 years", "25–35 years", "30–40 years", "35–45 years"]}
              />
              <Field
                label="Community"
                defaultValue="All communities"
                options={["All communities", "Indian", "Sri Lankan", "Tamil", "Sinhala"]}
              />
              <Button
                asChild
                className="h-12 rounded-xl bg-[#8d2b70] px-7 font-bold text-white shadow-[0_10px_25px_rgba(141,43,112,.22)] hover:bg-[#741f5b]"
              >
                <Link href="/signup">
                  <Search className="mr-2 h-4 w-4" />
                  Find matches
                </Link>
              </Button>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-[#8b7085]">
              <LockKeyhole className="h-3.5 w-3.5" />
              Joining is free. You remain in control of your profile and privacy.
            </p>
          </div>
        </section>

        <section className="bg-[#fffdf9] py-24 sm:py-28">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
              <div className="max-w-xl">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#a52a68]">
                  The CupidMatch difference
                </p>
                <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.035em] text-[#32122f] sm:text-5xl">
                  Modern matching. Cultural understanding.
                </h2>
                <p className="mt-5 text-lg leading-8 text-[#725e6d]">
                  Technology can introduce you. Trust, shared values and honest
                  conversation help you decide what comes next.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-8 h-12 rounded-full border-[#d7bdcf] px-6 font-bold text-[#742158] hover:bg-[#f9edf3] hover:text-[#5e1747]"
                >
                  <Link href="/about">
                    Discover our approach
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {highlights.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className={`rounded-[1.5rem] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        index === 0
                          ? "border-[#dcbccf] bg-[#f8eaf1]"
                          : "border-[#eee5ea] bg-white"
                      }`}
                    >
                      <span
                        className={`inline-flex rounded-xl p-3 ${
                          index === 0
                            ? "bg-[#8d2b70] text-white"
                            : "bg-[#f7edf2] text-[#8d2b70]"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <h3 className="mt-5 text-xl font-extrabold text-[#32122f]">
                        {item.title}
                      </h3>
                      <p className="mt-3 leading-7 text-[#766270]">{item.text}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#eee4e8] bg-[#fbf5f1] py-20 sm:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#a52a68]">
                How it works
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.035em] text-[#32122f] sm:text-5xl">
                From profile to possibility
              </h2>
            </div>

            <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
              <div
                aria-hidden="true"
                className="absolute left-[16%] right-[16%] top-9 hidden border-t border-dashed border-[#cdaabd] lg:block"
              />
              {journey.map((step) => (
                <article
                  key={step.number}
                  className="relative rounded-[1.5rem] border border-[#e8dade] bg-white p-7 text-center shadow-[0_10px_35px_rgba(68,28,54,.05)]"
                >
                  <span className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[6px] border-[#fbf5f1] bg-[#4b164c] text-2xl font-black text-[#ffc86f] shadow-lg">
                    {step.number}
                  </span>
                  <h3 className="mt-6 text-xl font-extrabold text-[#32122f]">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-xs leading-7 text-[#766270]">
                    {step.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2 lg:px-8">
            <div className="relative mx-auto w-full max-w-lg">
              <div className="rounded-[2rem] bg-[#f7edf2] p-5 sm:p-7">
                <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_20px_60px_rgba(70,25,58,.12)]">
                  <div className="flex items-start gap-4">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f1cbdc] to-[#f7dfbd] text-2xl font-black text-[#6f2454]">
                      CK
                      <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
                        <Check className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-lg font-black text-[#32122f]">
                          Sample profile
                        </p>
                        <span className="rounded-full bg-[#f6e7ee] px-2.5 py-1 text-xs font-bold text-[#8d2b70]">
                          New
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#806979]">
                        London · Family-minded
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["Tamil", "Professional", "Verified"].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-[#faf6f8] px-2.5 py-1 text-xs font-semibold text-[#705b69]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-xl border-[#e3d4dd] font-bold text-[#684d60]"
                    >
                      <Link href="/signup">View profile</Link>
                    </Button>
                    <Button
                      asChild
                      className="rounded-xl bg-[#8d2b70] font-bold text-white hover:bg-[#741f5b]"
                    >
                      <Link href="/signup">
                        <Heart className="mr-2 h-4 w-4" />
                        Connect
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#4b164c] p-5 text-white">
                    <MessageCircleHeart className="h-6 w-6 text-[#ffc86f]" />
                    <p className="mt-4 font-extrabold">Safe conversation</p>
                    <p className="mt-1 text-xs leading-5 text-white/65">
                      Talk within CupidMatch first.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#f4d9e5] p-5 text-[#4b164c]">
                    <Telescope className="h-6 w-6" />
                    <p className="mt-4 font-extrabold">Compatibility</p>
                    <p className="mt-1 text-xs leading-5 text-[#684d60]">
                      See the details that matter.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#a52a68]">
                Built around trust
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.035em] text-[#32122f] sm:text-5xl">
                Take your time. Stay in control.
              </h2>
              <p className="mt-6 text-lg leading-8 text-[#725e6d]">
                A matrimony profile contains personal information. CupidMatch is
                designed to help you share thoughtfully, connect securely and
                move forward at your own pace.
              </p>

              <ul className="mt-7 space-y-4">
                {[
                  "Choose who can view your personal details",
                  "Use clear profile and verification signals",
                  "Chat securely before sharing contact information",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[#584450]">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="font-semibold leading-6">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/privacy"
                className="mt-8 inline-flex items-center text-sm font-extrabold text-[#8d2b70] hover:text-[#651d51]"
              >
                Learn about privacy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:pb-24">
          <div className="container mx-auto overflow-hidden rounded-[2rem] bg-[#4b164c] px-6 py-14 text-center text-white shadow-[0_30px_80px_rgba(75,22,76,.2)] sm:px-12 sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-[#ffc86f]">
              <Heart className="h-7 w-7 fill-current" />
            </div>
            <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
              A meaningful future can start with one introduction.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/68">
              Create your profile, set your preferences and meet people looking
              for the same kind of commitment.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-14 w-full rounded-full bg-[#ffc86f] px-9 text-base font-black text-[#3e123d] hover:bg-[#ffd58d] sm:w-auto"
              >
                <Link href="/signup">
                  Create my free profile
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 w-full rounded-full border-white/25 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/success-stories">View success stories</Link>
              </Button>
            </div>
            <p className="mt-5 flex items-center justify-center gap-2 text-sm text-white/55">
              <ShieldCheck className="h-4 w-4" />
              Free to join · Your privacy stays in your hands
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
