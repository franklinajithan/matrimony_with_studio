"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {CreditCard,LockKeyhole,AlertCircle,ArrowLeft} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {COUNTRY_MARKETS,formatMarketMoney,isCountryCode,type CountryCode} from "@/lib/subscriptions/country-markets";
import {monthlyAllowanceLabels,type CataloguePlan} from "@/lib/subscriptions/catalogue-data";

type Term="monthly"|"three_months"|"six_months";
type ProviderState={provider:string;configured:boolean;checkoutEnabled:boolean;webhookEnabled:boolean};
const TERM_LABEL:Record<Term,string>={monthly:"Monthly",three_months:"3 months",six_months:"6 months"};

export function SecureCheckoutExperience(){
 const params=useSearchParams();
 const requestedCountry=params.get("country")??"GB";
 const country:CountryCode=isCountryCode(requestedCountry)?requestedCountry:"GB";
 const requestedPlan=params.get("plan");
 const plan=requestedPlan==="plus"||requestedPlan==="premium"?requestedPlan:null;
 const requestedTerm=params.get("term");
 const term:Term=requestedTerm==="three_months"||requestedTerm==="six_months"?requestedTerm:"monthly";
 const [plans,setPlans]=useState<CataloguePlan[]>([]);
 const [provider,setProvider]=useState<ProviderState|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [accepted,setAccepted]=useState(false);
 const [submitting,setSubmitting]=useState(false);
 const [consent,setConsent]=useState(false);
 const [attemptError,setAttemptError]=useState("");
 useEffect(()=>{
  let active=true;
  const controller=new AbortController();
  setLoading(true);setError("");setAttemptError("");
  Promise.all([
   fetch(`/api/plans?country=${country}`,{cache:"no-store",signal:controller.signal}),
   fetch("/api/billing/provider-state",{cache:"no-store",signal:controller.signal})
  ]).then(async ([catalogue,readiness])=>{
   if(!catalogue.ok||!readiness.ok)throw Error("Membership prices or payment readiness could not be loaded.");
   const [prices,status]=await Promise.all([catalogue.json(),readiness.json()]);
   if(!Array.isArray(prices.plans)||!status||typeof status.checkoutEnabled!=="boolean")throw Error("Checkout configuration is incomplete.");
   if(active){setPlans(prices.plans);setProvider(status);}
  }).catch(()=>{if(active)setError("Unable to verify live membership pricing. Refresh this page before continuing.");})
    .finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;controller.abort();};
 },[country]);
 const selected=plans.find(x=>x.code===plan);
 const quote=selected?.pricesPence[term]??null;
 const ready=Boolean(provider?.configured&&provider.checkoutEnabled&&provider.webhookEnabled&&country==="GB"&&term==="monthly");
 const price=selected?formatMarketMoney(quote,selected.currency):"—";
 async function beginCheckout(){
  setAttemptError("");
  if(!ready)return;
  if(!selected||quote==null||!accepted||!consent)return;
  setSubmitting(true);
  try{
   const response=await fetch("/api/billing/checkout",{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({plan:selected.code,term})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||typeof result.url!=="string")throw Error(result.error||"Secure card checkout is not ready.");
   const url=new URL(result.url);
   if(url.protocol!=="https:" || url.hostname!=="checkout.stripe.com")throw Error("The payment provider did not return a valid Stripe Checkout URL.");
   window.location.assign(url.href);
  }catch(e){setAttemptError(e instanceof Error?e.message:"Checkout is unavailable. No payment was taken.");}
  finally{setSubmitting(false);}
 }
 return <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
  <Link href="/launch-pricing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4"/> Back to plan comparison</Link>
  <div className="mt-6 max-w-3xl space-y-2">
   <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary"><LockKeyhole className="h-3.5 w-3.5"/> Stripe-hosted secure checkout</div>
   <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Complete your CupidMatch membership</h1>
   <p className="text-muted-foreground">Review the membership and recurring amount, then pay securely on Stripe when checkout is available.</p>
  </div>
  <div className="mx-auto mt-8 max-w-2xl space-y-5">
   <div className="space-y-6">
    <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Your selected membership</h2><Link href="/launch-pricing" className="text-sm font-semibold text-primary underline">Change plan</Link></div>
      {loading?<p role="status">Checking membership price…</p>:error?<p role="alert" className="text-sm text-destructive">{error}</p>:!selected?<p role="alert" className="text-sm text-destructive">Choose a valid paid plan to continue. <Link className="underline" href="/launch-pricing">Compare plans</Link></p>:<>
      <div className="flex items-center justify-between gap-4"><div><p className="text-xl font-bold">{selected.name}</p><p className="text-sm text-muted-foreground">{TERM_LABEL[term]} · {COUNTRY_MARKETS.find(x=>x.code===country)?.name}</p></div><strong className="text-2xl text-primary">{price}</strong></div>
      <ul aria-label="Monthly membership allowances" className="space-y-1 text-sm">
       {monthlyAllowanceLabels(selected.entitlements).map(label => <li key={label}>{label}</li>)}
      </ul>
      {term!=="monthly"&&<p role="status" className="text-sm text-amber-800">Only monthly Stripe subscriptions are supported right now. <Link className="underline" href="/launch-pricing">Select a monthly plan</Link>.</p>}
      {country!=="GB"&&<p role="status" className="text-sm text-amber-800">Stripe checkout is currently available only for the UK GBP market. Your local price is for information only.</p>}
      <p className="text-xs text-muted-foreground">The final recurring amount is confirmed on Stripe before any card is charged.</p>
      </>}
    </section>
    <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
     <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Secure card payment</h2><span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">Final step</span></div>
     <div className="flex items-start gap-3 rounded-xl border bg-accent/20 p-4">
       <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
       <div className="space-y-1">
         <p className="font-semibold">Pay securely with Stripe Checkout</p>
         <p className="text-sm text-muted-foreground">When payments are enabled, continue to Stripe to enter your card number, expiry date, security code and billing details. CupidMatch never receives or stores your full card number or CVV.</p>
       </div>
     </div>
     {!ready&&<div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>Card payments are not available yet. Your card will not be charged on CupidMatch.</div>}
     <label className="flex items-start gap-3 text-sm"><Checkbox checked={accepted} onCheckedChange={v=>setAccepted(v===true)} className="mt-0.5"/><span>I accept the <Link href="/terms" className="underline text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline text-primary">Privacy Policy</Link>.</span></label>
     <label className="flex items-start gap-3 text-sm"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)} className="mt-0.5"/><span>I understand this is a recurring monthly subscription billed through Stripe until I cancel it. Paid access starts only after Stripe confirms payment.</span></label>
     {attemptError&&<p className="text-sm text-destructive" role="alert">{attemptError}</p>}
     <Button className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-center text-sm leading-5 sm:text-base" disabled={!ready||loading||!selected||!accepted||!consent||submitting||quote==null} onClick={()=>void beginCheckout()}>
       <LockKeyhole className="mr-2 h-4 w-4"/>{ready?`Continue to secure payment · ${price}`:"Secure Stripe checkout — not enabled yet"}
     </Button>
    </section>
   </div>
  </div>
 </main>;
}
