import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Heart,
  Languages,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-white text-gray-900">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-10 top-20 h-32 w-32 rounded-full bg-purple-200 blur-3xl" />
        <div className="absolute right-20 top-40 h-40 w-40 rounded-full bg-pink-200 blur-3xl" />
        <div className="absolute bottom-20 left-1/3 h-36 w-36 rounded-full bg-purple-100 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-32 lg:pt-20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
            </span>
            Cross-cultural relationships for Sri Lankan professionals
          </div>

          <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Meet someone who understands{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                where you come from
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="8"
                viewBox="0 0 200 8"
                fill="none"
              >
                <path
                  d="M1 5.5C40 2.5 80 1 120 2.5C160 4 180 5 199 6"
                  stroke="#e879f9"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            — and where you're going.
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
            Find your life partner through a platform designed for Sri Lankan professionals
            worldwide, shaped for cross-cultural connection.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
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
              className="h-14 rounded-full border-2 border-purple-200 bg-white px-8 text-lg font-semibold text-gray-900 transition-all hover:bg-purple-50"
            >
              <Link href="/about">See how matching works</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          {/* Profile Cards Stack */}
          <div className="space-y-4">
            {/* Main Profile Card */}
            <div className="relative rounded-3xl border-2 border-purple-100 bg-white p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Ayesha, 24</h3>
                      <BadgeCheck className="h-5 w-5 fill-purple-500 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">London · Tamil</p>
                  </div>
                </div>
                <Heart className="h-6 w-6 text-gray-300 transition-colors hover:fill-pink-500 hover:text-pink-500" />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    Tamil-speaking
                  </span>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    Cross-cultural
                  </span>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-600">92%</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                      compatibility
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cultural values</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-purple-200">
                          <div className="h-full w-[95%] bg-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">95%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Lifestyle</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-purple-200">
                          <div className="h-full w-[92%] bg-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">92%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Family values</span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-purple-200">
                          <div className="h-full w-[88%] bg-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">88%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary small cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-lg">
                <Shield className="mb-2 h-8 w-8 text-purple-600" />
                <p className="text-sm font-semibold text-gray-900">Verified members</p>
                <p className="mt-1 text-xs text-gray-600">Private by default</p>
              </div>
              <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-lg">
                <Languages className="mb-2 h-8 w-8 text-purple-600" />
                <p className="text-sm font-semibold text-gray-900">Sinhala · Tamil · English</p>
                <p className="mt-1 text-xs text-gray-600">3 community hubs, 5 languages, infinite connections</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
