import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  HeartHandshake,
  Languages,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_IMAGE, focusRingOnDark } from "@/components/landing/brand";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#30122A] text-[#FFFDF9]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 16% 20%, rgba(214,181,109,0.18), transparent 40%), radial-gradient(circle at 88% 10%, rgba(165,42,104,0.16), transparent 34%)",
        }}
      />

      {/* Cultural corner linework */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -left-4 top-6 h-36 w-36 text-[#D6B56D] opacity-[0.05] sm:h-44 sm:w-44"
        viewBox="0 0 120 120"
        fill="none"
      >
        <circle cx="60" cy="60" r="18" stroke="currentColor" strokeWidth="0.7" />
        <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="60" cy="60" r="38" stroke="currentColor" strokeWidth="0.4" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <path
            key={deg}
            d="M60 22 C66 34 66 46 60 58 C54 46 54 34 60 22 Z"
            stroke="currentColor"
            strokeWidth="0.55"
            transform={`rotate(${deg} 60 60)`}
          />
        ))}
      </svg>

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-10 lg:pb-20 lg:pt-12 xl:pb-24">
        <div className="relative z-10 max-w-xl">
          <p className="inline-flex items-center rounded-full border border-[#D6B56D]/35 bg-[#4B164C]/55 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F2C96D]">
            Matrimony with meaning
          </p>

          <h1 className="mt-5 font-serif text-[2.1rem] font-semibold leading-[1.15] tracking-tight text-[#FFFDF9] sm:text-4xl lg:text-[2.7rem] lg:leading-[1.12]">
            Where shared values
            <br className="hidden sm:block" /> become a shared future.
          </h1>

          <p className="mt-4 max-w-lg text-base leading-7 text-[#F0E0E8] sm:text-[1.05rem] sm:leading-8">
            CupidMatch connects genuine people from Indian and Sri Lankan
            communities who are looking for commitment, family and long-term
            relationships—with culture, privacy and intention at the centre.
          </p>

          <ul className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {[
              { icon: BadgeCheck, label: "Genuine profiles" },
              { icon: Shield, label: "Private by design" },
              { icon: Languages, label: "Tamil · Sinhala · English" },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm text-[#F8EAF1]">
                <item.icon className="h-4 w-4 text-[#D6B56D]" aria-hidden="true" />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className={`h-11 rounded-full bg-[#D6B56D] px-7 text-[#30122A] hover:bg-[#F2C96D] ${focusRingOnDark}`}
            >
              <Link href="/signup">
                Create my free profile
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={`h-11 rounded-full border-[#D6B56D]/40 bg-transparent px-7 text-[#FFFDF9] hover:bg-white/10 hover:text-white ${focusRingOnDark}`}
            >
              <Link href="/success-stories">View success stories</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[440px] lg:mx-0 lg:max-w-[480px] lg:justify-self-end">
          {/* Global network */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -top-8 bottom-8 hidden opacity-[0.1] md:block lg:-inset-x-14"
            viewBox="0 0 520 420"
            fill="none"
          >
            {Array.from({ length: 40 }).map((_, i) => {
              const x = (i % 8) * 62 + 28;
              const y = Math.floor(i / 8) * 62 + 40;
              return <circle key={i} cx={x} cy={y} r={0.9} fill="#D6B56D" opacity={0.35} />;
            })}
            <path
              d="M168 118 C210 98, 250 128, 292 168 C318 190, 330 210, 338 228"
              stroke="#D6B56D"
              strokeWidth="1"
              strokeDasharray="3 7"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M118 148 C160 170, 210 188, 292 168 C340 152, 390 188, 428 246"
              stroke="#D6B56D"
              strokeWidth="1"
              strokeDasharray="3 7"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d="M292 168 C310 188, 318 210, 332 238"
              stroke="#D6B56D"
              strokeWidth="1"
              strokeDasharray="3 7"
              opacity="0.8"
            />
            <path
              className="cupid-route-travel"
              d="M168 118 C210 98, 250 128, 292 168 C318 190, 330 210, 338 228"
              stroke="#F2C96D"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              className="cupid-route-travel-delayed"
              d="M118 148 C160 170, 210 188, 292 168 C340 152, 390 188, 428 246"
              stroke="#F2C96D"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {[
              { cx: 168, cy: 118 },
              { cx: 292, cy: 168 },
              { cx: 338, cy: 228 },
              { cx: 118, cy: 148 },
              { cx: 428, cy: 246 },
            ].map((node, idx) => (
              <g key={idx}>
                <circle cx={node.cx} cy={node.cy} r="7" fill="#D6B56D" opacity="0.18" />
                <circle cx={node.cx} cy={node.cy} r="3.2" fill="#F2C96D" opacity="0.95" />
              </g>
            ))}
          </svg>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[36%] h-[68%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(214,181,109,0.36) 0%, rgba(214,181,109,0.12) 45%, transparent 72%)",
            }}
          />

          <div
            className="absolute -inset-2.5 rounded-[1.85rem] border border-[#D6B56D]/45 sm:-inset-3 sm:rounded-[2rem]"
            aria-hidden="true"
          />
          <figure className="relative z-10 overflow-hidden rounded-[1.6rem] border border-[#D6B56D]/50 bg-[#4B164C] shadow-[0_24px_50px_rgba(0,0,0,0.35)] sm:rounded-[1.75rem]">
            <div className="relative h-[350px] sm:h-[390px] lg:h-[420px] xl:h-[440px]">
              <Image
                src={HERO_IMAGE}
                alt="Portrait of a woman in elegant traditional attire offering a namaste greeting"
                fill
                sizes="(max-width: 1024px) 440px, 480px"
                priority
                className="object-cover object-[center_20%]"
              />
            </div>
            <figcaption className="absolute inset-x-3 bottom-3 rounded-2xl border border-[#D6B56D]/30 bg-[#30122A]/70 p-3.5 shadow-lg backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D6B56D]/20 text-[#F2C96D]">
                  <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#FFFDF9]">Compatibility at a glance</p>
                  <p className="mt-1 text-xs leading-5 text-[#F0E0E8]">
                    Shared values · Family-minded · Cultural alignment
                  </p>
                </div>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>

      <p className="cupid-scroll-hint pointer-events-none absolute bottom-6 right-6 z-20 hidden items-center gap-1.5 text-[11px] font-medium tracking-[0.12em] text-[#F2C96D]/85 xl:flex">
        Explore CupidMatch
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      </p>
    </section>
  );
}
