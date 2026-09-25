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
  const reveal = clamp((progress - 0.12) / 0.76);
  const score = Math.round(64 + reveal * 28);
  const items = [
    [Sparkles, "Values"], [BriefcaseBusiness, "Lifestyle"], [GraduationCap, "Education"],
    [Users, "Family"], [MapPin, "Location"], [Heart, "Interests"],
  ] as const;

  return (
    <section ref={ref} className="relative h-[180svh] lg:h-[125svh] bg-[#FFFDFB] scroll-mt-20 [scroll-snap-align:start]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-5">
        <div className="mx-auto w-full max-w-xl text-center lg:grid lg:max-w-6xl lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-28 lg:text-left">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A078B0]">Built on what matters</p>
          <h2 className="mx-auto mt-3 max-w-sm font-serif text-[2rem] lg:mx-0 lg:max-w-xl lg:text-[4.6rem] font-semibold leading-[1.05] text-[#2A1845] sm:text-5xl">
            High Compatibility Matches
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm lg:mx-0 lg:max-w-lg lg:text-lg lg:leading-8 leading-6 text-[#6B5A78]">
            Our smart matching helps you find people who share your important preferences.
          </p><div className="mx-auto mt-8 hidden max-w-sm items-center gap-3 rounded-2xl border border-[#EEE4F5] bg-white p-4 text-left shadow-sm lg:flex"><Heart className="h-6 w-6 shrink-0 text-[#7C3AED]"/><p className="text-sm leading-6 text-[#5C4A66]"><strong className="block text-[#2A1845]">More than just a profile.</strong>A better match for your future.</p></div></div>

          <div className="story-media relative mx-auto mt-5 h-[320px] w-full max-w-[340px] sm:mt-8 sm:h-[350px] lg:mt-0 lg:h-[570px] lg:max-w-[620px]">
            <div className="absolute inset-[8%] rounded-[3rem] bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-[0_30px_80px_rgba(124,58,237,.12)] ring-1 ring-violet-100 lg:inset-[5%] lg:rounded-[4rem]" />
            <div className="absolute left-1/2 top-1/2 z-10 w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-white p-5 text-center shadow-[0_22px_60px_rgba(76,29,149,.15)] ring-1 ring-violet-100 lg:w-[300px] lg:rounded-[2.5rem] lg:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#A078B0] lg:text-xs">Your match</p>
              <div className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 p-[5px] shadow-lg lg:h-36 lg:w-36">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                  <span className="font-serif text-4xl font-semibold text-[#2A1845] lg:text-5xl">{score}%</span>
                  <span className="text-[10px] font-semibold text-[#6B5A78] lg:text-xs">compatible</span>
                </div>
              </div>
              <p className="mt-3 font-serif text-lg font-semibold text-[#2A1845] lg:text-2xl">Strong foundations</p>
              <p className="mt-1 text-[10px] leading-4 text-[#75647F] lg:text-xs">Built from the preferences that matter to you.</p>
            </div>
            {items.map(([Icon,label],i) => {
              const desktop = [
                "lg:left-[2%] lg:top-[10%]", "lg:right-[2%] lg:top-[10%]", "lg:right-[-2%] lg:top-[42%]",
                "lg:right-[6%] lg:bottom-[7%]", "lg:left-[6%] lg:bottom-[7%]", "lg:left-[-2%] lg:top-[42%]",
              ][i];
              const mobile = [
                "left-[1%] top-[5%]", "right-[1%] top-[5%]", "right-[-2%] top-[42%]",
                "right-[4%] bottom-[3%]", "left-[4%] bottom-[3%]", "left-[-2%] top-[42%]",
              ][i];
              return (
                <div key={label} className={`story-item absolute z-20 ${mobile} ${desktop} flex min-w-[88px] items-center gap-2 rounded-2xl border border-violet-100 bg-white px-2.5 py-2 shadow-[0_12px_30px_rgba(76,29,149,.10)] lg:min-w-[142px] lg:gap-3 lg:rounded-3xl lg:px-4 lg:py-3`} style={{opacity:clamp((reveal-i*.06)*2),animationDelay:`${i*55}ms`}}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[#7C3AED] lg:h-11 lg:w-11 lg:rounded-2xl"><Icon className="h-4 w-4 lg:h-6 lg:w-6" strokeWidth={1.8}/></span>
                  <span className="text-[10px] font-semibold text-[#4F3D5D] lg:text-sm">{label}</span>
                </div>
              );
            })}
            <svg className="pointer-events-none absolute inset-[12%] h-[76%] w-[76%] text-fuchsia-300/70" viewBox="0 0 400 400" fill="none" aria-hidden="true">
              <path d="M200 60C120 60 60 120 60 200s60 140 140 140 140-60 140-140S280 60 200 60Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 10"/>
            </svg>
          </div>

          <div className="mx-auto mt-1 flex max-w-[330px] lg:hidden items-center gap-3 rounded-[1.4rem] border border-[#EEE4F5] bg-white/90 p-3.5 text-left shadow-[0_12px_35px_rgba(76,29,149,.08)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#7C3AED]"><Heart className="h-5 w-5" /></div>
            <p className="text-xs leading-5 text-[#5C4A66]"><strong className="block text-[#2A1845]">More than just a profile.</strong>A better match for your future.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const steps = [
  ["Create your profile", "Share your details and preferences.", Home, "/images/values/culture.jpg?v=3"],
  ["Set your preferences", "Tell CupidMatch what matters to you.", SlidersHorizontal, "/images/values/goals.jpg?v=3"],
  ["Discover matches", "See compatible introductions.", Sparkles, "/images/values/shared.jpg?v=3"],
  ["Send an interest", "Connect when it feels right.", Heart, "/images/values/culture.jpg?v=3"],
  ["Connect and chat", "Start a meaningful conversation.", MessageCircle, "/images/values/goals.jpg?v=3"],
] as const;

export function StickyHowItWorks() {
  const { ref, progress } = useSectionProgress();
  const active = Math.min(4, Math.floor(progress * 5));

  return (
    <section ref={ref} className="relative h-[240svh] lg:h-[150svh] bg-[#FBF8F4] scroll-mt-20 [scroll-snap-align:start]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-4">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-3 sm:gap-7 md:grid-cols-2 lg:gap-24">
          <div className="text-center md:text-left lg:max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A078B0]">How CupidMatch works</p>
            <h2 className="mt-2 font-serif text-[1.9rem] font-semibold leading-tight text-[#2A1845] sm:text-5xl lg:text-[4.2rem]">Simple Steps to<br/>Find Your Match</h2><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#6B5A78] md:mx-0 lg:text-lg lg:leading-8">Your profile and preferences guide each introduction, so every step feels intentional.</p><ol className="mt-8 hidden space-y-3 lg:block">{steps.map(([title,description,Icon],i)=><li key={title} className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-500 ${i===active?"translate-x-2 border-violet-200 bg-white shadow-[0_14px_35px_rgba(76,29,149,.10)]":"border-transparent bg-transparent opacity-50"}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i===active?"bg-[#7C3AED] text-white":"bg-[#EFE7F7] text-[#7C3AED]"}`}>{i+1}</span><Icon className="h-5 w-5 shrink-0 text-[#7C3AED]"/><span><strong className="block text-sm text-[#2A1845]">{title}</strong><span className="text-xs text-[#75647F]">{description}</span></span></li>)}</ol></div>

          <div className="mx-auto w-full max-w-[300px] sm:max-w-[315px] lg:max-w-[430px]">
            <div className="relative overflow-hidden rounded-[2.25rem] border-[6px] border-[#24152F] bg-white p-2 shadow-[0_24px_70px_rgba(42,24,69,.2)]">
              <div className="mx-auto mb-2 h-4 w-24 rounded-b-2xl bg-[#24152F]" />
              <div className="overflow-hidden rounded-[1.9rem] bg-[#FFF9FD]">
                <div className="relative h-44 sm:h-52">
                  <Image key={steps[active][3]} src={steps[active][3]} alt="" fill sizes="(min-width: 1024px) 430px, 300px" className="object-cover transition-[opacity,transform] duration-300 ease-out motion-safe:animate-[fadeIn_.3s_ease-out]" priority={active === 0} />
                  <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A078B0]">{active+1} / 5</p>
                    <p className="mt-1 font-serif text-lg font-semibold text-[#2A1845]">{steps[active][0]}</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#6B5A78]">{steps[active][1]}</p>
                  </div>
                </div>
              </div>
            </div>

            <ol className="mt-3 space-y-0.5 sm:mt-5 sm:space-y-2 lg:hidden">
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
