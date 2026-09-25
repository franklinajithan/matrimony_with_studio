"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, MapPin, Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function useReveal() {
  const ref=useRef<HTMLElement>(null); const [on,setOn]=useState(false);
  useEffect(()=>{const n=ref.current;if(!n)return;if(matchMedia("(prefers-reduced-motion: reduce)").matches){setOn(true);return}
    const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setOn(true);o.disconnect()}},{threshold:.18});o.observe(n);return()=>o.disconnect()},[]);
  return {ref,on};
}

const countries=[
  ["Canada","/images/countries/canada.jpg"],
  ["UK","/images/countries/uk.jpg"],
  ["Australia","/images/countries/australia.jpg"],
  ["Sri Lanka","/images/countries/sri-lanka.jpg"],
] as const;

export function GlobalCommunityStory(){
 const {ref,on}=useReveal();
 return <section ref={ref} className="relative overflow-hidden bg-[#FFFDFB] px-5 py-16 sm:py-28">
  <div className="mx-auto max-w-5xl text-center">
   <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#A078B0]">Across borders, close to home</p>
   <h2 className="mx-auto mt-3 max-w-xl font-serif text-3xl font-semibold leading-tight text-[#2A1845] sm:text-5xl">A Global Community<br/><span className="text-[#C026D3]">Connected by Culture</span></h2>
   <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#6B5A78]">Sri Lankans around the world, finding meaningful connections.</p>
   <div className="relative mx-auto mt-8 h-[430px] max-w-[560px] sm:mt-12 sm:h-[500px] sm:max-w-[620px]">
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 500" fill="none" aria-hidden="true">
      <path d="M75 95 C190 40 230 185 310 220 C390 255 430 90 545 110 M80 385 C190 430 230 300 310 250 C400 190 455 370 545 390" stroke="#D8B4FE" strokeWidth="2" strokeDasharray="7 8" style={{strokeDashoffset:on?0:180,transition:"stroke-dashoffset 1600ms ease"}}/>
      <circle cx="310" cy="245" r="9" fill="#7C3AED"/><circle cx="310" cy="245" r="18" stroke="#C4B5FD" opacity=".55"/>
    </svg>
    {countries.map(([name,img],i)=>{
      const pos=["left-0 top-5","right-0 top-12","left-3 bottom-8","right-2 bottom-3"][i];
      return <div key={name} className={`absolute ${pos} w-[132px] overflow-hidden rounded-[1.35rem] border-4 border-white bg-white shadow-[0_18px_45px_rgba(76,29,149,.14)] transition-all duration-700 sm:w-[160px]`} style={{opacity:on?1:0,transform:on?"translate3d(0,0,0) scale(1)":`translate3d(0,${i<2?-24:24}px,0) scale(.92)`,transitionDelay:`${i*110}ms`}}>
       <div className="relative aspect-[4/3]"><Image src={img} alt={name} fill sizes="160px" className="object-cover"/></div>
       <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#2A1845]"><MapPin className="h-3.5 w-3.5 text-[#7C3AED]"/>{name}</div>
      </div>
    })}
    <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5EDFF]/90 px-5 py-6 shadow-sm backdrop-blur">
      <Heart className="mx-auto h-7 w-7 fill-[#D946EF] text-[#D946EF]"/><p className="mt-2 font-serif text-lg font-semibold text-[#2A1845]">CupidMatch</p><p className="mt-1 text-[10px] leading-4 text-[#6B5A78]">Culture connects us wherever life takes us.</p>
    </div>
   </div>
   <div className="mx-auto grid max-w-lg grid-cols-3 divide-x divide-[#E9D5FF]">
    <div><strong className="block text-xl text-[#7C3AED]">15+</strong><span className="text-[10px] text-[#6B5A78]">Countries</span></div>
    <div><strong className="block text-xl text-[#7C3AED]">Worldwide</strong><span className="text-[10px] text-[#6B5A78]">Community</span></div>
    <div><strong className="block text-xl text-[#7C3AED]">Real</strong><span className="text-[10px] text-[#6B5A78]">Connections</span></div>
   </div>
  </div>
 </section>
}

export function PremiumStories(){
 const {ref,on}=useReveal();
 return <section ref={ref} className="overflow-hidden bg-[#FBF8F4] px-5 py-16 sm:py-28">
  <div className="mx-auto max-w-5xl text-center">
   <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#A078B0]">Stories shared with care</p>
   <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[#2A1845] sm:text-5xl">Real People<br/><span className="text-[#C026D3]">Real Stories</span></h2>
   <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#6B5A78]">A place for couples to share the journeys that began with an introduction.</p>
   <div className="mt-8 flex snap-x gap-4 overflow-x-auto px-[12%] pb-5 [scrollbar-width:none] sm:justify-center sm:overflow-visible sm:px-0">
    {["shared","family","communication"].map((name,i)=><article key={name} className="w-[76vw] max-w-[300px] shrink-0 snap-center overflow-hidden rounded-[2rem] border border-[#EEE4F5] bg-white text-left shadow-[0_18px_45px_rgba(76,29,149,.1)] transition-all duration-700" style={{opacity:on?1:0,transform:on?"translate3d(0,0,0)":"translate3d(34px,0,0)",transitionDelay:`${i*120}ms`}}>
      <div className="relative aspect-[4/3]"><Image src={`/images/values/${name}.jpg?v=3`} alt="" fill sizes="300px" className="object-cover"/></div>
      <div className="p-5"><Quote className="h-6 w-6 fill-[#D946EF] text-[#D946EF]"/><p className="mt-3 font-serif text-lg font-semibold text-[#2A1845]">{i===0?"A thoughtful introduction":i===1?"Shared values first":"A conversation worth having"}</p><p className="mt-2 text-xs leading-5 text-[#6B5A78]">CupidMatch is designed to help people understand compatibility and move forward at their own pace.</p><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#A078B0]">CupidMatch community</p></div>
    </article>)}
   </div>
  </div>
 </section>
}

export function PremiumFinalCta(){
 const {ref,on}=useReveal();
 return <section ref={ref} className="relative flex min-h-[88svh] items-center overflow-hidden bg-gradient-to-b from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] px-5 py-20 text-white sm:min-h-0 sm:py-32">
  <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true"><Heart className="absolute left-[8%] top-[18%] h-12 w-12"/><Heart className="absolute bottom-[18%] right-[9%] h-16 w-16"/><div className="absolute -bottom-20 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-[50%] border-[18px] border-white/10"/></div>
  <div className="relative mx-auto max-w-xl text-center transition-all duration-700" style={{opacity:on?1:0,transform:on?"translate3d(0,0,0) scale(1)":"translate3d(0,28px,0) scale(.96)"}}>
   <Heart className="mx-auto h-9 w-9" strokeWidth={1.5}/>
   <h2 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] sm:text-6xl">Ready to Find<br/>Your Perfect Match?</h2>
   <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-white/85">Create your profile and start your journey toward a meaningful connection.</p>
   <div className="mx-auto mt-7 w-fit space-y-2 text-left text-sm">{["Verified profiles","Safe & secure","Meaningful connections"].map(x=><p key={x} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#7C3AED]"><Check className="h-3.5 w-3.5"/></span>{x}</p>)}</div>
   <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3"><Link href="/signup" className="rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#6D28D9] shadow-xl">Create Your Profile →</Link><Link href="/discover" className="rounded-full border border-white/60 px-6 py-3.5 text-sm font-semibold text-white">Explore Matches</Link></div>
  </div>
 </section>
}
