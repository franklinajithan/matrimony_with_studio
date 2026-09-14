"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { focusRing } from "@/components/landing/brand";

const selectClassName =
  "h-12 w-full rounded-xl border border-[#EADFD6] bg-[#FFFDF9] px-3 text-sm text-[#271624] outline-none transition hover:border-[#D6B56D] focus-visible:border-[#4B164C] focus-visible:ring-2 focus-visible:ring-[#4B164C]/30";

export function MatchSearchPanel() {
  const router = useRouter();
  const [lookingFor, setLookingFor] = useState("a life partner");
  const [ageRange, setAgeRange] = useState("25-32");
  const [community, setCommunity] = useState("All communities");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/signup");
  };

  return (
    <section className="relative z-10 -mt-12 px-4 sm:-mt-14 sm:px-6 lg:-mt-16" aria-labelledby="search-heading">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-[#EADFD6] bg-white p-5 shadow-[0_20px_50px_rgba(48,18,42,0.12)] sm:p-7 lg:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="search-heading" className="font-serif text-2xl font-semibold text-[#271624] sm:text-3xl">
              Start your search
            </h2>
            <p className="mt-1 text-sm text-[#725E6D]">Tell us who you would like to meet.</p>
          </div>
          <Link
            href="/login"
            className={`text-sm font-medium text-[#4B164C] underline-offset-4 hover:underline ${focusRing} rounded`}
          >
            Already a member? Sign in
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-4 md:items-end lg:mt-6">
          <div>
            <label htmlFor="looking-for" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#725E6D]">
              I&apos;m looking for
            </label>
            <select
              id="looking-for"
              name="lookingFor"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className={selectClassName}
            >
              <option value="a life partner">A life partner</option>
              <option value="Bride">Bride</option>
              <option value="Groom">Groom</option>
            </select>
          </div>

          <div>
            <label htmlFor="age-range" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#725E6D]">
              Age
            </label>
            <select
              id="age-range"
              name="ageRange"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className={selectClassName}
            >
              <option value="21-28">21–28</option>
              <option value="25-32">25–32</option>
              <option value="30-38">30–38</option>
              <option value="35-45">35–45</option>
            </select>
          </div>

          <div>
            <label htmlFor="community" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#725E6D]">
              Community
            </label>
            <select
              id="community"
              name="community"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              className={selectClassName}
            >
              <option value="All communities">All communities</option>
              <option value="Indian">Indian</option>
              <option value="Sri Lankan">Sri Lankan</option>
              <option value="Tamil">Tamil</option>
              <option value="Sinhala">Sinhala</option>
            </select>
          </div>

          <Button
            type="submit"
            className={`h-12 rounded-xl bg-[#4B164C] text-white hover:bg-[#742158] ${focusRing}`}
          >
            Find matches
            <Compass className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <p className="mt-4 flex items-start gap-2 text-sm text-[#725E6D] sm:mt-5">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B56D]" aria-hidden="true" />
          Joining is free. You remain in control of your profile and privacy.
        </p>
      </div>
    </section>
  );
}
