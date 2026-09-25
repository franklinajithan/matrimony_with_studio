"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HERO_SLIDES } from "@/components/landing/brand";

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const x=clamp(n);return x*x*(3-2*x)};

function useProgress(){
  const ref=useRef<HTMLElement>(null);
  const raf=useRef<number|null>(null);
  const [p,setP]=useState(0);
  useEffect(()=>{
    const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update=()=>{
      raf.current=null; const el=ref.current;if(!el)return;
      const r=el.getBoundingClientRect(), travel=Math.max(1,r.height-innerHeight);
      setP(reduce?.82:clamp(-r.top/travel));
    };
    const scroll=()=>{if(raf.current===null)raf.current=requestAnimationFrame(update)};
    update();addEventListener("scroll",scroll,{passive:true});addEventListener("resize",scroll,{passive:true});
    return()=>{removeEventListener("scroll",scroll);removeEventListener("resize",scroll);if(raf.current!==null)cancelAnimationFrame(raf.current)};
  },[]);
  return {ref,p};
}
const phase=(p:number,a:number,b:number)=>ease((p-a)/(b-a));

function HeroCarousel({
  className,
  priority,
  sizes,
}: {
  className?: string;
  priority?: boolean;
  sizes: string;
}) {
  const [slide, setSlide] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      if (paused.current) return;
      setSlide((s) => (s + 1) % HERO_SLIDES.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onFocus={() => { paused.current = true; }}
      onBlur={() => { paused.current = false; }}
    >
      {HERO_SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: i === slide ? 1 : 0 }}
          aria-hidden={i !== slide}
        >
          <Image
            src={src}
            alt={i === 0 ? "Happy couple sharing a warm moment" : "Engaged couple celebrating their connection"}
            fill
            priority={priority && i === 0}
            quality={100}
            sizes={sizes}
            className="object-cover object-center"
          />
        </div>
      ))}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Hero photos">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === slide}
            aria-label={`Show photo ${i + 1}`}
            onClick={() => setSlide(i)}
            className={`h-2 rounded-full transition-all ${i === slide ? "w-6 bg-white" : "w-2 bg-white/55 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function PremiumOpeningStory(){
 const profiles=[
  {name:"Nila, 27",place:"London, UK",src:"/images/values/culture.jpg?v=3"},
  {name:"Tharshini, 27",place:"London, UK",src:HERO_SLIDES[0]},
  {name:"Kavya, 28",place:"Toronto, Canada",src:"/images/values/goals.jpg?v=3"},
 ];
 return <section className="bg-[#FFFDFB]">
  <article className="homepage-story-card grid min-h-[calc(100svh-7rem)] items-center gap-8 overflow-hidden px-5 py-6 lg:grid-cols-[minmax(440px,.9fr)_minmax(560px,1.1fr)] lg:gap-16 lg:px-[max(5vw,64px)] lg:py-8 xl:mx-auto xl:max-w-[1500px]">
   <div className="story-copy lg:max-w-[620px]">
    <p className="text-[10px] font-bold uppercase leading-5 tracking-[.27em] text-[#A078B0] lg:text-xs">Sri Lankan matchmaking<br/>for a brighter tomorrow</p>
    <h1 className="mt-3 font-serif text-[2.7rem] font-semibold leading-[1.02] text-[#2A1845] lg:mt-4 lg:text-[5.1rem] xl:text-[5.65rem]">Find Your<br/><span className="text-[#C026D3]">Perfect Match ♡</span></h1>
    <p className="mt-4 max-w-lg text-[12px] leading-5 text-[#65546F] lg:mt-5 lg:text-base lg:leading-7">A trusted matrimony platform for the Sri Lankan community in the UK, Canada, Australia and beyond.</p>
    <div className="mt-5 flex justify-between lg:mt-7 lg:max-w-lg lg:justify-start lg:gap-12">{[[Users,"Verified\nProfiles"],[Shield,"Safe & Secure"],[Heart,"Find\nCompatibility"]].map(([Icon,label]:any,i)=><div key={i} className="story-item w-24 text-center" style={{animationDelay:`${i*70}ms`}}><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED]"><Icon className="h-5 w-5"/></span><span className="mt-2 block whitespace-pre-line text-[10px] font-semibold leading-3 text-[#4C3A5C]">{label}</span></div>)}</div>
    <div className="mt-5 grid gap-2 lg:mt-7 lg:max-w-lg lg:grid-cols-2 lg:gap-3"><Link href="/signup" className="flex h-11 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white shadow-lg">Create Your Profile <ArrowRight className="ml-1 h-4 w-4"/></Link><Link href="/discover" className="flex h-11 items-center justify-center rounded-full border border-violet-200 bg-white text-sm font-semibold text-violet-700">Explore Matches</Link></div>
   </div>
   <HeroCarousel className="story-media h-[44svh] min-h-[310px] rounded-[2.25rem] shadow-[0_18px_45px_rgba(76,29,149,.16)] lg:h-[68vh] lg:min-h-[540px] lg:max-h-[720px] lg:rounded-[2.75rem]" priority sizes="(min-width:1024px) 55vw,100vw"/>
  </article>

  <article className="homepage-story-card relative grid min-h-[calc(100svh-7rem)] items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.9fr_1.1fr] lg:px-[max(7vw,80px)]">
   <div className="story-copy relative z-10 text-center lg:text-left"><p className="font-script text-[3.25rem] leading-[.9] text-[#C026D3] lg:text-[6rem]">Good people<span className="block lg:ml-16">Brighter futures</span></p><p className="mx-auto mt-6 max-w-md text-sm leading-6 text-[#6B5A78] lg:mx-0 lg:text-lg">Meaningful introductions begin with shared values, genuine intentions and room to grow together.</p></div>
   <div className="story-media relative mx-auto h-[58svh] min-h-[420px] w-full max-w-[620px] overflow-hidden rounded-[3rem] shadow-2xl lg:h-[72vh] lg:max-h-[720px]"><Image src={HERO_SLIDES[1]} alt="Engaged couple celebrating their connection" fill quality={100} sizes="(min-width:1024px) 48vw,100vw" className="object-cover object-center"/><svg className="pointer-events-none absolute inset-x-8 top-10 h-28" viewBox="0 0 500 100" fill="none"><path d="M8 60 C110 5 175 95 270 45 C355 0 410 75 492 35" stroke="#D946EF" strokeWidth="3" strokeLinecap="round"/><path d="M458 30c-10-14-27 2 0 23 27-21 10-37 0-23Z" fill="#D946EF"/></svg></div>
  </article>

  <article className="homepage-story-card flex min-h-[calc(100svh-7rem)] flex-col items-center justify-center overflow-hidden px-4 py-8 lg:px-[7vw]">
   <div className="story-copy text-center"><h2 className="font-serif text-[2.35rem] font-semibold leading-[1.04] text-[#2A1845] lg:text-[4.25rem]">Discover<br/><span className="text-[#C026D3]">Compatible Matches</span></h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6B5A78] lg:text-base">Meet people who share your values, culture and life goals.</p></div>
   <div className="relative mt-8 h-[390px] w-full max-w-[390px] lg:mt-10 lg:h-[500px] lg:max-w-[900px]">{profiles.map((x,i)=>{const side=i-1;return <div key={x.name} className={`story-item absolute left-1/2 top-0 w-[220px] overflow-hidden rounded-[2rem] border-[5px] border-white bg-white shadow-[0_24px_60px_rgba(76,29,149,.16)] lg:w-[270px] ${i===1?"z-10":"z-0"}`} style={{transform:`translateX(calc(-50% + ${side*230}px)) rotate(${side*6}deg) scale(${i===1?1:.86})`,animationDelay:`${i*90}ms`}}><div className="relative h-[275px] lg:h-[335px]"><Image src={x.src} alt="" fill sizes="270px" className="object-cover"/>{i===1&&<span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#C026D3] shadow">92% Match</span>}</div><div className="p-4"><p className="font-serif text-xl font-semibold text-[#2A1845]">{x.name}</p><p className="mt-1 text-xs text-[#75647F]">{x.place}</p></div></div>})}</div>
  </article>

  <article className="homepage-story-card grid min-h-[calc(100svh-7rem)] items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-20 lg:px-[max(7vw,80px)] xl:mx-auto xl:max-w-[1500px]">
   <div className="story-copy text-center lg:text-left"><p className="mb-4 hidden text-xs font-bold uppercase tracking-[.28em] text-[#A078B0] lg:block">Built around real compatibility</p><h2 className="font-serif text-[2.25rem] font-semibold leading-[1.04] text-[#2A1845] lg:text-[4.6rem]">A Meaningful<br/><span className="text-[#C026D3]">Connection Begins</span></h2><p className="mt-3 text-sm text-[#6B5A78] lg:max-w-lg lg:text-lg lg:leading-8">When shared values bring two people together.</p><div className="mt-7 hidden max-w-[300px] gap-3 text-sm font-medium text-[#5C4A66] lg:grid">{["Shared values","Similar goals","Cultural alignment","Real conversations"].map((x,i)=><div key={x} className="story-item flex items-center gap-2" style={{animationDelay:`${i*70}ms`}}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[#7C3AED]">✓</span>{x}</div>)}</div></div>
   <div className="story-media relative mx-auto h-[430px] w-full max-w-[430px] lg:h-[590px] lg:max-w-[570px]"><svg className="absolute inset-0 h-full w-full" viewBox="0 0 430 520" fill="none"><path d="M215 92 C72 130 105 245 215 240 C325 235 350 370 215 420" stroke="#D946EF" strokeWidth="3" strokeLinecap="round"/></svg><div className="absolute left-1/2 top-3 h-36 w-36 -translate-x-1/2 overflow-hidden rounded-full border-[6px] border-white shadow-xl lg:h-44 lg:w-44"><Image src="/images/values/goals.jpg?v=3" alt="" fill sizes="176px" className="object-cover"/></div><div className="absolute bottom-3 left-1/2 h-36 w-36 -translate-x-1/2 overflow-hidden rounded-full border-[6px] border-white shadow-xl lg:h-44 lg:w-44"><Image src="/images/values/culture.jpg?v=3" alt="" fill sizes="176px" className="object-cover"/></div><div className="absolute left-1/2 top-[46%] flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-xl"><Heart className="h-8 w-8" fill="currentColor"/></div></div>
  </article>
 </section>
}
