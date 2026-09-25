"use client";

import Image from "next/image";
import { BriefcaseBusiness, GraduationCap, Heart, Home, MapPin, MessageCircle, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const clamp = (n: number) => Math.min(1, Math.max(0, n));

function useSectionProgress() {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(0.75);
      return;
    }
    const update = () => {
      frame.current = null;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setProgress(clamp(-r.top / Math.max(1, r.height - innerHeight)));
    };
    const scroll = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", scroll, { passive: true });
    addEventListener("resize", scroll, { passive: true });
    return () => {
      removeEventListener("scroll", scroll);
      removeEventListener("resize", scroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);
  return { ref, progress };
}

export function CompatibilityStory() {
  const { ref, progress } = useSectionProgress();
  const reveal = clamp((progress - 0.08) / 0.84);
  const score = Math.round(64 + reveal * 28);
  const items = [
    [Sparkles, "Values"], [BriefcaseBusiness, "Lifestyle"], [GraduationCap, "Education"],
    [Users, "Family"], [MapPin, "Location"], [Heart, "Interests"],
  ] as const;

  return (
    <section ref={ref} className="relative h-[240svh] bg-[#FFFDFB]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-5">
        <div className="mx-auto w-full max-w-xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A078B0]">Built on what matters</p>
          <h2 className="mx-auto mt-3 max-w-sm font-serif text-[2rem] font-semibold leading-[1.05] text-[#2A1845] sm:text-5xl">
            High Compatibility Matches
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#6B5A78]">
            Our smart matching helps you find people who share your important preferences.
          </p>

          <div className="relative mx-auto mt-5 h-[300px] w-[300px] max-w-full sm:mt-8 sm:h-[330px] sm:w-[330px]">
            <div
              className="absolute left-1/2 top-1/2 h-[178px] w-[178px] -translate-x-1/2 -translate-y-1/2 rounded-full p-[11px] shadow-[0_18px_50px_rgba(124,58,237,.12)]"
              style={{ background: `conic-gradient(#7C3AED 0deg, #D946EF ${reveal*331}deg, #F1E8F8 ${reveal*331}deg 360deg)` }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                <span className="font-serif text-5xl font-semibold text-[#2A1845]">{score}%</span>
                <span className="mt-1 text-xs font-semibold text-[#6B5A78]">Compatibility</span>
              </div>
            </div>
            {items.map(([Icon,label],i) => {
              const angle = (-90 + i*60) * Math.PI/180;
              const radius = 139;
              return (
                <div key={label} className="absolute flex w-20 flex-col items-center gap-1 text-[10px] font-semibold text-[#5C4A66] transition-opacity duration-500"
                  style={{ left: `calc(50% + ${Math.cos(angle)*radius}px - 40px)`, top: `calc(50% + ${Math.sin(angle)*radius}px - 24px)`, opacity: clamp((reveal-i*.08)*1.8) }}>
                  <Icon className="h-5 w-5 text-[#7C3AED]" strokeWidth={1.7} />
                  {label}
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-1 flex max-w-[330px] items-center gap-3 rounded-[1.4rem] border border-[#EEE4F5] bg-white/90 p-3.5 text-left shadow-[0_12px_35px_rgba(76,29,149,.08)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#7C3AED]"><Heart className="h-5 w-5" /></div>
            <p className="text-xs leading-5 text-[#5C4A66]"><strong className="block text-[#2A1845]">More than just a profile.</strong>A better match for your future.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const steps = [
  ["Create your profile", "Share your details and preferences.", Home],
  ["Set your preferences", "Tell CupidMatch what matters to you.", SlidersHorizontal],
  ["Discover matches", "See compatible introductions.", Sparkles],
  ["Send an interest", "Connect when it feels right.", Heart],
  ["Connect and chat", "Start a meaningful conversation.", MessageCircle],
] as const;

export function StickyHowItWorks() {
  const { ref, progress } = useSectionProgress();
  const active = Math.min(4, Math.floor(progress * 5));

  return (
    <section ref={ref} className="relative h-[340svh] bg-[#FBF8F4]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-4">
        <div className="mx-auto grid w-full max-w-4xl items-center gap-3 sm:gap-7 md:grid-cols-2">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A078B0]">How CupidMatch works</p>
            <h2 className="mt-2 font-serif text-[1.9rem] font-semibold leading-tight text-[#2A1845] sm:text-5xl">Simple Steps to<br/>Find Your Match</h2>
          </div>

          <div className="mx-auto w-full max-w-[300px] sm:max-w-[315px]">
            <div className="relative overflow-hidden rounded-[2.25rem] border-[6px] border-[#24152F] bg-white p-2 shadow-[0_24px_70px_rgba(42,24,69,.2)]">
              <div className="mx-auto mb-2 h-4 w-24 rounded-b-2xl bg-[#24152F]" />
              <div className="overflow-hidden rounded-[1.9rem] bg-[#FFF9FD]">
                <div className="relative h-44 sm:h-52">
                  <Image src="/images/values/shared.jpg?v=3" alt="" fill sizes="300px" className="object-cover" />
                  <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A078B0]">{active+1} / 5</p>
                    <p className="mt-1 font-serif text-lg font-semibold text-[#2A1845]">{steps[active][0]}</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#6B5A78]">{steps[active][1]}</p>
                  </div>
                </div>
              </div>
            </div>

            <ol className="mt-3 space-y-0.5 sm:mt-5 sm:space-y-2">
              {steps.map(([title,,Icon], i) => (
                <li key={title} className={`flex items-center gap-3 rounded-xl px-3 py-1.5 transition-all duration-500 ${i===active ? "translate-x-1 bg-white shadow-[0_8px_24px_rgba(76,29,149,.08)] opacity-100" : i<active ? "opacity-40" : "opacity-55"}`}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i===active ? "bg-[#7C3AED] text-white" : "bg-[#EFE7F7] text-[#7C3AED]"}`}>{i+1}</span>
                  <Icon className="h-4 w-4 text-[#7C3AED]" />
                  <span className="text-xs font-semibold text-[#2A1845]">{title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
