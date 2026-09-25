"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

export function PremiumOpeningStory(){
 const {ref,p}=useProgress();
 const heroOut=phase(p,.035,.105), tagline=phase(p,.085,.205), cards=phase(p,.185,.355), connect=phase(p,.335,.56);
 const profiles=[
  {name:"Nila, 27",place:"London, UK",src:"/images/values/culture.jpg?v=3"},
  {name:"Tharshini, 27",place:"London, UK",src:"/images/values/shared.jpg?v=3"},
  {name:"Kavya, 28",place:"Toronto, Canada",src:"/images/values/goals.jpg?v=3"},
 ];
 return <section ref={ref} className="relative h-[500svh] lg:h-[285svh] bg-[#FFFDFB] [scroll-snap-align:start] [scroll-snap-stop:always]">
  <div className="sticky top-0 h-[100svh] overflow-hidden">
   <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-fuchsia-100/70 blur-3xl"/><div className="pointer-events-none absolute -right-32 bottom-24 h-80 w-80 rounded-full bg-violet-100/80 blur-3xl"/>

   <div className="absolute inset-0 flex flex-col px-5 pb-5 pt-5 will-change-transform lg:grid lg:grid-cols-[minmax(460px,0.92fr)_minmax(560px,1.08fr)] lg:items-center lg:gap-20 lg:px-[max(5vw,64px)] lg:py-12 xl:mx-auto xl:max-w-[1500px]" style={{opacity:1-heroOut,transform:`translate3d(0,${-heroOut*70}px,0) scale(${1-heroOut*.055})`,pointerEvents:heroOut>.75?"none":"auto"}}>
    <div className="lg:max-w-[620px]"><p className="text-[10px] font-bold uppercase leading-5 tracking-[.27em] text-[#A078B0] lg:text-xs">Sri Lankan matchmaking<br/>for a brighter tomorrow</p>
    <h1 className="mt-3 font-serif text-[2.7rem] font-semibold leading-[.98] lg:mt-5 lg:text-[5.25rem] xl:text-[5.8rem] text-[#2A1845]">Find Your<br/><span className="text-[#C026D3]">Perfect Match ♡</span></h1>
    <p className="mt-3 max-w-sm text-[12px] leading-5 lg:mt-6 lg:max-w-lg lg:text-base lg:leading-7 text-[#65546F]">A trusted matrimony platform for the Sri Lankan community in the UK, Canada, Australia and beyond.</p>
    <div className="mt-4 flex justify-between px-2 lg:mt-8 lg:max-w-lg lg:px-0 lg:justify-start lg:gap-12">{[[Users,"Verified\nProfiles"],[Shield,"Safe & Secure"],[Heart,"Find\nCompatibility"]].map(([Icon,label]:any,i)=><div key={i} className="w-24 text-center" style={{opacity:phase(p,.005+i*.012,.06+i*.012),transform:`translateY(${(1-phase(p,.005+i*.012,.06+i*.012))*12}px)`}}><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED]"><Icon className="h-5 w-5"/></span><span className="mt-2 block whitespace-pre-line text-[10px] font-semibold leading-3 text-[#4C3A5C]">{label}</span></div>)}</div>
    <div className="mt-4 grid gap-2 lg:mt-9 lg:max-w-lg lg:grid-cols-2 lg:gap-3"><Link href="/signup" className="flex h-11 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white shadow-lg">Create Your Profile <ArrowRight className="ml-1 h-4 w-4"/></Link><Link href="/discover" className="flex h-11 items-center justify-center rounded-full border border-violet-200 bg-white text-sm font-semibold text-violet-700">Explore Matches</Link></div></div>
    <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-t-[2rem] shadow-[0_18px_45px_rgba(76,29,149,.16)] lg:mt-0 lg:h-[76vh] lg:min-h-[580px] lg:flex-none lg:rounded-[2.75rem] lg:border lg:border-white" style={{transform:`translate3d(0,${heroOut*38}px,0) scale(${1-heroOut*.08})`}}><Image src="/images/values/shared.jpg?v=3" alt="" fill priority sizes="(min-width:1024px) 48vw, 430px" className="object-cover object-center lg:scale-[1.02]"/></div>
   </div>

   <div className="absolute inset-0 flex items-center justify-center px-5" style={{opacity:tagline*(1-phase(p,.20,.27)),transform:`translate3d(0,${(1-tagline)*48-phase(p,.20,.27)*-22}px,0)`}}>
    <div className="relative h-[82svh] w-full max-w-[390px] lg:h-[76vh] lg:max-w-6xl">
     <div className="absolute left-2 top-12 z-10 font-script text-[3.1rem] lg:left-10 lg:top-[26%] lg:text-[6rem] leading-[.9] text-[#C026D3]">Good people<span className="ml-8 block">Brighter futures</span></div>
     <svg className="absolute left-2 top-36 z-10 h-32 w-[95%]" viewBox="0 0 340 120" fill="none"><path d="M8 35 C72 98 120 10 181 53 C235 91 275 31 328 63" pathLength="1" stroke="#D946EF" strokeWidth="2.5" strokeLinecap="round" style={{strokeDasharray:1,strokeDashoffset:1-tagline}}/><path d="M307 57c-10-14-27 2 0 23 27-21 10-37 0-23Z" fill="#D946EF"/></svg>
     <div className="absolute bottom-0 right-0 h-[62svh] w-[88%] lg:h-[74vh] lg:w-[52%] overflow-hidden rounded-t-[7rem] rounded-b-[2.4rem] shadow-2xl" style={{transform:`translateY(${(1-tagline)*50}px) scale(${.94+tagline*.06})`}}><Image src="/images/values/culture.jpg?v=3" alt="" fill sizes="390px" className="object-cover"/></div>
    </div>
   </div>

   <div className="absolute inset-0 flex flex-col items-center justify-center px-4 lg:px-[7vw]" style={{opacity:cards*(1-phase(p,.37,.44)),transform:`translateY(${(1-cards)*55}px)`}}>
    <div className="text-center"><h2 className="font-serif text-[2.35rem] lg:text-[4.25rem] font-semibold leading-[1.02] text-[#2A1845]">Discover<br/><span className="text-[#C026D3]">Compatible Matches</span></h2><p className="mx-auto mt-4 max-w-sm text-sm leading-6 lg:max-w-xl lg:text-base text-[#6B5A78]">Meet people who share your values, culture and life goals.</p></div>
    <div className="relative mt-8 h-[390px] w-full max-w-[390px] lg:mt-12 lg:h-[500px] lg:max-w-[900px]">
     {profiles.map((x,i)=>{const side=i-1;const xPos=side*145;const y=Math.abs(side)*38;const rot=side*7;const sc=i===1?1:.82;return <div key={x.name} className="absolute left-1/2 top-0 w-[220px] lg:w-[270px] overflow-hidden rounded-[2rem] border-[5px] border-white bg-white shadow-[0_24px_60px_rgba(76,29,149,.16)] will-change-transform" style={{zIndex:i===1?3:1,opacity:cards,transform:`translate3d(calc(-50% + ${xPos*cards}px + ${(i-1)*100*cards}px),${(1-cards)*90+y}px,0) rotate(${rot*cards}deg) scale(${.8+(sc-.8)*cards})`}}><div className="relative h-[275px] lg:h-[335px]"><Image src={x.src} alt="" fill sizes="(min-width:1024px) 270px, 220px" className="object-cover"/>{i===1&&<span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#C026D3] shadow">92% Match</span>}</div><div className="p-4"><p className="font-serif text-xl font-semibold text-[#2A1845]">{x.name}</p><p className="mt-1 text-xs text-[#75647F]">{x.place}</p></div></div>})}
    </div>
   </div>

   <div className="absolute inset-0 flex flex-col items-center justify-center px-5 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-[max(7vw,80px)] xl:mx-auto xl:max-w-[1500px]" style={{opacity:connect,transform:`translateY(${(1-connect)*55}px)`}}>
    <div className="text-center lg:text-left"><p className="mb-4 hidden text-xs font-bold uppercase tracking-[.28em] text-[#A078B0] lg:block">Built around real compatibility</p><h2 className="font-serif text-[2.25rem] lg:text-[4.8rem] font-semibold leading-[1.02] text-[#2A1845]">A Meaningful<br/><span className="text-[#C026D3]">Connection Begins</span></h2><p className="mt-3 text-sm lg:max-w-lg lg:text-lg lg:leading-8 text-[#6B5A78]">When shared values bring two people together.</p></div><div className="lg:relative">
    <div className="relative mt-5 h-[430px] w-full max-w-[360px] lg:h-[560px] lg:max-w-[520px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 430" fill="none"><path d="M180 102 C78 130 95 225 180 218 C265 212 278 307 180 337" pathLength="1" stroke="#D946EF" strokeWidth="2.5" strokeLinecap="round" style={{strokeDasharray:1,strokeDashoffset:1-connect}}/></svg>
      <div className="absolute left-1/2 top-3 h-32 w-32 overflow-hidden rounded-full border-[6px] border-white shadow-xl" style={{transform:`translate3d(calc(-50% + ${(1-connect)*-105}px),${(1-connect)*-40}px,0) scale(${.82+connect*.18})`}}><Image src="/images/values/goals.jpg?v=3" alt="" fill sizes="128px" className="object-cover"/></div>
      <div className="absolute bottom-3 left-1/2 h-32 w-32 overflow-hidden rounded-full border-[6px] border-white shadow-xl" style={{transform:`translate3d(calc(-50% + ${(1-connect)*105}px),${(1-connect)*40}px,0) scale(${.82+connect*.18})`}}><Image src="/images/values/culture.jpg?v=3" alt="" fill sizes="128px" className="object-cover"/></div>
      <div className="absolute left-1/2 top-[46%] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-xl" style={{transform:`translateX(-50%) scale(${.4+connect*.6})`}}><Heart className="h-7 w-7" fill="currentColor"/></div>
    </div>
    <div className="grid w-full max-w-[280px] lg:absolute lg:bottom-6 lg:left-0 gap-2 text-xs font-medium text-[#5C4A66]">{["Shared values","Similar goals","Cultural alignment","Real conversations"].map((x,i)=><div key={x} className="flex items-center gap-2" style={{opacity:phase(connect,.35+i*.1,.6+i*.1),transform:`translateX(${(1-phase(connect,.35+i*.1,.6+i*.1))*18}px)`}}><span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[#7C3AED]">✓</span>{x}</div>)}</div></div>
   </div>
  </div>
 </section>
}