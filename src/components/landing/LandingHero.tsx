import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Languages,
  Eye,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionPaths } from "@/components/decorative";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-accent/30 via-background to-background">
      {/* Decorative connection paths */}
      <ConnectionPaths className="absolute inset-0" variant="subtle" animate={true} />
      
      {/* Subtle gradient orbs */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-10 top-20 h-32 w-32 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute right-20 top-40 h-40 w-40 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
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
            — and where you're going.
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

        <div className="relative">
          {/* Demo Label */}
          <div className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="font-medium">Sample profile preview</span>
          </div>

          {/* Profile Cards Stack */}
          <div className="space-y-4">
            {/* Main Profile Card */}
            <div className="relative rounded-3xl border-2 border-border bg-card p-6 shadow-xl">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl">
                    👩🏽
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">Sample Profile</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>London · Tamil-speaking</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                    Open to relocation
                  </span>
                  <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                    Family-oriented
                  </span>
                </div>

                {/* Explainable Alignment Preview - No Fake Percentages */}
                <div className="rounded-2xl border border-border bg-accent/30 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Understanding compatibility
                    </span>
                  </div>
                  <div className="space-y-2.5 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-foreground">•</span>
                      <span>You both prefer to settle in the UK</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-foreground">•</span>
                      <span>You both value family involvement with clear boundaries</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-foreground">•</span>
                      <span>Your relocation plans differ; this may be worth discussing</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs italic text-muted-foreground">
                    Actual matches show clear evidence-based explanations
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary small cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-md">
                <Shield className="mb-2 h-7 w-7 text-primary" />
                <p className="text-sm font-semibold text-foreground">Privacy first</p>
                <p className="mt-1 text-xs text-muted-foreground">Member-controlled visibility</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-md">
                <Languages className="mb-2 h-7 w-7 text-primary" />
                <p className="text-sm font-semibold text-foreground">Three languages</p>
                <p className="mt-1 text-xs text-muted-foreground">Sinhala · Tamil · English</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
