import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
interface LogoProps { className?: string; size?: LogoSize; iconSize?: number; textSize?: string; textColor?: string; href?: string; invert?: boolean; }
function resolveSize(size:LogoSize|undefined,iconSize:number|undefined):LogoSize{if(size)return size;if(typeof iconSize==="number"){if(iconSize<=24)return"sm";if(iconSize>=40)return"lg";}return"md";}
const SIZE_CLASS:Record<LogoSize,string>={sm:"w-36 sm:w-40",md:"w-44 sm:w-48 md:w-[13rem]",lg:"w-48 sm:w-56 md:w-64"};

export function Logo({className,size,iconSize,textColor,href="/",invert=false}:LogoProps){
 const resolved=resolveSize(size,iconSize); const onDark=invert||Boolean(textColor?.includes("white"));
 return <Link href={href} className={cn("inline-flex max-w-full shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2",SIZE_CLASS[resolved],className)} aria-label="CupidMatch home">
  <span className={cn("flex w-full items-center gap-1.5 whitespace-nowrap",onDark&&"brightness-0 invert")}>
   <svg viewBox="0 0 64 58" aria-hidden="true" className="h-[2.7rem] w-[3rem] shrink-0 overflow-visible">
    <defs><linearGradient id="goldLogo" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#F4D06F"/><stop offset=".48" stopColor="#C99532"/><stop offset="1" stopColor="#9D6514"/></linearGradient><linearGradient id="purpleLogo" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#3B1768"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs>
    <path d="M31 18C22 6 7 10 7 23c0 13 16 23 24 30 8-7 24-17 24-30 0-13-15-17-24-5Z" fill="url(#purpleLogo)"/>
    <circle cx="22" cy="8" r="5.2" fill="url(#goldLogo)"/><path d="M22 14c-8 4-11 11-10 20M22 16c8 2 14 8 17 16" fill="none" stroke="url(#goldLogo)" strokeWidth="4.6" strokeLinecap="round"/>
    <path d="M16 10C6 2 0 8 5 17c2-5 6-7 11-7ZM27 8c7-8 15-5 15 4-5-3-10-3-15-4Z" fill="url(#goldLogo)"/>
    <path d="M35 19c10-8 17-4 21 2M55 21c-2 7-7 12-14 15" fill="none" stroke="#C99532" strokeWidth="2"/><path d="M39 25l20-7-6 6 7 2Z" fill="#C99532"/>
   </svg>
   <span className="relative leading-none">
    <span className="font-serif text-[1.7rem] font-semibold tracking-[-.055em] text-[#3B1768]">Cupid</span><span className="font-serif text-[1.7rem] font-semibold tracking-[-.055em] text-[#C99532]">Match</span>
    <span className="absolute -bottom-[9px] left-0 right-0 border-t border-[#C99532]/70 pt-[3px] text-center font-serif text-[6px] font-semibold tracking-[.32em] text-[#6B214E]">MATRIMONY</span>
   </span>
  </span>
 </Link>;
}
