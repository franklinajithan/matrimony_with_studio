"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TaglineReveal() {
  const ref=useRef<HTMLElement>(null); const [on,setOn]=useState(false);
  useEffect(()=>{const n=ref.current;if(!n)return;if(matchMedia("(prefers-reduced-motion: reduce)").matches){setOn(true);return}
    const o=new IntersectionObserver(([e])=>{if(e.isIntersecting)setOn(true);else setOn(false)},{threshold:.25});o.observe(n);return()=>o.disconnect()},[]);
  return <section ref={ref} className="relative flex min-h-[92svh] items-center overflow-hidden bg-[#FFF9FC] px-5 py-14">
    <div className="pointer-events-none absolute left-[-25%] top-[5%] h-72 w-72 rounded-full bg-[#FCE7F3] blur-3xl"/><div className="pointer-events-none absolute right-[-30%] top-[25%] h-80 w-80 rounded-full bg-[#F3E8FF] blur-3xl"/>
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative z-10 mb-[-2rem] ml-3">
        <p className="font-script text-[3.15rem] leading-[.9] text-[#C026D3] transition-all duration-1000 sm:text-6xl" style={{opacity:on?1:0,transform:on?"translate3d(0,0,0)":"translate3d(-24px,12px,0)"}}>Good people<span className="block ml-9">Brighter futures</span></p>
        <svg viewBox="0 0 330 100" className="mt-1 h-20 w-full overflow-visible" fill="none" aria-hidden="true"><path d="M10 42 C70 88 116 5 177 45 C222 76 264 28 318 55" stroke="#D946EF" strokeWidth="2" strokeLinecap="round" pathLength="1" style={{strokeDasharray:1,strokeDashoffset:on?0:1,transition:"stroke-dashoffset 1400ms cubic-bezier(.2,.8,.2,1) 250ms"}}/><Heart x="292" y="45" className="h-5 w-5 text-[#D946EF]"/></svg>
      </div>
      <div className="relative ml-auto h-[55svh] min-h-[390px] w-[88%] overflow-hidden rounded-t-[7rem] rounded-b-[2.5rem] shadow-[0_24px_65px_rgba(76,29,149,.16)] transition-all duration-1000" style={{opacity:on?1:0,transform:on?"translate3d(0,0,0) scale(1)":"translate3d(0,45px,0) scale(.96)"}}>
        <Image src="/images/values/culture.jpg?v=3" alt="" fill sizes="430px" className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A1845]/25 via-transparent to-white/5"/>
      </div>
    </div>
  </section>
}
