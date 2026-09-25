"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Heart, MapPin, Quote } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function useCardProgress(){const ref=useRef<HTMLElement>(null);const [p,setP]=useState(0);useEffect(()=>{let raf=0;const update=()=>{raf=0;const n=ref.current;if(!n)return;const r=n.getBoundingClientRect();setP(clamp(-r.top/Math.max(1,r.height-innerHeight)))};const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update)};update();addEventListener("scroll",onScroll,{passive:true});return()=>{removeEventListener("scroll",onScroll);if(raf)cancelAnimationFrame(raf)}},[]);return{ref,p}}

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
 const {ref,p}=useCardProgress(); const enter=clamp(p/.32);
 const dots=[
  [18,28],[22,32],[27,30],[31,36],[35,42],[41,31],[45,35],[49,40],[54,33],[58,37],[62,31],[67,35],[72,39],[76,31],[81,35],
  [24,48],[29,52],[35,49],[42,53],[48,47],[55,51],[61,47],[68,52],[74,48],[80,52],[34,61],[42,64],[51,60],[60,64],[69,61]
 ];
 return <section ref={ref} className="relative h-[190svh] lg:h-[125svh] bg-[#FFFDFB] [scroll-snap-align:start] [scroll-snap-stop:always]">
  <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-5">
   <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(216,180,254,.25),transparent_45%),radial-gradient(circle_at_12%_72%,rgba(244,114,182,.10),transparent_28%)]"/>
   <div className="relative mx-auto w-full max-w-xl text-center lg:max-w-6xl" style={{opacity:.55+enter*.45,transform:`translateY(${(1-enter)*28}px)`}}>
    <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#A078B0]">Across borders, close to home</p>
    <h2 className="mx-auto mt-3 font-serif text-[2.25rem] font-semibold leading-[1.05] text-[#2A1845] lg:text-[4rem]">A Global Community<br/><span className="text-[#C026D3]">Connected by Culture</span></h2>
    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B5A78] lg:max-w-xl lg:text-base">Sri Lankans around the world, finding meaningful connections.</p>
    <div className="relative mx-auto mt-5 h-[430px] max-w-[390px] lg:mt-8 lg:h-[500px] lg:max-w-[900px]">
     <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 900 500" fill="none" aria-hidden="true">
      <defs>
       <pattern id="cmMapDots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2.2" cy="2.2" r="1.75" fill="#A78BFA"/></pattern>
       <filter id="cmMapGlow" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
      </defs>
      <ellipse cx="450" cy="250" rx="340" ry="145" fill="#C084FC" opacity=".10" filter="url(#cmMapGlow)"/>
      <g fill="url(#cmMapDots)" opacity=".78">
       <path d="M72 127l30-26 40-14 38 7 24-15 42 10 25 23 39 5 23 20-9 24-31 12-13 27-34 9-22-10-20 18-34-7-18-21-35-8-27-25-20-17 22-32z"/>
       <path d="M245 177l27 8 23 31-2 38-17 29-9 44-22 48-21-14-8-37-15-31 10-39-10-35 19-28 25-14z"/>
       <path d="M359 103l36-25 54-7 40 16 46-10 43 16 38-6 35 18 49 2 43 18 37 2 30 20-15 24-43 8-27 22-40-7-28 20-40-5-31 23-36-11-25 12-29-17-40 5-33-22-35-8-23-27 18-25 46-13z"/>
       <path d="M497 194l33 12 23 29-5 35-20 34-12 48-28 55-26-18-6-44-17-31 9-43-13-35 20-29 42-13z"/>
       <path d="M671 226l20 8 13 20-7 18-19-4-11-22 4-20z"/>
       <path d="M714 256l17 5 8 18-9 16-16-6-6-18 6-15z"/>
       <path d="M743 322l35-18 44 5 31 28-6 35-35 21-44-8-30-30 5-33z"/>
       <path d="M845 352l18 6 10 18-10 13-18-7-6-17 6-13z"/>
      </g>
      <g stroke="#9333EA" strokeWidth="2" strokeLinecap="round" opacity=".58">
       <path d="M450 250 C360 177 273 151 183 145" strokeDasharray="2 10"/>
       <path d="M450 250 C560 176 651 160 756 167" strokeDasharray="2 10"/>
       <path d="M450 250 C360 322 276 355 190 368" strokeDasharray="2 10"/>
       <path d="M450 250 C563 323 660 354 756 368" strokeDasharray="2 10"/>
      </g>
      {[ [183,145],[756,167],[190,368],[756,368] ].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="8" fill="#FFFDFB" stroke="#7C3AED" strokeWidth="2"/><circle cx={x} cy={y} r="3" fill="#D946EF"/></g>)}
     </svg>
     {countries.map(([name,img],i)=>{const pos=["left-0 top-5","right-0 top-12","left-1 bottom-8","right-0 bottom-2"][i];const desktop=["lg:left-[8%] lg:top-[7%]","lg:right-[7%] lg:top-[11%]","lg:left-[10%] lg:bottom-[3%]","lg:right-[8%] lg:bottom-[1%]"][i];const delay=i*.12;const x=clamp((enter-delay)/(1-delay));return <div key={name} className={`absolute ${pos} ${desktop} w-[120px] overflow-hidden rounded-[1.35rem] border-4 border-white bg-white shadow-[0_18px_45px_rgba(76,29,149,.14)] lg:w-[155px]`} style={{opacity:x,transform:`translateY(${(1-x)*(i<2?-28:28)}px) scale(${.9+x*.1})`}}><div className="relative aspect-[4/3]"><Image src={img} alt={name} fill sizes="(min-width:1024px) 155px,120px" className="object-cover"/></div><div className="flex items-center justify-center gap-1 py-2 text-xs font-bold text-[#2A1845] lg:text-sm"><MapPin className="h-3.5 w-3.5 text-[#7C3AED]"/>{name}</div></div>})}
     <div className="absolute left-1/2 top-1/2 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5EDFF]/95 px-4 py-5 shadow-lg backdrop-blur lg:w-44 lg:py-7"><Heart className="mx-auto h-7 w-7 fill-[#D946EF] text-[#D946EF]"/><p className="mt-2 font-serif text-lg font-semibold text-[#2A1845] lg:text-2xl">CupidMatch</p><p className="mt-1 text-[10px] leading-4 text-[#6B5A78] lg:text-xs">Culture connects us wherever life takes us.</p></div>
    </div>
    <div className="mx-auto grid max-w-sm grid-cols-3 divide-x divide-[#E9D5FF] lg:max-w-xl"><div><strong className="block text-xl text-[#7C3AED] lg:text-3xl">15+</strong><span className="text-[10px] text-[#6B5A78] lg:text-xs">Countries</span></div><div><strong className="block text-lg text-[#7C3AED] lg:text-2xl">Worldwide</strong><span className="text-[10px] text-[#6B5A78] lg:text-xs">Community</span></div><div><strong className="block text-xl text-[#7C3AED] lg:text-3xl">Real</strong><span className="text-[10px] text-[#6B5A78] lg:text-xs">Connections</span></div></div>
   </div>
  </div>
 </section>
}

export function PremiumStories(){
 const {ref,p}=useCardProgress();const enter=clamp(p/.3); const [story,setStory]=useState(0);
 const stories=[
  {image:"/images/values/shared.jpg?v=3",quote:"We started with shared values and a simple conversation.",body:"{current.body}"},
  {image:"/images/values/culture.jpg?v=3",quote:"Culture brought familiarity. Conversation created the connection.",body:"Starting with the things we both valued made getting to know each other feel natural and comfortable."},
  {image:"/images/values/goals.jpg?v=3",quote:"Similar goals gave us something meaningful to build on.",body:"We could talk openly about family, the future and what we both wanted from a lasting relationship."}
 ]; const current=stories[story]; const move=(dir:number)=>setStory(v=>(v+dir+stories.length)%stories.length);
 return <section ref={ref} className="relative h-[175svh] lg:h-[120svh] bg-[#FBF8F4] [scroll-snap-align:start] [scroll-snap-stop:always]"><div className="sticky top-[4.25rem] flex h-[calc(100svh-4.25rem)] items-center overflow-hidden px-5 py-3"><div className="mx-auto w-full max-w-5xl text-center" style={{opacity:.5+enter*.5,transform:`translateY(${(1-enter)*30}px)`}}>
   <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#A078B0]">Stories shared with care</p><h2 className="mt-2 font-serif text-[2.3rem] font-semibold leading-tight text-[#2A1845]">Real People<br/><span className="text-[#C026D3]">Real Stories</span></h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B5A78]">Meaningful introductions. Genuine conversations. Journeys shared with care.</p>
   <article className="mx-auto mt-5 max-w-[390px] overflow-hidden rounded-[2rem] border border-[#EEE4F5] bg-white text-left shadow-[0_24px_60px_rgba(76,29,149,.12)]" style={{transform:`scale(${.94+enter*.06})`}}><div className="relative h-[270px]"><Image key={current.image} src={current.image} alt="" fill sizes="390px" className="object-cover transition-all duration-250" style={{transform:`scale(${1.08-enter*.08})`}}/></div><div className="p-5"><Quote className="h-7 w-7 fill-[#D946EF] text-[#D946EF]"/><p className="mt-3 font-serif text-[1.35rem] font-semibold leading-snug text-[#2A1845]">“{current.quote}”</p><p className="mt-2 text-xs leading-5 text-[#6B5A78]">CupidMatch gave us the space to understand what mattered to each other and move forward at our own pace.</p></div></article>
   <div className="mx-auto mt-4 flex max-w-[190px] items-center justify-between"><button type="button" onClick={()=>move(-1)} aria-label="Previous story" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E9D5FF] bg-white text-[#7C3AED] active:scale-95"><ChevronLeft className="h-4 w-4"/></button><div className="flex gap-1.5">{stories.map((_,i)=><button type="button" key={i} onClick={()=>setStory(i)} aria-label={`Story ${i+1}`} className={`${i===story?"h-1.5 w-5 bg-[#7C3AED]":"h-1.5 w-1.5 bg-[#D8CCE2]"} rounded-full transition-all`}/>)}</div><button type="button" onClick={()=>move(1)} aria-label="Next story" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E9D5FF] bg-white text-[#7C3AED] active:scale-95"><ChevronRight className="h-4 w-4"/></button></div>
  </div></div></section>
}

export function PremiumFinalCta(){
 const {ref,p}=useCardProgress();const enter=clamp(p/.3);
 return <section ref={ref} className="relative h-[175svh] lg:h-[115svh] bg-[#5B21B6] [scroll-snap-align:start] [scroll-snap-stop:always]"><div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-8 text-white"><div className="absolute inset-0 bg-gradient-to-b from-[#8B3DFF] via-[#7027E8] to-[#541CB5]" style={{opacity:.65+enter*.35}}/><div className="pointer-events-none absolute inset-0 opacity-20"><Heart className="absolute left-[8%] top-[18%] h-12 w-12"/><Heart className="absolute bottom-[18%] right-[9%] h-16 w-16"/><div className="absolute -bottom-20 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-[50%] border-[18px] border-white/10"/></div><div className="relative mx-auto max-w-xl text-center" style={{opacity:.4+enter*.6,transform:`translateY(${(1-enter)*38}px) scale(${.95+enter*.05})`}}><Heart className="mx-auto h-9 w-9"/><h2 className="mt-6 font-serif text-[2.65rem] font-semibold leading-[1.05]">Ready to Find<br/>Your Perfect Match?</h2><p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-white/85">Create your profile and start your journey toward a meaningful connection.</p><div className="mx-auto mt-7 w-fit space-y-2 text-left text-sm">{["Verified profiles","Safe & secure","Meaningful connections"].map((x,i)=><p key={x} className="flex items-center gap-2" style={{opacity:clamp((enter-i*.12)*1.8)}}><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#7C3AED]"><Check className="h-3.5 w-3.5"/></span>{x}</p>)}</div><div className="mx-auto mt-9 flex max-w-[330px] flex-col gap-3"><Link href="/signup" className="rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#6D28D9] shadow-xl">Create Your Profile →</Link><Link href="/discover" className="rounded-full border border-white/60 px-6 py-3.5 text-sm font-semibold text-white">Explore Matches</Link></div></div></div></section>
}
