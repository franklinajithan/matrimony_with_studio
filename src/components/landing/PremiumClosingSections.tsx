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
 return <section ref={ref} className="relative h-[190svh] lg:h-[125svh] bg-background [scroll-snap-align:start] [scroll-snap-stop:always]">
  <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-5">
   <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(216,180,254,.25),transparent_45%),radial-gradient(circle_at_12%_72%,rgba(244,114,182,.10),transparent_28%)]"/>
   <div className="relative mx-auto w-full max-w-xl text-center lg:max-w-6xl" style={{opacity:.55+enter*.45,transform:`translateY(${(1-enter)*28}px)`}}>
    <p className="text-[10px] font-bold uppercase tracking-[.28em] text-gold-foreground">Across borders, close to home</p>
    <h2 className="mx-auto mt-3 font-serif text-[2.25rem] font-semibold leading-[1.05] text-primary-dark lg:text-[4rem]">A Global Community<br/><span className="text-primary">Connected by Culture</span></h2>
    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground lg:max-w-xl lg:text-base">Sri Lankans around the world, finding meaningful connections.</p>
    <div className="relative mx-auto mt-5 h-[430px] max-w-[390px] lg:mt-8 lg:h-[500px] lg:max-w-[900px]">
     <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 900 500" fill="none" aria-hidden="true">
      <defs>
       <pattern id="cmMapDots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2.2" cy="2.2" r="1.75" fill="hsl(var(--gold-light))"/></pattern>
       <filter id="cmMapGlow" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
      </defs>
      <ellipse cx="450" cy="250" rx="340" ry="145" fill="hsl(var(--gold-light))" opacity=".10" filter="url(#cmMapGlow)"/>
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
      <g stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity=".58">
       <path d="M450 250 C360 177 273 151 183 145" strokeDasharray="2 10"/>
       <path d="M450 250 C560 176 651 160 756 167" strokeDasharray="2 10"/>
       <path d="M450 250 C360 322 276 355 190 368" strokeDasharray="2 10"/>
       <path d="M450 250 C563 323 660 354 756 368" strokeDasharray="2 10"/>
      </g>
      {[ [183,145],[756,167],[190,368],[756,368] ].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="8" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2"/><circle cx={x} cy={y} r="3" fill="hsl(var(--primary))"/></g>)}
     </svg>
     {countries.map(([name,img],i)=>{const pos=["left-0 top-5","right-0 top-12","left-1 bottom-8","right-0 bottom-2"][i];const desktop=["lg:left-[8%] lg:top-[7%]","lg:right-[7%] lg:top-[11%]","lg:left-[10%] lg:bottom-[3%]","lg:right-[8%] lg:bottom-[1%]"][i];const delay=i*.12;const x=clamp((enter-delay)/(1-delay));return <div key={name} className={`absolute ${pos} ${desktop} w-[120px] overflow-hidden rounded-[1.35rem] border-4 border-white bg-card shadow-[0_18px_45px_hsl(var(--primary)/.14)] lg:w-[155px]`} style={{opacity:x,transform:`translateY(${(1-x)*(i<2?-28:28)}px) scale(${.9+x*.1})`}}><div className="relative aspect-[4/3]"><Image src={img} alt={name} fill sizes="(min-width:1024px) 155px,120px" className="object-cover"/></div><div className="flex items-center justify-center gap-1 py-2 text-xs font-bold text-primary-dark lg:text-sm"><MapPin className="h-3.5 w-3.5 text-primary"/>{name}</div></div>})}
     <div className="absolute left-1/2 top-1/2 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/95 px-4 py-5 shadow-elevated backdrop-blur lg:w-44 lg:py-7"><Heart className="mx-auto h-7 w-7 fill-primary text-primary"/><p className="mt-2 font-serif text-lg font-semibold text-primary-dark lg:text-2xl">CupidMatch</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground lg:text-xs">Culture connects us wherever life takes us.</p></div>
    </div>
    <div className="mx-auto grid max-w-sm grid-cols-3 divide-x divide-[hsl(var(--border))] lg:max-w-xl"><div><strong className="block text-xl text-primary lg:text-3xl">Global</strong><span className="text-[10px] text-muted-foreground lg:text-xs">Outlook</span></div><div><strong className="block text-lg text-primary lg:text-2xl">Worldwide</strong><span className="text-[10px] text-muted-foreground lg:text-xs">Community</span></div><div><strong className="block text-xl text-primary lg:text-3xl">Real</strong><span className="text-[10px] text-muted-foreground lg:text-xs">Connections</span></div></div>
   </div>
  </div>
 </section>
}

export function PremiumStories(){
 const [story,setStory]=useState(0);
 const touchStart=useRef<number|null>(null);
 const stories=[
  {image:"/images/couple-meaningful-conversation.webp",quote:"We started with shared values and a simple conversation.",body:"CupidMatch gave us the space to understand what mattered to each other and move forward at our own pace."},
  {image:"/images/values/culture.jpg?v=3",quote:"Culture brought familiarity. Conversation created the connection.",body:"Starting with the things we both valued made getting to know each other feel natural and comfortable."},
  {image:"/images/values/goals.jpg?v=3",quote:"Similar goals gave us something meaningful to build on.",body:"We could talk openly about family, the future and what we both wanted from a lasting relationship."}
 ];
 const current=stories[story];
 const move=(dir:number)=>setStory(v=>(v+dir+stories.length)%stories.length);
 const onTouchStart=(e:React.TouchEvent)=>{touchStart.current=e.touches[0]?.clientX??null};
 const onTouchEnd=(e:React.TouchEvent)=>{if(touchStart.current===null)return;const end=e.changedTouches[0]?.clientX??touchStart.current;const dx=end-touchStart.current;touchStart.current=null;if(Math.abs(dx)>45)move(dx<0?1:-1)};
 return <section aria-labelledby="premium-stories-heading" className="relative overflow-hidden bg-background px-4 py-12 sm:px-8 lg:py-20 [scroll-snap-align:start]">
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,hsl(var(--gold)/.08),transparent_70%)]" aria-hidden="true"/>
  <div className="relative mx-auto max-w-6xl">
   <div className="mx-auto max-w-3xl text-center">
    <div className="mb-4 flex items-center justify-center gap-3 text-gold-foreground" aria-hidden="true"><span className="h-px w-12 bg-gold/60"/><Heart className="h-5 w-5"/><span className="h-px w-12 bg-gold/60"/></div>
    <p className="text-[10px] font-bold uppercase tracking-[.24em] text-gold-foreground sm:text-xs">Illustrative relationship journeys</p>
    <h2 id="premium-stories-heading" className="mt-4 font-serif text-[clamp(2.2rem,5vw,4.5rem)] font-medium leading-[1.09] tracking-tight text-primary-dark">Shared Values<br/><span className="text-primary">Meaningful Conversations</span></h2>
    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">Explore how shared values, culture and life goals can shape a meaningful connection.</p>
   </div>
   <div className="relative mx-auto mt-8 max-w-5xl lg:mt-12" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    <div className="relative overflow-hidden rounded-[2rem] border border-gold/25 bg-card shadow-[0_24px_65px_hsl(var(--primary)/.10)] sm:rounded-[2.5rem] lg:overflow-visible lg:rounded-[3rem]">
     <div className="relative aspect-[5/4] overflow-hidden rounded-t-[2rem] sm:aspect-[16/10] lg:aspect-[16/8] lg:rounded-[3rem]">
      <Image key={current.image} src={current.image} alt={story===0?"Couple enjoying a meaningful conversation in an elegant lounge":story===1?"Illustration of a relationship shaped by shared culture":"Illustration of partners discussing their future goals"} fill sizes="(min-width:1024px) 1024px,100vw" quality={90} className="object-cover object-center"/>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background/60 to-transparent"/>
     </div>
     <div aria-live="polite" className="relative mx-3 -mt-6 rounded-[1.6rem] border border-gold/35 bg-card p-5 text-left shadow-[0_16px_45px_hsl(var(--primary)/.10)] sm:mx-8 sm:-mt-12 sm:p-8 lg:mx-auto lg:-mt-24 lg:max-w-[82%] lg:rounded-[2.5rem] lg:px-12 lg:py-9">
      <span className="absolute -top-5 left-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-background bg-primary text-white shadow-md sm:left-9" aria-hidden="true"><Quote className="h-6 w-6 fill-current"/></span>
      <p className="mt-3 font-serif text-[clamp(1.4rem,3vw,2.3rem)] font-medium leading-snug text-primary-dark">“{current.quote}”</p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{current.body}</p>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-gold-foreground">Illustrative example · Story {story+1} of {stories.length}</p>
     </div>
    </div>
    <button type="button" onClick={()=>move(-1)} aria-label="Previous story" className="absolute left-0 top-[34%] z-10 flex h-11 w-11 -translate-x-1/4 items-center justify-center rounded-full border border-gold/25 bg-card text-primary shadow-lg transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:-translate-x-1/2"><ChevronLeft className="h-5 w-5"/></button>
    <button type="button" onClick={()=>move(1)} aria-label="Next story" className="absolute right-0 top-[34%] z-10 flex h-11 w-11 translate-x-1/4 items-center justify-center rounded-full border border-gold/25 bg-card text-primary shadow-lg transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:translate-x-1/2"><ChevronRight className="h-5 w-5"/></button>
   </div>
   <div className="mt-7 flex items-center justify-center gap-3" aria-label="Select a story">{stories.map((_,i)=><button type="button" key={i} onClick={()=>setStory(i)} aria-label={`Show story ${i+1}`} aria-current={story===i?"true":undefined} className={`h-3 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${story===i?"w-7 bg-primary":"w-3 bg-primary/20 hover:bg-primary/40"}`}/>)}</div>
   <div className="mt-8 text-center"><Link href="/signup" className="inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-3 rounded-full border border-gold/50 bg-primary px-8 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_hsl(var(--primary)/.17)] transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 sm:w-auto">Create Your Profile <span aria-hidden="true">→</span></Link></div>
  </div>
 </section>
}
export function PremiumFinalCta(){
 const {ref,p}=useCardProgress();const enter=clamp(p/.3);
 return <section ref={ref} className="relative h-[175svh] lg:h-[115svh] bg-primary [scroll-snap-align:start] [scroll-snap-stop:always]"><div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 py-8 text-white"><div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-primary" style={{opacity:.65+enter*.35}}/><div className="pointer-events-none absolute inset-0 opacity-20"><Heart className="absolute left-[8%] top-[18%] h-12 w-12"/><Heart className="absolute bottom-[18%] right-[9%] h-16 w-16"/><div className="absolute -bottom-20 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-[50%] border-[18px] border-white/10"/></div><div className="relative mx-auto max-w-xl text-center" style={{opacity:.4+enter*.6,transform:`translateY(${(1-enter)*38}px) scale(${.95+enter*.05})`}}><Heart className="mx-auto h-9 w-9"/><h2 className="mt-6 font-serif text-[2.65rem] font-semibold leading-[1.05]">Ready to Find<br/>Your Perfect Match?</h2><p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-white/85">Create your profile and start your journey toward a meaningful connection.</p><div className="mx-auto mt-7 w-fit space-y-2 text-left text-sm">{["Verified profiles","Safe & secure","Meaningful connections"].map((x,i)=><p key={x} className="flex items-center gap-2" style={{opacity:clamp((enter-i*.12)*1.8)}}><span className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-primary"><Check className="h-3.5 w-3.5"/></span>{x}</p>)}</div><div className="mx-auto mt-9 flex max-w-[330px] flex-col gap-3"><Link href="/signup" className="rounded-full bg-card px-6 py-3.5 text-sm font-bold text-primary shadow-elevated">Create Your Profile →</Link><Link href="/discover" className="rounded-full border border-white/60 px-6 py-3.5 text-sm font-semibold text-white">Explore Matches</Link></div></div></div></section>
}
