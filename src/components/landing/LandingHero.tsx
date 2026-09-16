import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionPaths } from "@/components/decorative";
import { HERO_IMAGE } from "@/components/landing/brand";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-accent/30 via-background to-background">
      <ConnectionPaths className="absolute inset-0" variant="subtle" animate={true} />

      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-10 top-20 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute right-20 top-40 h-40 w-40 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-28 lg:pt-20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            For Sri Lankan lives around the world
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Meet someone who understands{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                where you come from
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="8"
                viewBox="0 0 200 8"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 5.5C40 2.5 80 1 120 2.5C160 4 180 5 199 6"
                  stroke="currentColor"
                  className="text-secondary/40"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            — and where you&apos;re going.
          </h1>

          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            Modern relationship intelligence, shaped for Sri Lankan communities worldwide.
            Connect through shared values, cultural understanding, and practical future plans.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full bg-gradient-to-r from-primary to-primary/90 px-8 text-base font-semibold shadow-lg transition-all hover:shadow-xl"
            >
              <Link href="/signup">
                Build my profile
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-2 px-8 text-base font-semibold transition-all"
            >
              <Link href="/about">See how matching works</Link>
            </Button>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[400px] lg:ml-auto lg:mr-0">
          <div
            className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-accent/40 to-secondary/20 blur-sm"
            aria-hidden="true"
          />

          <figure className="relative overflow-hidden rounded-2xl bg-white shadow-[0_20px_44px_rgba(45,20,60,0.12)] ring-1 ring-white/80">
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={HERO_IMAGE}
                alt="A Sri Lankan woman in traditional attire welcoming you with a warm namaste"
                fill
                priority
                quality={95}
                sizes="(max-width: 1024px) 90vw, 800px"
                className="object-cover object-[center_18%] brightness-[1.06] contrast-[1.02] saturate-[1.04]"
              />
            </div>
          </figure>

          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card/90 px-4 py-3 backdrop-blur-sm">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground">Privacy first</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Member-controlled visibility</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card/90 px-4 py-3 backdrop-blur-sm">
              <Languages className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground">Three languages</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Sinhala · Tamil · English</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
