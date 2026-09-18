import Image from "next/image";
import Link from "next/link";
import { discoverCountryHref, type DiasporaCountry } from "@/data/diaspora-countries";
import { focusRing } from "@/components/landing/brand";
import { cn } from "@/lib/utils";

export function CountryCard({ country }: { country: DiasporaCountry }) {
  return (
    <Link
      href={discoverCountryHref(country.name)}
      data-country-card
      aria-label={`Discover Sri Lankan community in ${country.name}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#EDE4F5] bg-[#FFFDF9] shadow-[0_10px_30px_rgba(74,32,110,0.06)] transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(74,32,110,0.12)]",
        "focus-visible:outline-none",
        focusRing
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#F3E8FF]">
        <Image
          src={`/images/countries/${country.id}.jpg?v=2`}
          alt={`${country.landmark} in ${country.name}`}
          fill
          quality={90}
          sizes="(max-width: 640px) 86vw, (max-width: 768px) 46vw, (max-width: 1024px) 31vw, 240px"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="px-4 py-4 text-center">
        <h3 className="text-[1.05rem] font-bold tracking-tight text-[#2A1845]">{country.name}</h3>
        <p className="mt-1 text-sm text-[#6B5A78]">Sri Lankan community</p>
      </div>
    </Link>
  );
}
