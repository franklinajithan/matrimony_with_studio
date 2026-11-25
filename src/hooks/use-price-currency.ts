"use client";
import {useEffect,useState} from "react";
export type DisplayCurrency="GBP"|"EUR"|"USD";
export type RateSnapshot={base:"GBP";rates:{GBP:number;EUR:number;USD:number};asOf:string;source:string;displayOnly:true;checkoutCurrency:"GBP"};
const FX_TTL_MS = 15 * 60_000;
let cachedRates: { value: RateSnapshot; expires: number } | null = null;
let pendingRates: Promise<RateSnapshot> | null = null;
function loadRates(): Promise<RateSnapshot> {
 if (cachedRates && cachedRates.expires > Date.now()) return Promise.resolve(cachedRates.value);
 if (pendingRates) return pendingRates;
 pendingRates = fetch("/api/pricing/fx", { signal: AbortSignal.timeout(10000) }).then(async response => {
   const data = await response.json();
   if (!response.ok) throw Error(data.error || "FX unavailable");
   if (data.base !== "GBP" || data.checkoutCurrency !== "GBP" || !Number.isFinite(data.rates?.EUR) || !Number.isFinite(data.rates?.USD)) throw Error("Invalid FX data");
   cachedRates = { value: data, expires: Date.now() + FX_TTL_MS };
   return data as RateSnapshot;
 }).finally(() => { pendingRates = null; });
 return pendingRates;
}
export function usePriceCurrency(){
 const [currency,setCurrency]=useState<DisplayCurrency>("GBP");
 const [rates,setRates]=useState<RateSnapshot|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{
   let active = true;
   loadRates().then(data => { if (active) setRates(data); })
     .catch(() => { if (active) setError("EUR/USD estimates unavailable; GBP prices are authoritative."); });
   return () => { active = false; };
 },[]);
 function format(pence:number|null){
   if(pence===null)return "Not offered";
   const rate=currency==="GBP"?1:rates?.rates[currency];
   if(rate==null)return new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(pence/100);
   return new Intl.NumberFormat("en-GB",{style:"currency",currency}).format((pence/100)*rate);
 }
 return {currency,setCurrency,rates,error,format,canConvert:Boolean(rates)};
}
