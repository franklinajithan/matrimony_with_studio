"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {planBenefitLabels,type CataloguePlan} from "@/lib/subscriptions/catalogue-data";
import {formatMarketMoney,type CountryCode} from "@/lib/subscriptions/country-markets";
import {CountryMarketSelector} from "./CountryMarketSelector";

export function LivePricing({signedIn=false}:{signedIn?:boolean}){
 const [plans,setPlans]=useState<CataloguePlan[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
 const [country,setCountry]=useState<CountryCode>("GB");
 const [isOverride,setIsOverride]=useState(false);
 const [currency,setCurrency]=useState("GBP");
 const [checkoutEnabled,setCheckoutEnabled]=useState<boolean | null>(null);
 useEffect(() => {
  const controller = new AbortController();
  void fetch("/api/billing/provider-state", { cache: "no-store", signal: controller.signal })
   .then(async response => {
    if (!response.ok) throw Error("Checkout status unavailable");
    const state = await response.json();
    if (!controller.signal.aborted) setCheckoutEnabled(
     typeof state.checkoutEnabled === "boolean" ? state.checkoutEnabled : null
    );
   })
   .catch(() => { if (!controller.signal.aborted) setCheckoutEnabled(null); });
  return () => controller.abort();
 }, [reload]);
 useEffect(() => {
  const refresh = () => setReload(value => value + 1);
  window.addEventListener("focus", refresh);
  return () => window.removeEventListener("focus", refresh);
 }, []);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError(false);
  void fetch(`/api/plans?country=${country}`,{cache:"no-store",signal:controller.signal}).then(async response=>{
   const body=await response.json();if(!response.ok||!Array.isArray(body.plans))throw Error("Unavailable");
   if(!controller.signal.aborted){setPlans(body.plans);setIsOverride(Boolean(body.isOverride));setCurrency(body.currency||"GBP");}
  }).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[reload,country]);
 return <section className="space-y-5" aria-label="Current membership prices">
 <CountryMarketSelector country={country} onChange={setCountry}/>
 <p className="text-xs text-muted-foreground">{isOverride?`Admin-approved local prices in ${currency}. Available payment methods depend on the current checkout status.`:"No active local override for this country; showing UK GBP base prices."}</p>
 {loading?<p role="status">Loading current plans…</p>:error?<div className="space-y-3"><p role="alert">Current membership prices are unavailable.</p><Button variant="outline" onClick={()=>setReload(n=>n+1)}>Retry</Button></div>:!plans.length?<p>Membership plans are unavailable.</p>:
 <div className="grid gap-4 md:grid-cols-3">
 {plans.map(plan=><article key={plan.code} className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm">
  <div><h2 className="text-2xl font-bold">{plan.name}</h2><p className="mt-2 text-3xl font-bold text-primary">{formatMarketMoney(plan.pricesPence.monthly,plan.currency)}<span className="text-sm font-normal text-muted-foreground">{plan.code==="free"?"":" / month"}</span></p></div>
  {plan.code==="free" && <p className="text-xs text-muted-foreground">Free membership requires no card.</p>}
  <dl className="space-y-1 text-sm">{plan.pricesPence.three_months!==null&&<div><dt className="inline">3 months: </dt><dd className="inline font-semibold">{formatMarketMoney(plan.pricesPence.three_months,plan.currency)}</dd></div>}{plan.pricesPence.six_months!==null&&<div><dt className="inline">6 months: </dt><dd className="inline font-semibold">{formatMarketMoney(plan.pricesPence.six_months,plan.currency)}</dd></div>}</dl>
  <ul className="flex-1 space-y-2 text-sm">{planBenefitLabels(plan.entitlements,8).map((label)=><li key={label}>✓ {label}</li>)}</ul>
  <Button asChild><Link href={signedIn?(plan.code==="free"?"/membership":`/checkout?plan=${encodeURIComponent(plan.code)}&term=monthly&country=${country}`):`/signup?plan=${encodeURIComponent(plan.code)}&country=${country}`}>{plan.code==="free"?(signedIn?"Current membership":"Select Free"):"Choose "+plan.name}</Link></Button>
 </article>)}
 </div>}
 <p className="text-xs text-muted-foreground" role="status">
  {country !== "GB" ? "Paid checkout is supported for UK monthly plans in GBP. Prices for other markets are for comparison."
   : checkoutEnabled === true ? "Secure Stripe checkout is available for UK monthly plans. Paid membership starts after payment is verified."
   : checkoutEnabled === false ? "Paid checkout is currently unavailable. Free membership is available."
   : "Checkout availability will be confirmed before payment."}
 </p>
 </section>;
}
