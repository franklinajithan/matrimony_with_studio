"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Sparkles, Users } from "lucide-react";
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
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="absolute inset-[5%] rounded-[2.4rem] border border-fuchsia-300/35 shadow-[inset_0_0_35px_rgba(217,70,239,.12)]" />
        <div className="cupid-flyer absolute left-[5%] top-[64%] flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/90 bg-white/95 shadow-[0_10px_35px_rgba(192,38,211,.45)]">
          <Heart className="h-7 w-7 fill-fuchsia-500 text-fuchsia-500" />
          <ArrowRight className="absolute -right-4 h-6 w-6 text-violet-700" strokeWidth={2.8}/>
        </div>
        <Heart className="hero-heart hero-heart-1 absolute bottom-[8%] left-[12%] h-7 w-7 fill-pink-400 text-pink-400" />
        <Heart className="hero-heart hero-heart-2 absolute bottom-[5%] left-[42%] h-5 w-5 fill-fuchsia-300 text-fuchsia-300" />
        <Heart className="hero-heart hero-heart-3 absolute bottom-[10%] right-[12%] h-8 w-8 fill-pink-300 text-pink-300" />
        <Sparkles className="hero-spark absolute right-[12%] top-[10%] h-9 w-9 text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]" />
        <svg viewBox="0 0 700 130" className="absolute left-[3%] top-[45%] h-[130px] w-[94%] overflow-visible">
          <path d="M8 88 C120 5 230 125 350 60 S570 18 692 76" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="8" strokeLinecap="round"/>
          <path className="cupid-trail" d="M8 88 C120 5 230 125 350 60 S570 18 692 76" fill="none" stroke="#D946EF" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 14"/>
        </svg>
      </div>
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Hero photos">
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
      <style jsx>{`
        @keyframes cupidFly {
          0%,100% { transform:translate3d(0,0,0) rotate(-8deg); }
          25% { transform:translate3d(390px,-190px,0) rotate(5deg); }
          50% { transform:translate3d(440px,90px,0) rotate(10deg); }
          75% { transform:translate3d(80px,130px,0) rotate(-4deg); }
        }
        @keyframes trailMove { to { stroke-dashoffset:-260; } }
        @keyframes heartFloat {
          0% { transform:translateY(20px) scale(.75); opacity:0; }
          20% { opacity:.9; }
          100% { transform:translateY(-250px) translateX(35px) scale(1.25); opacity:0; }
        }
        @keyframes sparkle { 0%,100%{transform:scale(.7) rotate(0);opacity:.35} 50%{transform:scale(1.25) rotate(25deg);opacity:1} }
        .cupid-flyer{animation:cupidFly 7s ease-in-out infinite}
        .cupid-trail{animation:trailMove 3s linear infinite}
        .hero-heart{animation:heartFloat 6s ease-in-out infinite}
        .hero-heart-2{animation-delay:-2s;animation-duration:7.5s}
        .hero-heart-3{animation-delay:-4s;animation-duration:8.5s}
        .hero-spark{animation:sparkle 2.4s ease-in-out infinite}
        @media(max-width:767px){
          @keyframes cupidFly {
            0%,100% { transform:translate3d(0,0,0) rotate(-8deg); }
            25% { transform:translate3d(230px,-80px,0) rotate(5deg); }
            50% { transform:translate3d(250px,45px,0) rotate(10deg); }
            75% { transform:translate3d(45px,70px,0) rotate(-4deg); }
          }
          .cupid-flyer{height:2.75rem;width:2.75rem}
        }
        @media(prefers-reduced-motion:reduce){.cupid-flyer,.cupid-trail,.hero-heart,.hero-spark{animation:none}}
      `}</style>
    </div>
  );
}

export function PremiumOpeningStory(){
 const profiles=[
  {name:"Nila, 27",place:"London, UK",src:"/images/profiles/nila.jpg?v=1"},
  {name:"Tharshini, 27",place:"London, UK",src:"/images/profiles/tharshini.jpg?v=1"},
  {name:"Kavya, 28",place:"London, UK",src:"/images/profiles/kavya.jpg?v=1"},
  {name:"Vishal, 29",place:"London, UK",src:"/images/profiles/vishal.jpg?v=1"},
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

  <article className="homepage-story-card relative grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-16 lg:px-[max(6vw,72px)]">
   <div className="story-copy relative z-10 text-center lg:text-left"><p className="font-script text-[3.25rem] leading-[.98] text-[#C026D3] lg:text-[5.5rem] xl:text-[6.25rem]">Good people<span className="block lg:ml-14">Brighter futures</span></p><p className="mx-auto mt-6 max-w-md text-sm leading-6 text-[#6B5A78] lg:mx-0 lg:text-lg lg:leading-8">Meaningful introductions begin with shared values, genuine intentions and room to grow together.</p><div className="mt-7 hidden items-center gap-3 text-sm font-semibold text-violet-700 lg:flex"><span className="h-px w-12 bg-fuchsia-300"/><Heart className="h-5 w-5"/>Built for meaningful beginnings</div></div>
   <div className="story-media relative mx-auto h-[58svh] min-h-[420px] w-full max-w-[650px] overflow-hidden rounded-[3rem] shadow-[0_28px_70px_rgba(76,29,149,.18)] lg:h-[70vh] lg:max-h-[690px]"><Image src={HERO_SLIDES[1]} alt="Engaged couple celebrating their connection" fill quality={100} sizes="(min-width:1024px) 50vw,100vw" className="object-cover object-center"/><div className="absolute inset-0 bg-gradient-to-t from-violet-950/10 via-transparent to-fuchsia-50/5"/><svg className="story-line pointer-events-none absolute inset-x-8 top-10 h-28" viewBox="0 0 500 100" fill="none"><path d="M8 60 C110 5 175 95 270 45 C355 0 410 75 492 35" stroke="#D946EF" strokeWidth="3" strokeLinecap="round"/><path d="M458 30c-10-14-27 2 0 23 27-21 10-37 0-23Z" fill="#D946EF"/></svg></div>
  </article>

  <article className="homepage-story-card grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-14 lg:px-[max(6vw,72px)]">
   <div className="story-copy text-center lg:text-left"><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#A078B0] lg:text-xs">People who fit your future</p><h2 className="mt-3 font-serif text-[2.35rem] font-semibold leading-[1.06] text-[#2A1845] lg:text-[4.5rem]">Discover<br/><span className="text-[#C026D3]">Compatible Matches</span></h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6B5A78] lg:mx-0 lg:max-w-md lg:text-lg lg:leading-8">Meet people who share your values, culture and life goals.</p><div className="mt-7 hidden flex-wrap gap-2 lg:flex">{["Shared values","Life goals","Culture","Family"].map(x=><span key={x} className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">{x}</span>)}</div></div>
   <div className="relative mx-auto h-[480px] w-full max-w-[420px] lg:h-[590px] lg:max-w-[980px]">{profiles.map((x,i)=>{const pos=["lg:left-[0%] lg:top-[16%] lg:-rotate-6","lg:left-[26%] lg:top-[3%] lg:-rotate-1","lg:left-[51%] lg:top-[2%] lg:rotate-1","lg:left-[76%] lg:top-[15%] lg:rotate-6"][i];const mobile=["left-[2%] top-[2%] -rotate-6","right-[2%] top-[2%] rotate-6","left-[2%] bottom-[2%] -rotate-3","right-[2%] bottom-[6%] rotate-3"][i];return <div key={x.name} className={`story-profile story-item absolute ${mobile} ${pos} w-[165px] overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-[0_24px_60px_rgba(76,29,149,.18)] lg:w-[220px]`} style={{animationDelay:`${80+i*100}ms`,zIndex:i===1?5:i+1}}><div className="relative h-[210px] lg:h-[295px]"><Image src={x.src} alt={x.name} fill sizes="220px" quality={90} className="object-cover object-[center_15%]"/>{i===1&&<span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#C026D3] shadow">92% Match</span>}</div><div className="p-3 lg:p-4"><p className="font-serif text-base font-semibold text-[#2A1845] lg:text-xl">{x.name}</p><p className="mt-1 text-xs text-[#75647F]">{x.place}</p></div></div>})}</div>
  </article>

  <article className="homepage-story-card grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-16 lg:px-[max(6vw,72px)] xl:mx-auto xl:max-w-[1500px]">
   <div className="story-copy text-center lg:text-left"><p className="mb-4 text-[10px] font-bold uppercase tracking-[.28em] text-[#A078B0] lg:text-xs">Built around real compatibility</p><h2 className="font-serif text-[2.25rem] font-semibold leading-[1.06] text-[#2A1845] lg:text-[4.65rem]">A Meaningful<br/><span className="text-[#C026D3]">Connection Begins</span></h2><p className="mt-4 text-sm leading-6 text-[#6B5A78] lg:max-w-lg lg:text-lg lg:leading-8">When shared values bring two people together, a conversation can become something more.</p><div className="mt-7 grid max-w-[430px] grid-cols-2 gap-3 text-sm font-medium text-[#5C4A66]">{["Shared values","Similar goals","Cultural alignment","Real conversations"].map((x,i)=><div key={x} className="story-item flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-3 py-3 shadow-sm" style={{animationDelay:`${i*70}ms`}}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[#7C3AED]">✓</span>{x}</div>)}</div></div>
   <div className="story-media relative mx-auto h-[430px] w-full max-w-[430px] lg:h-[620px] lg:max-w-[680px]"><div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,.12),transparent_65%)]"/><svg className="story-line absolute inset-0 h-full w-full" viewBox="0 0 600 600" fill="none"><path d="M160 145 C360 40 445 190 305 285 C175 375 270 505 455 445" stroke="#D946EF" strokeWidth="4" strokeLinecap="round"/></svg><div className="story-portrait absolute left-[8%] top-[6%] h-44 w-44 overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl lg:h-56 lg:w-56"><Image src="/images/values/goals.jpg?v=3" alt="" fill sizes="224px" className="object-cover"/></div><div className="story-portrait story-portrait-delay absolute bottom-[5%] right-[7%] h-44 w-44 overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl lg:h-56 lg:w-56"><Image src="/images/values/culture.jpg?v=3" alt="" fill sizes="224px" className="object-cover"/></div><div className="story-heart absolute left-1/2 top-[46%] flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-[0_16px_45px_rgba(192,38,211,.35)]"><Heart className="h-9 w-9" fill="currentColor"/></div></div>
  </article>
 </section>
}
