"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {formatCataloguePrice,type CataloguePlan} from "@/lib/subscriptions/catalogue-data";
const labels:Record<string,string>={advancedFilters:"Advanced matching filters",fullCompatibility:"Full compatibility",seeWhoLikesYou:"See who liked you",seeProfileVisitors:"Profile visitors",incognitoMode:"Incognito controls",prioritySupport:"Priority support"};
export function LivePricing(){
 const [plans,setPlans]=useState<CataloguePlan[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError(false);setPlans([]);
  void fetch("/api/plans",{cache:"no-store",signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok||!Array.isArray(body.plans))throw Error("Unavailable");if(!controller.signal.aborted)setPlans(body.plans);}).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();
 },[reload]);
 return <section className="space-y-5" aria-label="Current membership prices">
 <p className="rounded-xl border bg-accent p-4 text-sm">Choose Premium and enjoy 6 months free. No card required and no automatic charges. Paid memberships are coming later.</p>
 {loading?<p role="status">Loading current prices…</p>:error?<div className="space-y-3"><p role="alert">Current prices are unavailable. Please try again.</p><Button variant="outline" onClick={()=>setReload(value=>value+1)}>Retry prices</Button></div>:!plans.length?<p>No membership plans are currently listed.</p>:<div className="grid gap-5 md:grid-cols-3">{plans.map(plan=><article key={plan.code} className="flex flex-col space-y-4 rounded-3xl border bg-card p-6"><h2 className="text-2xl font-bold">{plan.name}</h2>{plan.code==="premium"?<p className="text-3xl font-bold text-primary">Free for 6 months</p>:<><p className="text-3xl font-bold text-primary">{formatCataloguePrice(plan.pricesPence.monthly,plan.currency)}<span className="text-sm font-normal"> / month</span></p><dl className="space-y-2 text-sm"><div><dt className="inline">3 months: </dt><dd className="inline">{formatCataloguePrice(plan.pricesPence.three_months,plan.currency)}</dd></div><div><dt className="inline">6 months: </dt><dd className="inline">{formatCataloguePrice(plan.pricesPence.six_months,plan.currency)}</dd></div></dl></>}<ul className="flex-1 space-y-2 text-sm">{Object.entries(labels).filter(([key])=>plan.entitlements[key]===true).map(([key,label])=><li key={key}>{label}</li>)}</ul><Button asChild variant="outline"><Link href={plan.code==="premium"?"/membership":"/signup"}>{plan.code==="premium"?"Choose Premium — 6 months free":"Create your account"}</Link></Button></article>)}</div>}
 </section>;
}
