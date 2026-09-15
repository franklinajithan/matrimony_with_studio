"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BadgeCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_IMAGE, focusRing } from "@/components/landing/brand";
import { HeroVectorBackground } from "@/components/landing/HeroVectorBackground";
import { cn } from "@/lib/utils";

const preferenceChips = [
  "Shared values",
  "Family goals",
  "Career ambition",
  "Communication",
  "Culture",
  "Lifestyle",
  "Location",
  "Horoscope",
];

export function ModernHero() {
  const [selected, setSelected] = useState<string[]>(["Shared values", "Lifestyle"]);
  const [privacyToggles, setPrivacyToggles] = useState({
    visibility: true,
    photos: true,
    contact: true,
  });

  const toggleChip = (chip: string) => {
    setSelected((prev) =>
      prev.includes(chip) ? prev.filter((item) => item !== chip) : [...prev, chip]
    );
  };

  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
      <div aria-hidden="true" className="cupid-mesh pointer-events-none absolute inset-0 opacity-90" />
      <HeroVectorBackground />

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        <div className="relative z-10 max-w-xl">
          <p className="inline-flex rounded-full border border-[#E8E6EE] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6D28D9]">
            The new way to find your person
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#17151C] sm:text-5xl sm:leading-[1.08]">
            Compatibility you can understand. Connections you can feel.
          </h1>
          <p className="mt-5 text-base leading-7 text-[#6F6A76] sm:text-lg sm:leading-8">
            CupidMatch brings your values, personality and future plans together to introduce
            people who genuinely make sense for your life.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className={`group h-12 rounded-full bg-[#6D28D9] px-7 text-white hover:bg-[#8B5CF6] ${focusRing}`}
            >
              <Link href="/signup">
                Build my profile
                <ArrowRight
                  className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={`h-12 rounded-full border-[#E8E6EE] bg-white px-7 text-[#17151C] hover:bg-[#F1ECFF] hover:text-[#6D28D9] ${focusRing}`}
            >
              <Link href="/#matching">See how matching works</Link>
            </Button>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm text-[#6F6A76]">
            <Shield className="h-4 w-4 text-[#6D28D9]" aria-hidden="true" />
            Private by default · Built for serious relationships
          </p>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[480px] lg:mx-0 lg:max-w-[520px]">
          <div
            className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#F1ECFF] via-[#FAFAF8] to-[#FFF0EE] sm:-inset-5 sm:rounded-[2.25rem]"
            aria-hidden="true"
          />

          {/* Main sample profile with photograph */}
          <article className="relative z-20 overflow-hidden rounded-3xl border border-[#E8E6EE] bg-white shadow-[0_24px_60px_rgba(23,21,28,0.1)]">
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <span className="rounded-full bg-[#F1ECFF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6D28D9]">
                Sample profile
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0F7A4A]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified profile
              </span>
            </div>

            <div className="relative mx-4 overflow-hidden rounded-2xl bg-gradient-to-b from-[#F1ECFF] to-[#FFF0EE] sm:mx-5">
              <div className="relative h-[240px] sm:h-[280px] lg:h-[300px]">
                <Image
                  src={HERO_IMAGE}
                  alt="Sample profile portrait of a woman in traditional attire"
                  fill
                  priority
                  sizes="(max-width: 1024px) 420px, 480px"
                  className="object-cover object-[center_18%]"
                />
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <p className="text-sm font-semibold text-[#17151C]">Profile preview</p>
                <p className="mt-1 text-xs text-[#6F6A76]">
                  Illustrative sample only. Not a real member.
                </p>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F6A76]">
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Tamil", "English"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#E8E6EE] bg-[#FAFAF8] px-2.5 py-1 text-xs text-[#17151C]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F6A76]">
                  Preferences
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Family goals", "Career", "Travel", "Shared values"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#FF6B6B]/25 bg-[#FFF0EE] px-2.5 py-1 text-xs text-[#17151C]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  className={`h-10 rounded-xl border-[#E8E6EE] text-[#17151C] hover:bg-[#FAFAF8] ${focusRing}`}
                >
                  <Link href="/signup">View profile</Link>
                </Button>
                <Button
                  asChild
                  className={`h-10 rounded-xl bg-[#6D28D9] text-white hover:bg-[#8B5CF6] ${focusRing}`}
                >
                  <Link href="/signup">Connect</Link>
                </Button>
              </div>
            </div>
          </article>

          {/* Compatibility — stacked on mobile; layered on large screens below photo body */}
          <aside className="relative z-30 mt-4 rounded-2xl border border-[#E8E6EE] bg-white/95 p-4 shadow-[0_16px_40px_rgba(23,21,28,0.08)] backdrop-blur lg:absolute lg:-left-8 lg:bottom-6 lg:mt-0 lg:w-[230px]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6D28D9]">
              Why you might connect
            </p>
            <p className="mt-1.5 text-[11px] leading-4 text-[#6F6A76]">
              Understand the reasons behind every suggestion.
            </p>
            <ul className="mt-3 space-y-2.5">
              {[
                { label: "Shared life goals", width: "w-4/5" },
                { label: "Communication style", width: "w-3/4" },
                { label: "Family expectations", width: "w-2/3" },
                { label: "Lifestyle", width: "w-4/5" },
                { label: "Cultural preferences", width: "w-3/5" },
              ].map((item) => (
                <li key={item.label}>
                  <p className="mb-1 text-xs text-[#6F6A76]">{item.label}</p>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECFF]">
                    <div className={cn("h-full rounded-full bg-[#8B5CF6]", item.width)} />
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* Privacy — below on mobile; top-right on large screens, clear of face */}
          <aside className="relative z-30 mt-4 rounded-2xl border border-[#E8E6EE] bg-white/95 p-4 shadow-[0_16px_40px_rgba(23,21,28,0.08)] backdrop-blur lg:absolute lg:-right-6 lg:top-[18%] lg:mt-0 lg:w-[220px]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FF6B6B]">
              Your profile visibility
            </p>
            <ul className="mt-3 space-y-3">
              {(
                [
                  { key: "visibility" as const, label: "Visible to compatible matches" },
                  { key: "photos" as const, label: "Photos shared by permission" },
                  { key: "contact" as const, label: "Contact details hidden" },
                ] as const
              ).map((row) => {
                const on = privacyToggles[row.key];
                return (
                  <li key={row.key} className="flex items-center justify-between gap-3">
                    <span className="text-xs leading-4 text-[#17151C]">{row.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={row.label}
                      onClick={() =>
                        setPrivacyToggles((prev) => ({ ...prev, [row.key]: !prev[row.key] }))
                      }
                      className={cn(
                        "relative h-5 w-9 shrink-0 rounded-full transition",
                        focusRing,
                        on ? "bg-[#6D28D9]" : "bg-[#E8E6EE]"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
                          on ? "left-4" : "left-0.5"
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[10px] leading-4 text-[#6F6A76]">
              Preview of privacy controls. Settings apply after you create a profile.
            </p>
          </aside>
        </div>
      </div>

      {/* Preference bar */}
      <div className="relative z-10 mx-auto mt-12 max-w-6xl rounded-3xl border border-[#E8E6EE] bg-white p-5 shadow-[0_12px_40px_rgba(23,21,28,0.05)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#17151C]">What matters most to you?</h2>
            <p className="mt-1 text-sm text-[#6F6A76]">
              Select preferences to personalise your journey.
            </p>
          </div>
          <Button
            asChild
            className={`shrink-0 rounded-full bg-[#17151C] px-5 text-white hover:bg-[#6D28D9] ${focusRing}`}
          >
            <Link href="/signup">Personalise my matches</Link>
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Preference chips">
          {preferenceChips.map((chip) => {
            const isOn = selected.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                aria-pressed={isOn}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition",
                  focusRing,
                  isOn
                    ? "border-[#6D28D9] bg-[#F1ECFF] text-[#6D28D9]"
                    : "border-[#E8E6EE] bg-[#FAFAF8] text-[#6F6A76] hover:border-[#8B5CF6]/50 hover:text-[#17151C]"
                )}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
