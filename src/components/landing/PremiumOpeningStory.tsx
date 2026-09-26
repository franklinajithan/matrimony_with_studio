"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HERO_SLIDES } from "@/components/landing/brand";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";

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
            className="hero-photo object-cover object-center"
          />
        </div>
      ))}
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
        @keyframes bowDraw { 0%,12% { stroke-dasharray:180; stroke-dashoffset:180; opacity:.35 } 32%,100% { stroke-dasharray:180; stroke-dashoffset:0; opacity:1 } }
        @keyframes stringDraw { 0%,22% { stroke-dasharray:100; stroke-dashoffset:100 } 40%,100% { stroke-dasharray:100; stroke-dashoffset:0 } }
        @keyframes arrowShoot { 0%,42% { transform:translateX(-30px); opacity:0 } 55% { transform:translateX(7px); opacity:1 } 62%,88% { transform:translateX(0); opacity:1 } 100% { transform:translateX(18px); opacity:0 } }
        @keyframes heartPop { 0%,48% { transform:scale(0) rotate(-18deg); opacity:0 } 62% { transform:scale(1.25) rotate(5deg); opacity:1 } 72%,90% { transform:scale(1); opacity:1 } 100% { transform:scale(.85); opacity:0 } }
        @keyframes signatureFloat { 0%,100% { transform:translateY(1px) rotate(-2deg) } 50% { transform:translateY(-3px) rotate(1deg) } }
        @keyframes photoBreathe { 0%,100% { transform:scale(1.01) translate3d(0,0,0) } 50% { transform:scale(1.035) translate3d(-.35%, -.25%,0) } }
        .cupid-signature{animation:signatureFloat 4.8s ease-in-out infinite}
        .hero-photo{animation:photoBreathe 12s ease-in-out infinite}
        .cupid-bow{animation:bowDraw 5.2s ease-in-out infinite}
        .cupid-string{animation:stringDraw 5.2s ease-in-out infinite}
        .cupid-arrow{transform-origin:center;animation:arrowShoot 5.2s cubic-bezier(.2,.8,.2,1) infinite}
        .cupid-heart-pop{transform-origin:72px 27px;animation:heartPop 5.2s ease-out infinite}
        @media(prefers-reduced-motion:reduce){.hero-photo{animation:none}}
      `}</style>
    </div>
  );
}


// Landing copy is kept in a single locale-aware map instead of hardcoded JSX.
const openingCopy = {
 en:["Good people","Brighter futures","Meaningful introductions begin with shared values, genuine intentions and room to grow together.","Built for meaningful beginnings","People who fit your future","Discover","Compatible Matches","Meet people who share your values, culture and life goals.","Shared values","Life goals","Culture","Family","Built around real compatibility","A Meaningful","Connection Begins","When shared values bring two people together, a conversation can become something more.","Similar goals","Cultural alignment","Real conversations"],
 ta:["நல்ல மனிதர்கள்","ஒளிமயமான எதிர்காலம்","பகிரப்பட்ட மதிப்புகள், உண்மையான நோக்கங்கள் மற்றும் ஒன்றாக வளர்வதற்கான வாய்ப்புகளுடன் அர்த்தமுள்ள அறிமுகங்கள் தொடங்குகின்றன.","அர்த்தமுள்ள தொடக்கங்களுக்காக","உங்கள் எதிர்காலத்திற்கு ஏற்றவர்கள்","கண்டறியுங்கள்","பொருத்தமான இணைகள்","உங்கள் மதிப்புகள், கலாச்சாரம் மற்றும் வாழ்க்கை இலக்குகளைப் பகிரும் நபர்களைச் சந்தியுங்கள்.","பகிரப்பட்ட மதிப்புகள்","வாழ்க்கை இலக்குகள்","கலாச்சாரம்","குடும்பம்","உண்மையான பொருத்தத்தை அடிப்படையாகக் கொண்டு","அர்த்தமுள்ள","உறவு தொடங்குகிறது","பகிரப்பட்ட மதிப்புகள் இருவரை இணைக்கும்போது, உரையாடல் மேலும் சிறப்பாக மலரும்.","ஒத்த இலக்குகள்","கலாச்சாரப் பொருத்தம்","உண்மையான உரையாடல்கள்"],
 si:["හොඳ මිනිසුන්","දීප්තිමත් අනාගතයක්","හවුල් වටිනාකම්, අවංක අරමුණු සහ එකට වර්ධනය වීමට ඇති ඉඩ සමඟ අර්ථවත් හඳුන්වාදීම් ආරම්භ වේ.","අර්ථවත් ආරම්භයක් සඳහා","ඔබේ අනාගතයට ගැළපෙන අය","සොයාගන්න","ගැළපෙන සහකරුවන්","ඔබේ වටිනාකම්, සංස්කෘතිය සහ ජීවන අරමුණු බෙදාගන්නා අය හමුවන්න.","හවුල් වටිනාකම්","ජීවන අරමුණු","සංස්කෘතිය","පවුල","සැබෑ ගැළපීම මත ගොඩනැගුණු","අර්ථවත්","සබඳතාවක් ඇරඹේ","හවුල් වටිනාකම් දෙදෙනෙකු එක් කළ විට සංවාදයක් තවත් වර්ධනය විය හැක.","සමාන අරමුණු","සංස්කෘතික ගැළපීම","සැබෑ සංවාද"],
 fr:["De belles personnes","Un avenir radieux","Les belles rencontres commencent par des valeurs partagées, des intentions sincères et la possibilité de grandir ensemble.","Pour des débuts qui comptent","Des personnes faites pour votre avenir","Découvrez","Des profils compatibles","Rencontrez des personnes qui partagent vos valeurs, votre culture et vos projets de vie.","Valeurs communes","Projets de vie","Culture","Famille","Fondé sur une vraie compatibilité","Une belle","Histoire commence","Lorsque des valeurs communes rapprochent deux personnes, une conversation peut devenir bien plus.","Objectifs similaires","Affinités culturelles","Échanges authentiques"],
 nl:["Goede mensen","Een mooie toekomst","Betekenisvolle ontmoetingen beginnen met gedeelde waarden, oprechte bedoelingen en ruimte om samen te groeien.","Voor een betekenisvol begin","Mensen die bij jouw toekomst passen","Ontdek","Passende matches","Ontmoet mensen die jouw waarden, cultuur en levensdoelen delen.","Gedeelde waarden","Levensdoelen","Cultuur","Familie","Gebaseerd op echte compatibiliteit","Een betekenisvolle","Band begint","Wanneer gedeelde waarden twee mensen samenbrengen, kan een gesprek uitgroeien tot iets moois.","Vergelijkbare doelen","Culturele aansluiting","Echte gesprekken"],
 de:["Gute Menschen","Eine strahlende Zukunft","Bedeutungsvolle Begegnungen beginnen mit gemeinsamen Werten, ehrlichen Absichten und Raum, gemeinsam zu wachsen.","Für einen bedeutungsvollen Anfang","Menschen, die zu deiner Zukunft passen","Entdecke","Passende Partner","Lerne Menschen kennen, die deine Werte, Kultur und Lebensziele teilen.","Gemeinsame Werte","Lebensziele","Kultur","Familie","Auf echter Kompatibilität aufgebaut","Eine bedeutungsvolle","Verbindung beginnt","Wenn gemeinsame Werte zwei Menschen zusammenbringen, kann aus einem Gespräch mehr werden.","Ähnliche Ziele","Kulturelle Übereinstimmung","Echte Gespräche"]
} as const;
export function PremiumOpeningStory(){
 const oc=openingCopy[useI18n().language];
 const {language}=useI18n();
 const hero=getMessages(language).hero;
 const {ref:openingRef,p:openingP}=useProgress();
 const heroExit=phase(openingP,.03,.22);
 const profiles=[
  {name:"Nila, 27",place:"London, UK",src:"/images/profiles/nila.jpg?v=1"},
  {name:"Tharshini, 27",place:"London, UK",src:"/images/profiles/tharshini.jpg?v=1"},
  {name:"Kavya, 28",place:"London, UK",src:"/images/profiles/kavya.jpg?v=1"},
  {name:"Vishal, 29",place:"London, UK",src:"/images/profiles/vishal.jpg?v=1"},
 ];
 return <section className="bg-[#FFFDFB]">
  <article ref={openingRef} className="homepage-story-card relative grid min-h-[calc(100svh-7rem)] items-center gap-8 overflow-hidden px-5 py-6 lg:grid-cols-[minmax(440px,.9fr)_minmax(560px,1.1fr)] lg:gap-16 lg:px-[max(5vw,64px)] lg:py-8 xl:mx-auto xl:max-w-[1500px]">
   <div className="story-copy lg:max-w-[620px]" style={{transform:`translate3d(${-heroExit*72}px,${-heroExit*20}px,0)`,opacity:1-heroExit*.88,filter:`blur(${heroExit*3}px)`}}>
    <p className="text-[10px] font-bold uppercase leading-5 tracking-[.27em] text-[#A078B0] lg:text-xs">{hero.eyebrow}<br/>{hero.eyebrow2}</p>
    <div className="mt-3 flex items-end gap-3 lg:mt-4 lg:gap-5">
      <h1 className="font-serif text-[2.7rem] font-semibold leading-[1.02] text-[#2A1845] lg:text-[5.1rem] xl:text-[5.65rem]">{hero.title}<br/><span className="text-[#C026D3]">{hero.titleAccent}</span></h1>
      <Image src="/images/cupidmatch-logo.png" alt="CupidMatch" width={210} height={72} className="mb-1 h-auto w-[108px] object-contain sm:w-[132px] lg:mb-2 lg:w-[180px]" />
     </div>
    <p className="mt-4 max-w-lg text-[12px] leading-5 text-[#65546F] lg:mt-5 lg:text-base lg:leading-7">{hero.description}</p>
    <div className="mt-5 flex justify-between lg:mt-7 lg:max-w-lg lg:justify-start lg:gap-12">{[[Users,hero.verified],[Shield,hero.safe],[Heart,hero.compatibility]].map(([Icon,label]:any,i)=><div key={i} className="story-item w-24 text-center" style={{animationDelay:`${i*70}ms`}}><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED]"><Icon className="h-5 w-5"/></span><span className="mt-2 block whitespace-pre-line text-[10px] font-semibold leading-3 text-[#4C3A5C]">{label}</span></div>)}</div>
    <div className="mt-5 grid gap-2 lg:mt-7 lg:max-w-lg lg:grid-cols-2 lg:gap-3"><Link href="/signup" className="flex h-11 items-center justify-center rounded-full bg-[#7C3AED] text-sm font-semibold text-white shadow-lg">{hero.create} <ArrowRight className="ml-1 h-4 w-4"/></Link><Link href="/discover" className="flex h-11 items-center justify-center rounded-full border border-violet-200 bg-white text-sm font-semibold text-violet-700">{hero.explore}</Link></div>
   </div>
   <div className="story-media relative" style={{transform:`translate3d(${heroExit*-5}%,${heroExit*18}px,0) scale(${1+heroExit*.075})`,transformOrigin:"center center"}}>
    <HeroCarousel className="h-[44svh] min-h-[310px] rounded-[2.25rem] shadow-[0_18px_45px_rgba(76,29,149,.16)] lg:h-[68vh] lg:min-h-[540px] lg:max-h-[720px] lg:rounded-[2.75rem]" priority sizes="(min-width:1024px) 55vw,100vw"/>
    <div className="pointer-events-none absolute -bottom-3 left-1/2 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent" style={{transform:`translateX(-50%) scaleX(${.35+heroExit*.65})`,opacity:.25+heroExit*.65}}/>
   </div>
  </article>

  <article className="homepage-story-card relative grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-16 lg:px-[max(6vw,72px)]">
   <div className="story-copy relative z-10 text-center lg:text-left"><p className="font-script text-[3.25rem] leading-[.98] text-[#C026D3] lg:text-[5.5rem] xl:text-[6.25rem]">{oc[0]}<span className="block lg:ml-14">{oc[1]}</span></p><p className="mx-auto mt-6 max-w-md text-sm leading-6 text-[#6B5A78] lg:mx-0 lg:text-lg lg:leading-8">{oc[2]}</p><div className="mt-7 hidden items-center gap-3 text-sm font-semibold text-violet-700 lg:flex"><span className="h-px w-12 bg-fuchsia-300"/><Heart className="h-5 w-5"/>{oc[3]}</div></div>
   <div className="story-media relative mx-auto h-[58svh] min-h-[420px] w-full max-w-[650px] overflow-hidden rounded-[3rem] shadow-[0_28px_70px_rgba(76,29,149,.18)] lg:h-[70vh] lg:max-h-[690px]"><Image src={HERO_SLIDES[1]} alt="Engaged couple celebrating their connection" fill quality={100} sizes="(min-width:1024px) 50vw,100vw" className="object-cover object-center"/><div className="absolute inset-0 bg-gradient-to-t from-violet-950/10 via-transparent to-fuchsia-50/5"/><svg className="story-line pointer-events-none absolute inset-x-8 top-10 h-28" viewBox="0 0 500 100" fill="none"><path d="M8 60 C110 5 175 95 270 45 C355 0 410 75 492 35" stroke="#D946EF" strokeWidth="3" strokeLinecap="round"/><path d="M458 30c-10-14-27 2 0 23 27-21 10-37 0-23Z" fill="#D946EF"/></svg></div>
  </article>

  <article className="homepage-story-card grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-14 lg:px-[max(6vw,72px)]">
   <div className="story-copy text-center lg:text-left"><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#A078B0] lg:text-xs">{oc[4]}</p><h2 className="mt-3 font-serif text-[2.35rem] font-semibold leading-[1.06] text-[#2A1845] lg:text-[4.5rem]">{oc[5]}<br/><span className="text-[#C026D3]">{oc[6]}</span></h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#6B5A78] lg:mx-0 lg:max-w-md lg:text-lg lg:leading-8">{oc[7]}</p><div className="mt-7 hidden flex-wrap gap-2 lg:flex">{[oc[8],oc[9],oc[10],oc[11]].map(x=><span key={x} className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">{x}</span>)}</div></div>
   <div className="mx-auto grid w-full max-w-[430px] grid-cols-2 gap-3 sm:gap-4 lg:max-w-[980px] lg:grid-cols-4 lg:gap-5">{profiles.map((x,i)=>{return <div key={x.name} className="story-profile story-item flex h-[300px] min-w-0 flex-col overflow-hidden rounded-[1.75rem] border-4 border-white bg-white shadow-[0_18px_45px_rgba(76,29,149,.14)] sm:h-[330px] lg:h-[390px] lg:rounded-[2rem]" style={{animationDelay:`${80+i*100}ms`}}><div className="relative min-h-0 flex-1"><Image src={x.src} alt={x.name} fill sizes="(min-width:1024px) 220px, 45vw" quality={90} className="object-cover object-[center_15%]"/>{i===1&&<span className="absolute bottom-3 right-2 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#C026D3] shadow sm:right-3 sm:text-xs">92% Match</span>}</div><div className="h-[76px] shrink-0 p-3 lg:h-[84px] lg:p-4"><p className="truncate font-serif text-base font-semibold text-[#2A1845] lg:text-xl">{x.name}</p><p className="mt-1 truncate text-xs text-[#75647F]">{x.place}</p></div></div>})}</div>
  </article>

  <article className="homepage-story-card grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-16 lg:px-[max(6vw,72px)] xl:mx-auto xl:max-w-[1500px]">
   <div className="story-copy text-center lg:text-left"><p className="mb-4 text-[10px] font-bold uppercase tracking-[.28em] text-[#A078B0] lg:text-xs">{oc[12]}</p><h2 className="font-serif text-[2.25rem] font-semibold leading-[1.06] text-[#2A1845] lg:text-[4.65rem]">{oc[13]}<br/><span className="text-[#C026D3]">{oc[14]}</span></h2><p className="mt-4 text-sm leading-6 text-[#6B5A78] lg:max-w-lg lg:text-lg lg:leading-8">{oc[15]}</p><div className="mt-7 grid max-w-[430px] grid-cols-2 gap-3 text-sm font-medium text-[#5C4A66]">{[oc[8],oc[16],oc[17],oc[18]].map((x,i)=><div key={x} className="story-item flex items-center gap-2 rounded-2xl border border-violet-100 bg-white px-3 py-3 shadow-sm" style={{animationDelay:`${i*70}ms`}}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[#7C3AED]">✓</span>{x}</div>)}</div></div>
   <div className="story-media relative mx-auto h-[430px] w-full max-w-[430px] lg:h-[620px] lg:max-w-[680px]"><div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,.12),transparent_65%)]"/><svg className="story-line absolute inset-0 h-full w-full" viewBox="0 0 600 600" fill="none"><path d="M160 145 C360 40 445 190 305 285 C175 375 270 505 455 445" stroke="#D946EF" strokeWidth="4" strokeLinecap="round"/></svg><div className="story-portrait absolute left-[8%] top-[6%] h-44 w-44 overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl lg:h-56 lg:w-56"><Image src="/images/values/goals.jpg?v=3" alt="" fill sizes="224px" className="object-cover"/></div><div className="story-portrait story-portrait-delay absolute bottom-[5%] right-[7%] h-44 w-44 overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl lg:h-56 lg:w-56"><Image src="/images/values/culture.jpg?v=3" alt="" fill sizes="224px" className="object-cover"/></div><div className="story-heart absolute left-1/2 top-[46%] flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-[0_16px_45px_rgba(192,38,211,.35)]"><Heart className="h-9 w-9" fill="currentColor"/></div></div>
  </article>
 </section>
}
