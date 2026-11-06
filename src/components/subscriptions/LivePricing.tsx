"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {planBenefitLabels,type CataloguePlan} from "@/lib/subscriptions/catalogue-data";
import {formatMarketMoney,type CountryCode} from "@/lib/subscriptions/country-markets";
import {CountryMarketSelector} from "./CountryMarketSelector";

export function LivePricing(){
 const [plans,setPlans]=useState<CataloguePlan[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
 const [country,setCountry]=useState<CountryCode>("GB");
 const [isOverride,setIsOverride]=useState(false);
 const [currency,setCurrency]=useState("GBP");
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError(false);
  void fetch(`/api/plans?country=${country}`,{cache:"no-store",signal:controller.signal}).then(async response=>{
   const body=await response.json();if(!response.ok||!Array.isArray(body.plans))throw Error("Unavailable");
   if(!controller.signal.aborted){setPlans(body.plans);setIsOverride(Boolean(body.isOverride));setCurrency(body.currency||"GBP");}
  }).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[reload,country]);
 return <section className="space-y-5" aria-label="Current membership prices">
 <CountryMarketSelector country={country} onChange={setCountry}/>
 <p className="text-xs text-muted-foreground">{isOverride?`Admin-approved local prices in ${currency}. Payment checkout is not yet available.`:"No active local override for this country; showing UK GBP base prices."}</p>
 {loading?<p role="status">Loading current plans…</p>:error?<div className="space-y-3"><p role="alert">Current membership prices are unavailable.</p><Button variant="outline" onClick={()=>setReload(n=>n+1)}>Retry</Button></div>:!plans.length?<p>Membership plans are unavailable.</p>:
 <div className="grid gap-4 md:grid-cols-3">
 {plans.map(plan=><article key={plan.code} className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm">
  <div><h2 className="text-2xl font-bold">{plan.name}</h2><p className="mt-2 text-3xl font-bold text-primary">{formatMarketMoney(plan.pricesPence.monthly,plan.currency)}<span className="text-sm font-normal text-muted-foreground">{plan.code==="free"?"":" / month"}</span></p></div>
  <p className="text-xs text-muted-foreground">{plan.code==="free"?"Free membership; no card needed.":isOverride?"Country-specific displayed price; card checkout is not currently enabled.":"The GBP base price applies until this country has its own approved market prices."}</p>
  <dl className="space-y-1 text-sm">{plan.pricesPence.three_months!==null&&<div><dt className="inline">3 months: </dt><dd className="inline font-semibold">{formatMarketMoney(plan.pricesPence.three_months,plan.currency)}</dd></div>}{plan.pricesPence.six_months!==null&&<div><dt className="inline">6 months: </dt><dd className="inline font-semibold">{formatMarketMoney(plan.pricesPence.six_months,plan.currency)}</dd></div>}</dl>
  <ul className="flex-1 space-y-2 text-sm">{planBenefitLabels(plan.entitlements,8).map((label)=><li key={label}>✓ {label}</li>)}</ul>
  <Button asChild><Link href={`/signup?plan=${encodeURIComponent(plan.code)}&country=${country}`}>{plan.code==="free"?"Select Free":"Choose "+plan.name}</Link></Button>
 </article>)}
 </div>}
 <p className="text-xs text-muted-foreground">Prices and included benefits come from the single CupidMatch catalogue. Payment checkout is not yet available; no membership will be charged or granted without verified payment.</p>
 </section>;
}
