"use client";
import {useEffect,useState} from "react";
export type DisplayCurrency="GBP"|"EUR"|"USD";
export type RateSnapshot={base:"GBP";rates:{GBP:number;EUR:number;USD:number};asOf:string;source:string;displayOnly:true;checkoutCurrency:"GBP"};
export function usePriceCurrency(){
 const [currency,setCurrency]=useState<DisplayCurrency>("GBP");
 const [rates,setRates]=useState<RateSnapshot|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{
   const controller=new AbortController();
   fetch("/api/pricing/fx",{signal:controller.signal}).then(async response=>{
     const data=await response.json();
     if(!response.ok)throw Error(data.error||"FX unavailable");
     if(data.base!=="GBP"||data.checkoutCurrency!=="GBP"||!Number.isFinite(data.rates?.EUR)||!Number.isFinite(data.rates?.USD))throw Error("Invalid FX data");
     if(!controller.signal.aborted)setRates(data);
   }).catch(()=>{if(!controller.signal.aborted)setError("EUR/USD estimates unavailable; GBP prices are authoritative.");});
   return()=>controller.abort();
 },[]);
 function format(pence:number|null){
   if(pence===null)return "Not offered";
   const rate=currency==="GBP"?1:rates?.rates[currency];
   if(rate==null)return new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(pence/100);
   return new Intl.NumberFormat("en-GB",{style:"currency",currency}).format((pence/100)*rate);
 }
 return {currency,setCurrency,rates,error,format,canConvert:Boolean(rates)};
}
