"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";

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
 const profiles=[
  {name:"Nila, 27",place:"London, UK",src:"/images/profiles/nila.jpg?v=1"},
  {name:"Tharshini, 27",place:"London, UK",src:"/images/profiles/tharshini.jpg?v=1"},
  {name:"Kavya, 28",place:"London, UK",src:"/images/profiles/kavya.jpg?v=1"},
  {name:"Vishal, 29",place:"London, UK",src:"/images/profiles/vishal.jpg?v=1"},
 ];
 return <section className="overflow-x-clip bg-background">
  <article className="studio-hero homepage-story-card">
   <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-32 h-[650px] w-[650px] rounded-full border border-gold/25"/>
   <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 -right-20 h-[650px] w-[650px] rounded-full border border-gold/15"/>
   <div className="studio-hero-copy">
    <p className="text-[10px] font-semibold uppercase leading-5 tracking-[.2em] text-muted-foreground lg:text-xs">{hero.eyebrow}<br/>{hero.eyebrow2}</p>
    <h1 className="mt-5 font-serif text-[clamp(2.5rem,5.4vw,5.25rem)] font-medium leading-[1.06] tracking-tight text-foreground">{hero.title}<br/><span className="text-gold-foreground">{hero.titleAccent}</span></h1>
    <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground lg:mt-6 lg:text-base lg:leading-8">{hero.description}</p>
    <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-4 lg:gap-x-8">
     {[{Icon:Users,label:hero.verified},{Icon:Shield,label:hero.safe},{Icon:Heart,label:hero.compatibility}].map(({Icon,label})=><li key={label} className="flex max-w-[145px] items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="h-6 w-6 shrink-0 stroke-[1.3] text-gold-foreground" aria-hidden="true"/>{label}</li>)}
    </ul>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
     <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-white shadow-[0_8px_24px_hsl(var(--primary)/.15)] transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">{hero.create}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true"/></Link>
     <Link href="/discover" className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/45 bg-background px-7 text-sm font-semibold text-primary transition hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">{hero.explore}</Link>
    </div>
   </div>
   <div className="studio-hero-portrait">
    <Image src="/images/hero-studio-elegance-refined.webp" alt="Studio portrait of a couple, with the man in a purple suit and the woman in an ivory sari" fill priority quality={90} sizes="(min-width: 1536px) 850px, (min-width: 1024px) 60vw, (min-width: 640px) 90vw, 100vw" className="studio-hero-image"/>
    <div aria-hidden="true" className="studio-hero-blend"/>
   </div>
  </article>

  <article className="homepage-story-card relative grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-16 lg:px-[max(6vw,72px)]">
   <div className="story-copy relative z-10 text-center lg:text-left"><p className="font-script text-[3.25rem] leading-[.98] text-primary lg:text-[5.5rem] xl:text-[6.25rem]">{oc[0]}<span className="block lg:ml-14">{oc[1]}</span></p><p className="mx-auto mt-6 max-w-md text-sm leading-6 text-muted-foreground lg:mx-0 lg:text-lg lg:leading-8">{oc[2]}</p><div className="mt-7 hidden items-center gap-3 text-sm font-semibold text-primary lg:flex"><span className="h-px w-12 bg-gold"/><Heart className="h-5 w-5"/>{oc[3]}</div></div>
   <div className="story-media relative mx-auto aspect-[6/5] w-full max-w-[813px] overflow-hidden rounded-[3rem] shadow-[0_28px_70px_hsl(var(--primary)/.18)]"><Image src="/images/couple-studio-connection.webp" alt="Couple smiling at each other, wearing a royal purple suit and an ivory sari with gold embroidery" fill quality={90} sizes="(min-width:1536px) 813px, (min-width:1024px) 50vw,100vw" className="object-cover object-center"/><div className="absolute inset-0 bg-gradient-to-t from-primary-dark/10 via-transparent to-accent/5"/><svg className="story-line pointer-events-none absolute inset-x-8 top-10 h-28" viewBox="0 0 500 100" fill="none"><path d="M8 60 C110 5 175 95 270 45 C355 0 410 75 492 35" stroke="hsl(var(--gold))" strokeWidth="3" strokeLinecap="round"/><path d="M458 30c-10-14-27 2 0 23 27-21 10-37 0-23Z" fill="hsl(var(--gold))"/></svg></div>
  </article>

  <article className="homepage-story-card grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-14 lg:px-[max(6vw,72px)]">
   <div className="story-copy text-center lg:text-left"><p className="text-[10px] font-bold uppercase tracking-[.28em] text-gold-foreground lg:text-xs">{oc[4]}</p><h2 className="mt-3 font-serif text-[2.35rem] font-semibold leading-[1.06] text-primary-dark lg:text-[4.5rem]">{oc[5]}<br/><span className="text-primary">{oc[6]}</span></h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground lg:mx-0 lg:max-w-md lg:text-lg lg:leading-8">{oc[7]}</p><div className="mt-7 hidden flex-wrap gap-2 lg:flex">{[oc[8],oc[9],oc[10],oc[11]].map(x=><span key={x} className="rounded-full border border-border bg-accent px-4 py-2 text-sm font-semibold text-primary">{x}</span>)}</div></div>
   <div className="mx-auto grid w-full max-w-[430px] grid-cols-2 gap-3 sm:gap-4 lg:max-w-[980px] lg:grid-cols-4 lg:gap-5">{profiles.map((x,i)=>{return <div key={x.name} className="story-profile story-item flex h-[300px] min-w-0 flex-col overflow-hidden rounded-[1.75rem] border-4 border-white bg-card shadow-[0_18px_45px_hsl(var(--primary)/.14)] sm:h-[330px] lg:h-[390px] lg:rounded-[2rem]" style={{animationDelay:`${80+i*100}ms`}}><div className="relative min-h-0 flex-1"><Image src={x.src} alt={x.name} fill sizes="(min-width:1024px) 220px, 45vw" quality={90} className="object-cover object-[center_15%]"/></div><div className="h-[76px] shrink-0 p-3 lg:h-[84px] lg:p-4"><p className="truncate font-serif text-base font-semibold text-primary-dark lg:text-xl">{x.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{x.place}</p></div></div>})}</div>
  </article>

  <article className="homepage-story-card grid items-center gap-8 overflow-hidden px-5 py-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-16 lg:px-[max(6vw,72px)] xl:mx-auto xl:max-w-[1500px]">
   <div className="story-copy text-center lg:text-left"><p className="mb-4 text-[10px] font-bold uppercase tracking-[.28em] text-gold-foreground lg:text-xs">{oc[12]}</p><h2 className="font-serif text-[2.25rem] font-semibold leading-[1.06] text-primary-dark lg:text-[4.65rem]">{oc[13]}<br/><span className="text-primary">{oc[14]}</span></h2><p className="mt-4 text-sm leading-6 text-muted-foreground lg:max-w-lg lg:text-lg lg:leading-8">{oc[15]}</p><div className="mt-7 grid max-w-[430px] grid-cols-2 gap-3 text-sm font-medium text-muted-foreground">{[oc[8],oc[16],oc[17],oc[18]].map((x,i)=><div key={x} className="story-item flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm" style={{animationDelay:`${i*70}ms`}}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-primary">✓</span>{x}</div>)}</div></div>
   <div className="story-media relative mx-auto h-[430px] w-full max-w-[430px] lg:h-[620px] lg:max-w-[680px]"><div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/.12),transparent_65%)]"/><svg className="story-line absolute inset-0 h-full w-full" viewBox="0 0 600 600" fill="none"><path d="M160 145 C360 40 445 190 305 285 C175 375 270 505 455 445" stroke="hsl(var(--gold))" strokeWidth="4" strokeLinecap="round"/></svg><div className="story-portrait absolute left-[8%] top-[6%] h-44 w-44 overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-elevated lg:h-56 lg:w-56"><Image src="/images/values/goals.jpg?v=3" alt="" fill sizes="224px" className="object-cover"/></div><div className="story-portrait story-portrait-delay absolute bottom-[5%] right-[7%] h-44 w-44 overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-elevated lg:h-56 lg:w-56"><Image src="/images/values/culture.jpg?v=3" alt="" fill sizes="224px" className="object-cover"/></div><div className="story-heart absolute left-1/2 top-[46%] flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold text-white shadow-[0_16px_45px_hsl(var(--primary)/.30)]"><Heart className="h-9 w-9" fill="currentColor"/></div></div>
  </article>
 </section>
}
