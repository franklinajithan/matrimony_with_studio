"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe2, Heart, LockKeyhole, MessageCircleHeart, ShieldCheck, Sparkles, Star, UsersRound } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Profiles with purpose", text: "Thoughtful profiles, privacy controls and a community built around serious relationships." },
  { icon: Heart, title: "Compatibility that matters", text: "Discover people through values, family outlook, lifestyle and the preferences that matter to you." },
  { icon: Globe2, title: "Sri Lankan hearts worldwide", text: "Meet Sri Lankan singles across the UK, Sri Lanka, Canada, Australia, Europe and beyond." },
];

const steps = [
  ["01", "Create your profile", "Share your story, values and partner preferences at your own pace."],
  ["02", "Discover meaningful matches", "Browse compatible profiles with cultural preferences kept optional and respectful."],
  ["03", "Connect with confidence", "Build a conversation safely, with controls designed for matrimony rather than casual dating."],
];

export function HeritageLandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fffaf2] text-[#32103e]">
      <header className="sticky top-0 z-50 border-b border-[#d8aa4a]/20 bg-[#fffaf2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="CupidMatch home">
            <Image src="/images/cupidmatch-heritage-logo.webp" alt="CupidMatch Matrimony" width={360} height={240} priority className="h-16 w-auto object-contain object-left" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a href="#why" className="transition hover:text-[#8b169b]">Why CupidMatch</a>
            <a href="#how" className="transition hover:text-[#8b169b]">How it works</a>
            <a href="#community" className="transition hover:text-[#8b169b]">Community</a>
            <Link href="/pricing" className="transition hover:text-[#8b169b]">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-5 py-2.5 text-sm font-bold text-[#681176] transition hover:bg-[#f6e9f6] sm:inline-flex">Sign in</Link>
            <Link href="/register" className="inline-flex items-center rounded-full bg-gradient-to-r from-[#65106f] via-[#8f159e] to-[#a31bb0] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(112,39,232,.22)] transition hover:-translate-y-0.5">Join CupidMatch</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(216,170,74,.18),transparent_28%),radial-gradient(circle_at_85%_30%,rgba(133,23,151,.15),transparent_32%),linear-gradient(180deg,#fffaf2_0%,#fff_58%,#fbf0fa_100%)]" />
          <div className="absolute left-1/2 top-20 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full border border-[#d8aa4a]/20" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-14 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-28 lg:pt-20">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8aa4a]/40 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-[#7b4b0d] shadow-sm">
                <Sparkles className="h-4 w-4 text-[#b77a16]" /> Sri Lankan matrimony, reimagined
              </div>
              <h1 className="font-serif text-5xl font-semibold leading-[1.02] tracking-tight text-[#3d0a4c] sm:text-6xl lg:text-7xl">
                Where tradition meets <span className="bg-gradient-to-r from-[#761087] to-[#c18a28] bg-clip-text text-transparent">your future.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f5a70]">A modern matrimonial community for Sri Lankans worldwide — designed for genuine introductions, meaningful compatibility and relationships built to last.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#741181] px-7 py-4 font-bold text-white shadow-[0_16px_40px_rgba(116,17,129,.24)] transition hover:-translate-y-0.5 hover:bg-[#5f0d6b]">Create your profile <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/discover" className="inline-flex items-center justify-center rounded-full border border-[#d8aa4a]/55 bg-white px-7 py-4 font-bold text-[#5c1a64] transition hover:bg-[#fff7e7]">Explore the community</Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#755d73]">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#b77a16]" /> Privacy-first</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#b77a16]" /> Serious relationships</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#b77a16]" /> Global Sri Lankan community</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div className="absolute -inset-5 -z-10 rounded-[3rem] bg-gradient-to-br from-[#7d128d]/15 via-transparent to-[#d4a13b]/20 blur-2xl" />
              <div className="overflow-hidden rounded-[2.25rem] border border-[#d8aa4a]/30 bg-white p-3 shadow-[0_30px_90px_rgba(80,25,85,.16)]">
                <Image src="/images/cupidmatch-heritage-logo.webp" alt="CupidMatch — Bringing Sri Lankan Hearts Together" width={700} height={467} priority className="h-auto w-full rounded-[1.7rem]" />
              </div>
              <div className="absolute -bottom-5 -left-3 rounded-2xl border border-[#d8aa4a]/30 bg-white/95 p-4 shadow-xl backdrop-blur sm:-left-8">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#f4e4f5] text-[#7b1688]"><UsersRound className="h-5 w-5" /></div><div><p className="text-xs text-[#8a7688]">Built for</p><p className="font-bold">Sri Lankans worldwide</p></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="border-y border-[#d8aa4a]/15 bg-white py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#a36b16]">A better way to meet</p><h2 className="mt-3 font-serif text-4xl font-semibold text-[#3e0b4b] sm:text-5xl">Modern experience. Cultural understanding.</h2><p className="mt-5 text-lg leading-8 text-[#756275]">CupidMatch respects where you come from without putting you in a box. Culture can guide your search — it never has to define it.</p></div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">{features.map(({icon: Icon,title,text}) => <article key={title} className="group rounded-[2rem] border border-[#ead9bc] bg-[#fffaf2] p-7 transition hover:-translate-y-1 hover:shadow-xl"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#761087] to-[#a821a9] text-white shadow-lg"><Icon className="h-6 w-6" /></div><h3 className="font-serif text-2xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-[#766476]">{text}</p></article>)}</div>
          </div>
        </section>

        <section id="how" className="relative py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
              <div className="lg:sticky lg:top-32 lg:self-start"><p className="text-sm font-bold uppercase tracking-[.2em] text-[#a36b16]">How it works</p><h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Three thoughtful steps to a meaningful hello.</h2><p className="mt-5 max-w-md leading-7 text-[#766476]">No swiping race. Build a profile with substance, discover compatible people and decide when you are ready to connect.</p></div>
              <div className="space-y-5">{steps.map(([n,title,text]) => <div key={n} className="flex gap-5 rounded-[2rem] border border-[#e8d7bc] bg-white p-6 shadow-sm sm:p-8"><div className="font-serif text-3xl font-semibold text-[#b37b20]">{n}</div><div><h3 className="font-serif text-2xl font-semibold">{title}</h3><p className="mt-2 leading-7 text-[#766476]">{text}</p></div></div>)}</div>
            </div>
          </div>
        </section>

        <section id="community" className="bg-[#3b0847] py-24 text-white">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div><div className="inline-flex items-center gap-2 rounded-full border border-[#e1b65f]/30 bg-white/5 px-4 py-2 text-sm text-[#f2cf88]"><Globe2 className="h-4 w-4" /> One community across continents</div><h2 className="mt-5 font-serif text-4xl font-semibold sm:text-5xl">Sri Lankan roots. Global lives.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-[#e1d4e3]">Whether home is Colombo, Jaffna, London, Toronto, Melbourne or somewhere in between, CupidMatch helps meaningful introductions cross distance naturally.</p></div>
              <div className="grid grid-cols-2 gap-4">{["United Kingdom","Sri Lanka","Canada","Australia"].map((place,i)=><div key={place} className="rounded-3xl border border-white/10 bg-white/[.06] p-6"><div className="mb-8 text-[#e2b85d]"><Star className="h-5 w-5" /></div><p className="font-serif text-2xl">{place}</p><p className="mt-1 text-sm text-[#cdbfd0]">Part of one growing community</p></div>)}</div>
            </div>
          </div>
        </section>

        <section className="bg-[#fffaf2] py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[2rem] border border-[#e8d7bc] bg-white p-8 lg:col-span-2"><MessageCircleHeart className="h-9 w-9 text-[#81158f]" /><h3 className="mt-6 font-serif text-3xl font-semibold">Conversations with intention</h3><p className="mt-3 max-w-2xl leading-7 text-[#766476]">Messaging is designed around mutual connections, with safety tools, reporting and blocking available when needed.</p></div>
              <div className="rounded-[2rem] bg-gradient-to-br from-[#7b1289] to-[#4b0b57] p-8 text-white"><LockKeyhole className="h-9 w-9 text-[#f0c66f]" /><h3 className="mt-6 font-serif text-3xl font-semibold">Your privacy matters</h3><p className="mt-3 leading-7 text-[#e5d8e7]">Control what you share and when. Personal details are treated as personal.</p></div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#4a0a56] via-[#741181] to-[#9a1aa2] px-6 py-16 text-center text-white shadow-[0_30px_80px_rgba(78,11,89,.25)] sm:px-12">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#f1c86f_0,transparent_26%),radial-gradient(circle_at_80%_70%,#fff_0,transparent_20%)]" />
            <div className="relative mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.22em] text-[#f2cf88]">Bringing Sri Lankan hearts together</p><h2 className="mt-4 font-serif text-4xl font-semibold sm:text-5xl">Your story deserves a meaningful beginning.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#eadfed]">Create your profile and discover a matrimony experience that feels modern, respectful and unmistakably ours.</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e3b95e] px-7 py-4 font-bold text-[#3d0a48] transition hover:-translate-y-0.5 hover:bg-[#f0cd7e]">Start your journey <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d8aa4a]/20 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-[#79677a] sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><span className="font-serif text-lg font-bold text-[#5e116a]">CupidMatch</span><span className="ml-2">Matrimony</span></div><p>Bringing Sri Lankan Hearts Together</p><div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/safety">Safety</Link></div></div>
      </footer>
    </div>
  );
}