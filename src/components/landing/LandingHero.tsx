"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_IMAGE } from "@/components/landing/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";
import { useEffect, useRef, useState } from "react";


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

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);
  const highlights = [{ icon: Users, label: t.verified }, { icon: Shield, label: t.safe }, { icon: Heart, label: t.compatibility }];
  return (
    <section ref={heroRef} className="relative overflow-hidden bg-[#FBF8F4] pt-1 sm:pt-2">
      <div className="relative mx-auto grid max-w-[1240px] items-start gap-6 px-5 pb-8 sm:px-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-stretch lg:gap-4 lg:px-10 lg:pb-10">
        <div className="relative z-10 flex max-w-xl flex-col pt-3 will-change-transform lg:pt-1" style={{ opacity: 1 - scrollProgress * 0.42, transform: `translate3d(0,${scrollProgress * -28}px,0) scale(${1-scrollProgress*0.025})` }}>
          <p className="text-[11px] font-semibold uppercase leading-5 tracking-[0.26em] text-[#A078B0] sm:text-xs sm:leading-6">
            {t.eyebrow}
            <span className="block">{t.eyebrow2}</span>
          </p>
          <h1 className="mt-5 font-serif text-[2.65rem] font-semibold leading-[1.08] tracking-tight text-[#2A1845] sm:text-5xl lg:text-[3.65rem] lg:leading-[1.05]">
            {t.title}
            <span className="mt-1 flex items-center gap-2 text-[#C026D3] sm:mt-1.5">
              {t.titleAccent}
              <Heart
                className="h-7 w-7 shrink-0 stroke-[1.8] text-[#C026D3] sm:h-8 sm:w-8"
                fill="none"
                aria-hidden="true"
              />
            </span>
          </h1>
          <p className="mt-5 max-w-[30rem] text-[15px] leading-7 text-[#5C4A66] sm:text-lg sm:leading-8">
            {t.description}
          </p>

          <ul className="mt-9 flex gap-6 sm:gap-10">
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

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-12 rounded-full bg-[#7C3AED] px-7 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(124,58,237,0.28)] hover:bg-[#6D28D9]"
            >
              <Link href="/signup">
                {t.create}
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-[#E4D4F5] bg-white px-7 text-sm font-semibold text-[#5B21B6] shadow-sm hover:bg-white hover:text-[#5B21B6]"
            >
              <Link href="/discover">{t.explore}</Link>
            </Button>
          </div>

          <p
            className="pt-5 mt-10 font-script text-[1.85rem] leading-[1.15] text-[#D946EF] sm:mt-12 sm:text-[2.15rem] lg:mt-auto lg:mb-24"
            aria-hidden="true"
          >
            Good people
            <span className="block">Brighter futures</span>
            <ScriptHeart className="mt-1 h-4 w-4 text-[#D946EF]" />
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] will-change-transform lg:max-w-none lg:pt-1" style={{ transform: `translate3d(0,${scrollProgress * 18}px,0) scale(${1-scrollProgress*0.035})` }}>
          <figure className="relative overflow-hidden rounded-[1.75rem] shadow-[0_22px_50px_rgba(74,32,110,0.18)] lg:rounded-[2rem]">
            <div className="relative aspect-[3/4] w-full lg:aspect-auto lg:min-h-[700px] lg:h-[min(74vh,760px)]">
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
    </section>
  );
}
