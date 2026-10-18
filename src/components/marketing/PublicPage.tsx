import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import type { ReactNode } from "react";

export const primaryLink = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,.16)] transition-colors hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-4";
export const secondaryLink = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#DDD0E7] bg-white/80 px-6 py-3 text-center text-sm font-semibold text-[#2A1845] transition-colors hover:bg-[#F5EDFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-4";

export function PublicPage({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl space-y-16 px-5 pb-16 pt-8 text-[#2A1845] sm:px-8 sm:pt-12 lg:space-y-24 lg:pb-24">{children}</div>;
}

export function PublicHero({ eyebrow, title, accent, description, image, imageAlt, children }: {
  eyebrow: string; title: string; accent: string; description: string;
  image: string; imageAlt: string; children: ReactNode;
}) {
  return <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[.22em] text-[#846294]">{eyebrow}</p>
      <h1 className="mt-4 font-serif text-[2.5rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{title} <span className="text-[#A52A8A]">{accent}</span></h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-[#6B5A78] sm:text-lg sm:leading-8">{description}</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>
    </div>
    <div className="relative min-w-0 pb-5 pl-4 sm:pl-6">
      <div aria-hidden className="absolute bottom-0 left-0 right-5 top-5 rounded-[2rem] bg-[#F1E7FA]" />
      <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] sm:aspect-[4/3] lg:aspect-[4/5] lg:max-h-[510px]">
        <Image src={image} alt={imageAlt} fill priority sizes="(min-width: 1024px) 480px, (min-width: 640px) 80vw, 90vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#2A1845]/25 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 flex max-w-[90%] items-center gap-3 rounded-2xl border border-[#EADFED] bg-[#FFFDF9] px-4 py-3 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4E9F8]"><Heart aria-hidden className="h-4 w-4 text-[#A52A8A]" /></span>
        <p className="text-sm font-medium">Shared values. Meaningful beginnings.</p>
      </div>
    </div>
  </section>;
}

export function PublicClosing({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return <section className="relative overflow-hidden rounded-[2rem] bg-[#F3EBFA] px-6 py-10 text-center sm:px-12 sm:py-14">
    <Heart aria-hidden className="mx-auto h-7 w-7 text-[#A52A8A]" />
    <h2 className="mx-auto mt-4 max-w-xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
    <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[#6B5A78]">{description}</p>
    <Link href={href} className={`${primaryLink} mt-6`}>{label}<ArrowRight aria-hidden className="h-4 w-4 shrink-0" /></Link>
  </section>;
}
