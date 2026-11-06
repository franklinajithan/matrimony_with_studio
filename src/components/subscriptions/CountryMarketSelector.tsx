"use client";
import {COUNTRY_MARKETS,type CountryCode} from "@/lib/subscriptions/country-markets";
export function CountryMarketSelector({country,onChange}:{country:CountryCode;onChange:(country:CountryCode)=>void}){
 return <label className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-accent/30 p-3 text-sm font-semibold">
  Country / market
  <select className="min-h-11 min-w-[180px] rounded-lg border bg-background px-3" value={country} onChange={e=>onChange(e.target.value as CountryCode)} aria-label="Country for membership prices">
    {COUNTRY_MARKETS.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}
  </select>
 </label>;
}
