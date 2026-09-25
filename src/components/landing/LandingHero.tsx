"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_IMAGE } from "@/components/landing/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";
import { useEffect, useRef, useState } from "react";


function CupidMark() {
  return (
    <span className="relative ml-2 inline-flex h-12 w-16 shrink-0 items-center justify-center sm:h-14 sm:w-20" aria-hidden="true">
      <svg viewBox="0 0 86 56" className="absolute inset-0 h-full w-full overflow-visible">
        <path d="M6 43C23 25 39 27 51 31c11 4 18 1 28-12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="text-fuchsia-400"/>
        <path d="M69 12l11 7-12 5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500"/>
      </svg>
      <Heart className="relative h-7 w-7 -translate-y-1 fill-fuchsia-500 text-fuchsia-500 drop-shadow-[0_5px_12px_rgba(217,70,239,.25)] sm:h-8 sm:w-8" strokeWidth={1.5}/>
      <Sparkles className="absolute right-0 top-0 h-4 w-4 text-violet-500 motion-safe:animate-pulse" strokeWidth={1.8}/>
    </span>
  );
}

function ScriptHeart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.1 20.3s-7.2-4.4-9.6-8.7C.4 8.1 2.4 4.4 6.3 4.4c1.9 0 3.3 1.1 4.2 2.4.9-1.3 2.4-2.4 4.3-2.4 3.9 0 5.9 3.7 3.8 7.2-2.4 4.3-9.5 8.7-9.5 8.7z" />
    </svg>
  );
}

export function LandingHero() {
  const { language } = useI18n();
  const t = getMessages(language).hero;
  const heroRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [heroEntered, setHeroEntered] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setHeroEntered(true);
      return;
    }
    const entranceTimer = window.setTimeout(() => setHeroEntered(true), 80);
    const update = () => {
      frameRef.current = null;
      const hero = heroRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const range = Math.max(1, Math.min(window.innerHeight, rect.height));
      setScrollProgress(Math.min(1, Math.max(0, -rect.top / range)));
    };
    const onScroll = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(entranceTimer);
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);
  const highlights = [{ icon: Users, label: t.verified }, { icon: Shield, label: t.safe }, { icon: Heart, label: t.compatibility }];
  return (
    <section ref={heroRef} className="relative min-h-[calc(100svh-4.25rem)] overflow-hidden bg-[#FBF8F4] pt-0 sm:pt-2">
      <div className="relative mx-auto grid max-w-[1240px] items-start gap-4 px-5 pb-0 sm:px-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-stretch lg:gap-4 lg:px-10 lg:pb-10">
        <div className="relative z-10 flex max-w-xl flex-col pt-4 will-change-transform transition-[opacity,transform] duration-1000 ease-out lg:pt-1" style={{ opacity: (heroEntered ? 1 : 0) * (1 - scrollProgress * 0.72), transform: `translate3d(0,${heroEntered ? scrollProgress * -46 : 24}px,0) scale(${heroEntered ? 1-scrollProgress*0.045 : .98})` }}>
          <p className="text-[11px] font-semibold uppercase leading-5 tracking-[0.26em] text-[#A078B0] sm:text-xs sm:leading-6">
            {t.eyebrow}
            <span className="block">{t.eyebrow2}</span>
          </p>
          <h1 className="mt-3 font-serif text-[2.45rem] font-semibold leading-[1.08] tracking-tight text-[#2A1845] sm:text-5xl lg:text-[3.65rem] lg:leading-[1.05]">
            {t.title}
            <span className="mt-1 flex items-center gap-2 text-[#C026D3] sm:mt-1.5">
              {t.titleAccent}
              <span className="motion-safe:[animation:cupidMarkFloat_3.8s_ease-in-out_infinite]"><CupidMark /></span>
            </span>
          </h1>
          <p className="mt-3 max-w-[30rem] text-[13px] leading-7 text-[#5C4A66] sm:text-lg sm:leading-8">
            {t.description}
          </p>

          <ul className="mt-5 flex justify-between gap-3 sm:gap-10">
            {highlights.map((item) => (
              <li key={item.label} className="flex w-[4.75rem] flex-col items-center text-center sm:w-24">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8FF] text-[#8B5CF6]">
                  <item.icon className="h-6 w-6 stroke-[1.6]" aria-hidden="true" />
                </span>
                <span className="mt-2.5 text-[11px] font-semibold leading-[1.25] text-[#4C3A5C] sm:text-xs">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-11 rounded-full bg-[#7C3AED] px-7 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] hover:bg-[#6D28D9]"
            >
              <Link href="/signup">
                {t.create}
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-[#E4D4F5] bg-white px-7 text-sm font-semibold text-[#5B21B6] shadow-sm hover:bg-white hover:text-[#5B21B6]"
            >
              <Link href="/discover">{t.explore}</Link>
            </Button>
          </div>

          <p
            className="hidden pt-5 mt-10 font-script text-[1.85rem] leading-[1.15] text-[#D946EF] sm:mt-12 sm:text-[2.15rem] lg:mt-auto lg:mb-24"
            aria-hidden="true"
          >
            Good people
            <span className="block">Brighter futures</span>
            <ScriptHeart className="mt-1 h-4 w-4 text-[#D946EF]" />
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] will-change-transform transition-[opacity,transform] delay-150 duration-1000 ease-out lg:max-w-none lg:pt-1" style={{ opacity: (heroEntered ? 1 : 0) * (1-scrollProgress*.32), transform: `translate3d(0,${heroEntered ? scrollProgress * 30 : 28}px,0) scale(${heroEntered ? 1-scrollProgress*0.065 : .97})` }}>
          <figure className="relative overflow-hidden rounded-[1.75rem] shadow-[0_22px_50px_rgba(74,32,110,0.18)] lg:rounded-[2rem] motion-safe:[animation:heroBreath_7s_ease-in-out_infinite]">
            <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
              <Heart className="hero-particle hero-particle-a absolute left-[7%] top-[76%] h-6 w-6 fill-pink-400/65 text-pink-400/65" />
              <Heart className="hero-particle hero-particle-b absolute left-[30%] top-[88%] h-4 w-4 fill-fuchsia-400/55 text-fuchsia-400/55" />
              <Heart className="hero-particle hero-particle-c absolute right-[8%] top-[72%] h-7 w-7 fill-pink-300/60 text-pink-300/60" />
              <Sparkles className="hero-sparkle absolute right-[20%] top-[12%] h-7 w-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,.95)]" />
            </div>
            <div className="pointer-events-none absolute -right-10 -top-12 z-20 h-32 w-32 rounded-full bg-fuchsia-300/20 blur-2xl motion-safe:animate-pulse" />
            <div className="pointer-events-none absolute left-[8%] top-[12%] z-20 h-2 w-2 rounded-full bg-white/90 shadow-[0_0_18px_5px_rgba(255,255,255,.7)] motion-safe:animate-pulse" />
            <div className="pointer-events-none absolute left-[-8%] top-[48%] z-40 w-[116%] opacity-100">
              <svg viewBox="0 0 800 120" className="h-auto w-full overflow-visible">
                <path d="M8 80 C150 12 250 104 390 54 S620 24 782 64" fill="none" stroke="rgba(217,70,239,.92)" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="7 10" className="motion-safe:[animation:cupidDash_8s_linear_infinite]" />
                <g className="motion-safe:[animation:cupidFly_8s_ease-in-out_infinite]">
                  <circle cx="10" cy="80" r="13" fill="rgba(255,255,255,.9)" />
                  <path d="M4 79c4-7 10-3 10 2 0 5-10 10-10 10S-6 86-6 81c0-5 6-9 10-2Z" fill="#d946ef" transform="translate(6 -6) scale(.55)" />
                  <path d="M1 80h23m-5-5 6 5-6 5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
            <div className="pointer-events-none absolute right-[14%] top-[20%] z-20 h-1.5 w-1.5 rounded-full bg-fuchsia-200 shadow-[0_0_16px_4px_rgba(244,114,182,.5)] motion-safe:animate-pulse" />
            <div className="relative h-[42svh] min-h-[330px] w-full sm:h-auto sm:aspect-[3/4] lg:aspect-auto lg:min-h-[700px] lg:h-[min(74vh,760px)]">
              <Image
                src={HERO_IMAGE}
                alt="A woman in a purple sari welcoming you with a namaste"
                fill
                priority
                quality={100}
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover object-[center_12%]"
              />
            </div>
            
          </figure>
        </div>
      </div>
      <style jsx>{`
        @keyframes heroBreath { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-5px) scale(1.006); } }
        @keyframes cupidMarkFloat { 0%,100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-4px) rotate(2deg); } }
        @keyframes cupidDash { to { stroke-dashoffset: -136; } }
        @keyframes cupidFly { 0% { transform: translate(0,0); opacity:.2; } 18% { opacity:1; } 50% { transform: translate(390px,-26px); opacity:1; } 82% { opacity:1; } 100% { transform: translate(770px,-16px); opacity:.15; } }
        @keyframes heartRise { 0% { transform: translate3d(0,24px,0) scale(.7) rotate(-8deg); opacity:0; } 20% { opacity:.8; } 75% { opacity:.55; } 100% { transform: translate3d(26px,-240px,0) scale(1.2) rotate(12deg); opacity:0; } }
        @keyframes sparkleGlow { 0%,100% { transform:scale(.7) rotate(0deg); opacity:.35; } 50% { transform:scale(1.15) rotate(18deg); opacity:1; } }
        .hero-particle { animation: heartRise 7s ease-in-out infinite; }
        .hero-particle-b { animation-delay: -2.3s; animation-duration: 8.5s; }
        .hero-particle-c { animation-delay: -4.4s; animation-duration: 9.5s; }
        .hero-sparkle { animation: sparkleGlow 2.8s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
