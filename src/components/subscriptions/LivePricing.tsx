"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {planBenefitLabels,type CataloguePlan} from "@/lib/subscriptions/catalogue-data";
import {usePriceCurrency} from "@/hooks/use-price-currency";
import {CurrencyPreviewSelector} from "./CurrencyPreviewSelector";

export function LivePricing(){
 const [plans,setPlans]=useState<CataloguePlan[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
 const fx=usePriceCurrency();
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError(false);
  void fetch("/api/plans",{cache:"no-store",signal:controller.signal}).then(async response=>{
   const body=await response.json();if(!response.ok||!Array.isArray(body.plans))throw Error("Unavailable");
   if(!controller.signal.aborted)setPlans(body.plans);
  }).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[reload]);
 return <section className="space-y-5" aria-label="Current membership prices">
 <CurrencyPreviewSelector currency={fx.currency} onChange={fx.setCurrency} rates={fx.rates} error={fx.error}/>
 {loading?<p role="status">Loading current plans…</p>:error?<div className="space-y-3"><p role="alert">Current membership prices are unavailable.</p><Button variant="outline" onClick={()=>setReload(n=>n+1)}>Retry</Button></div>:!plans.length?<p>Membership plans are unavailable.</p>:
 <div className="grid gap-4 md:grid-cols-3">
 {plans.map(plan=><article key={plan.code} className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm">
  <div><h2 className="text-2xl font-bold">{plan.name}</h2><p className="mt-2 text-3xl font-bold text-primary">{fx.format(plan.pricesPence.monthly)}<span className="text-sm font-normal text-muted-foreground">{plan.code==="free"?"":" / month"}</span></p></div>
  <p className="text-xs text-muted-foreground">{plan.code==="free"?"Free membership; no card needed.":fx.currency==="GBP"?"Price is quoted in GBP.":"Estimated converted price; checkout is quoted in GBP."}</p>
  <dl className="space-y-1 text-sm">{plan.pricesPence.three_months!==null&&<div><dt className="inline">3 months: </dt><dd className="inline font-semibold">{fx.format(plan.pricesPence.three_months)}</dd></div>}{plan.pricesPence.six_months!==null&&<div><dt className="inline">6 months: </dt><dd className="inline font-semibold">{fx.format(plan.pricesPence.six_months)}</dd></div>}</dl>
  <ul className="flex-1 space-y-2 text-sm">{planBenefitLabels(plan.entitlements,8).map((label)=><li key={label}>✓ {label}</li>)}</ul>
  <Button asChild><Link href="/onboarding?step=7">{plan.code==="free"?"Select Free":"Choose "+plan.name}</Link></Button>
 </article>)}
 </div>}
 <p className="text-xs text-muted-foreground">Prices and included benefits come from the single CupidMatch catalogue. Payment checkout is not yet available; no membership will be charged or granted without verified payment.</p>
 </section>;
}
