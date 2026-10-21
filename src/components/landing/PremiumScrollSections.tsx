"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ChevronRight, GraduationCap, Heart, Home, MapPin, MessageCircle, SlidersHorizontal, Sparkles, Users } from "lucide-react";
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
    <section ref={ref} className="relative h-[180svh] lg:h-[125svh] bg-background scroll-mt-20 [scroll-snap-align:start]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-5">
        <div className="mx-auto w-full max-w-xl text-center lg:grid lg:max-w-6xl lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-28 lg:text-left">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold-foreground">Built on what matters</p>
          <h2 className="mx-auto mt-3 max-w-sm font-serif text-[2rem] lg:mx-0 lg:max-w-xl lg:text-[4.6rem] font-semibold leading-[1.05] text-primary-dark sm:text-5xl">
            High Compatibility Matches
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm lg:mx-0 lg:max-w-lg lg:text-lg lg:leading-8 leading-6 text-muted-foreground">
            Our smart matching helps you find people who share your important preferences.
          </p><div className="mx-auto mt-8 hidden max-w-sm items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm lg:flex"><Heart className="h-6 w-6 shrink-0 text-primary"/><p className="text-sm leading-6 text-muted-foreground"><strong className="block text-primary-dark">More than just a profile.</strong>A better match for your future.</p></div></div>

          <div className="story-media relative mx-auto mt-5 h-[320px] w-full max-w-[340px] sm:mt-8 sm:h-[350px] lg:mt-0 lg:h-[570px] lg:max-w-[620px]">
            <div className="absolute inset-[8%] rounded-[3rem] bg-gradient-to-br from-accent via-white to-accent shadow-[0_30px_80px_hsl(var(--primary)/.12)] ring-1 ring-ring lg:inset-[5%] lg:rounded-[4rem]" />
            <div className="absolute left-1/2 top-1/2 z-10 w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-card p-5 text-center shadow-[0_22px_60px_hsl(var(--primary)/.15)] ring-1 ring-ring lg:w-[300px] lg:rounded-[2.5rem] lg:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold-foreground lg:text-xs">Your match</p>
              <div className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold p-[5px] shadow-elevated lg:h-36 lg:w-36">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card">
                  <span className="font-serif text-4xl font-semibold text-primary-dark lg:text-5xl">{score}%</span>
                  <span className="text-[10px] font-semibold text-muted-foreground lg:text-xs">compatible</span>
                </div>
              </div>
              <p className="mt-3 font-serif text-lg font-semibold text-primary-dark lg:text-2xl">Strong foundations</p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground lg:text-xs">Built from the preferences that matter to you.</p>
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
                <div key={label} className={`story-item absolute z-20 ${mobile} ${desktop} flex min-w-[88px] items-center gap-2 rounded-2xl border border-border bg-card px-2.5 py-2 shadow-[0_12px_30px_hsl(var(--primary)/.10)] lg:min-w-[142px] lg:gap-3 lg:rounded-3xl lg:px-4 lg:py-3`} style={{opacity:clamp((reveal-i*.06)*2),animationDelay:`${i*55}ms`}}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary lg:h-11 lg:w-11 lg:rounded-2xl"><Icon className="h-4 w-4 lg:h-6 lg:w-6" strokeWidth={1.8}/></span>
                  <span className="text-[10px] font-semibold text-muted-foreground lg:text-sm">{label}</span>
                </div>
              );
            })}
            <svg className="pointer-events-none absolute inset-[12%] h-[76%] w-[76%] text-gold-foreground/70" viewBox="0 0 400 400" fill="none" aria-hidden="true">
              <path d="M200 60C120 60 60 120 60 200s60 140 140 140 140-60 140-140S280 60 200 60Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 10"/>
            </svg>
          </div>

          <div className="mx-auto mt-1 flex max-w-[330px] lg:hidden items-center gap-3 rounded-[1.4rem] border border-border bg-white/90 p-3.5 text-left shadow-[0_12px_35px_hsl(var(--primary)/.08)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-primary"><Heart className="h-5 w-5" /></div>
            <p className="text-xs leading-5 text-muted-foreground"><strong className="block text-primary-dark">More than just a profile.</strong>A better match for your future.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const steps = [
  { title: "Create your profile", description: "Your story, in your own words.", detail: "Add your photos and biodata so your introduction reflects who you are and the life you want to build.", Icon: Home },
  { title: "Set your preferences", description: "Start with what matters to you.", detail: "Share your partner preferences, from culture and location to the values you hope to share.", Icon: SlidersHorizontal },
  { title: "Discover matches", description: "Explore people with shared possibilities.", detail: "Browse profiles and explore the details that help you decide whether someone could be a meaningful match.", Icon: Sparkles },
  { title: "Send an interest", description: "A small first step toward connection.", detail: "Let someone know you would like to get to know them. Take the next step at a pace that feels comfortable.", Icon: Heart },
  { title: "Connect and chat", description: "Give a good conversation room to grow.", detail: "Use CupidMatch's chat features to get to know each other and discover what you have in common.", Icon: MessageCircle },
] as const;

export function StickyHowItWorks() {
  const [active, setActive] = useState(0);
  const step = steps[active];
  const planning = active < 3;

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-28 bg-background px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-3 sm:mb-10 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-gold-foreground sm:text-xs">How CupidMatch works</p>
            <h2 id="how-it-works-title" className="mt-3 max-w-xl font-serif text-3xl font-semibold leading-[1.12] text-primary-dark sm:text-4xl lg:text-5xl">A little clarity.<br/><span className="text-primary">A meaningful beginning.</span></h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground lg:pb-1">From your first introduction to your first conversation, take each step in your own time.</p>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[1.08fr_1fr] lg:gap-12">
          <div className="min-w-0 overflow-hidden rounded-3xl bg-accent">
            <div className="relative aspect-[3/2] overflow-hidden">
              <Image src="/images/journey-beginning.webp" alt={planning ? "A Sri Lankan couple exploring a tablet together in an ivory studio setting" : ""} fill sizes="(min-width:1280px) 575px, (min-width:1024px) 50vw, 100vw" className={`object-cover transition-opacity duration-300 motion-reduce:transition-none ${planning ? "opacity-100" : "opacity-0"}`}/>
              <Image src="/images/journey-conversation.webp" alt={planning ? "" : "A Sri Lankan couple enjoying a conversation over coffee"} fill sizes="(min-width:1280px) 575px, (min-width:1024px) 50vw, 100vw" className={`object-cover transition-opacity duration-300 motion-reduce:transition-none ${planning ? "opacity-0" : "opacity-100"}`}/>
              <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary-dark sm:left-5 sm:top-5"><Heart aria-hidden="true" className="h-3.5 w-3.5 text-primary"/>Your next chapter</span>
            </div>
            <div id="journey-step-detail" role="region" aria-live="polite" aria-atomic="true" aria-labelledby={`journey-step-${active}`} className="min-h-[154px] px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold-foreground">Step {String(active + 1).padStart(2, "0")} of 05</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-primary-dark">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
            </div>
          </div>

          <div className="min-w-0">
            <ol className="divide-y divide-border">
              {steps.map(({title, description, Icon}, i) => (
                <li key={title}>
                  <button id={`journey-step-${i}`} type="button" aria-pressed={active === i} aria-controls="journey-step-detail" onClick={() => setActive(i)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none sm:gap-4 sm:py-4 ${active === i ? "bg-accent" : "hover:bg-accent/50"}`}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active === i ? "bg-primary text-white" : "bg-card text-gold-foreground ring-1 ring-border"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold text-primary-dark sm:text-base"><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary"/>{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground sm:text-sm">{description}</span></span>
                    <ChevronRight aria-hidden="true" className={`h-4 w-4 shrink-0 ${active === i ? "text-primary" : "text-muted-foreground"}`}/>
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-6 border-t border-border pt-6">
              <Link href="/signup" className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto">Create Your Profile<ArrowRight aria-hidden="true" className="h-4 w-4"/></Link>
              <p className="mt-3 text-xs text-muted-foreground">Your story. Your preferences. Your pace.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
