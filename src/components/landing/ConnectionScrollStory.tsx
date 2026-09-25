"use client";

import Image from "next/image";
import { Heart, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function ConnectionScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      setProgress(0.72);
      return;
    }

    const update = () => {
      frameRef.current = null;
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      setProgress(clamp(-rect.top / travel));
    };

    const onScroll = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const arrival = clamp(progress / 0.3);
  const connection = clamp((progress - 0.2) / 0.34);
  const compatibility = clamp((progress - 0.48) / 0.28);
  const conversation = clamp((progress - 0.72) / 0.22);
  const score = Math.round(72 + compatibility * 20);

  return (
    <section ref={sectionRef} className="relative h-[250svh] bg-[#FBF8F4]" aria-label="How a CupidMatch connection grows">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-4 py-8 sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
          <div className="absolute left-[-15%] top-[12%] h-72 w-72 rounded-full bg-[#F3E8FF] blur-3xl" />
          <div className="absolute bottom-[8%] right-[-18%] h-80 w-80 rounded-full bg-[#FCE7F3] blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#A078B0]">A meaningful introduction</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[#2A1845] sm:text-5xl">
              A Meaningful<br/><span className="text-[#C026D3]">Connection Begins</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6B5A78] sm:text-base">
              When shared values bring two people together.
            </p>
          </div>

          <div className="relative mx-auto h-[455px] max-w-[430px] sm:h-[470px]">
            <div
              className="absolute left-1/2 top-[44%] h-[2px] w-[8%] -translate-x-1/2 overflow-hidden rounded-full bg-[#E9D5FF]"
              aria-hidden="true"
            >
              <span className="block h-full origin-left bg-gradient-to-r from-[#7C3AED] to-[#EC4899]" style={{ transform: `scaleX(${connection})` }} />
            </div>

            <div
              className="absolute left-1/2 top-[8%] w-[118px] -translate-x-1/2 will-change-transform sm:w-[132px]"
              style={{ opacity: arrival, transform: `translate3d(-50%,${(1-arrival)*-36}px,0) scale(${0.92+arrival*0.08})` }}
            >
              <div className="overflow-hidden rounded-[2rem] border-[5px] border-white bg-white shadow-[0_20px_55px_rgba(76,29,149,0.18)]">
                <div className="relative aspect-[4/5]">
                  <Image src="/images/values/culture.jpg?v=3" alt="CupidMatch profile example" fill sizes="180px" className="object-cover" />
                </div>
              </div>
              
            </div>

            <div
              className="absolute left-1/2 top-[55%] w-[118px] -translate-x-1/2 will-change-transform sm:w-[132px]"
              style={{ opacity: arrival, transform: `translate3d(-50%,${(1-arrival)*36}px,0) scale(${0.92+arrival*0.08})` }}
            >
              <div className="overflow-hidden rounded-[2rem] border-[5px] border-white bg-white shadow-[0_20px_55px_rgba(76,29,149,0.18)]">
                <div className="relative aspect-[4/5]">
                  <Image src="/images/values/goals.jpg?v=3" alt="CupidMatch profile example" fill sizes="180px" className="object-cover" />
                </div>
              </div>
              
            </div>

            <div
              className="absolute left-1/2 top-[43%] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white shadow-xl will-change-transform"
              style={{ opacity: connection, transform: `translateX(-50%) scale(${0.55 + connection*0.45})` }}
            >
              <Heart className="h-6 w-6" fill="currentColor" aria-hidden="true" />
            </div>

            <div
              className="hidden absolute left-1/2 top-[68%] w-[230px] -translate-x-1/2 rounded-[1.5rem] border border-[#E9D5FF] bg-white/95 p-4 text-center shadow-[0_18px_45px_rgba(76,29,149,0.12)] backdrop-blur will-change-transform sm:w-[270px]"
              style={{ opacity: compatibility, transform: `translate3d(-50%,${(1-compatibility)*28}px,0) scale(${0.94+compatibility*0.06})` }}
            >
              <div className="flex items-center justify-center gap-2 text-[#7C3AED]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-[0.18em]">Compatibility</span>
              </div>
              <div className="mt-1 font-serif text-4xl font-semibold text-[#2A1845]">{score}%</div>
              <p className="mt-1 text-xs text-[#6B5A78]">Values • future plans • lifestyle</p>
            </div>

            <div
              className="hidden absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#2A1845] px-5 py-3 text-sm font-semibold text-white shadow-lg will-change-transform"
              style={{ opacity: conversation, transform: `translate3d(-50%,${(1-conversation)*18}px,0)` }}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              A conversation begins
            </div>
          </div>

          <div className="mx-auto mt-1 grid max-w-[280px] gap-2 text-left text-[12px] font-medium text-[#5C4A66]">
            {["Shared values","Similar goals","Cultural alignment","Real conversations"].map((item) => (
              <span key={item} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F3E8FF] text-[#C026D3]">✓</span>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
