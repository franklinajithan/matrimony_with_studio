"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {CreditCard,LockKeyhole,ShieldCheck,CheckCircle2,AlertCircle,ArrowLeft} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {COUNTRY_MARKETS,formatMarketMoney,isCountryCode,type CountryCode} from "@/lib/subscriptions/country-markets";
import {planBenefitLabels,type CataloguePlan} from "@/lib/subscriptions/catalogue-data";
import {CountryMarketSelector} from "@/components/subscriptions/CountryMarketSelector";

type Term="monthly"|"three_months"|"six_months";
type ProviderState={provider:string;configured:boolean;checkoutEnabled:boolean;webhookEnabled:boolean};
const TERM_LABEL:Record<Term,string>={monthly:"Monthly",three_months:"3 months",six_months:"6 months"};
const TERM_COUNT:Record<Term,number>={monthly:1,three_months:3,six_months:6};

export function SecureCheckoutExperience(){
 const params=useSearchParams();
 const requestedCountry=params.get("country")??"GB";
 const [country,setCountry]=useState<CountryCode>(isCountryCode(requestedCountry)?requestedCountry:"GB");
 const requestedPlan=params.get("plan");
 const [plan,setPlan]=useState(requestedPlan==="premium"?"premium":"plus");
 const requestedTerm=params.get("term");
 const [term,setTerm]=useState<Term>(requestedTerm==="three_months"||requestedTerm==="six_months"?requestedTerm:"monthly");
 const [plans,setPlans]=useState<CataloguePlan[]>([]);
 const [marketActive,setMarketActive]=useState(false);
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
   if(active){setPlans(prices.plans);setMarketActive(Boolean(prices.isOverride));setProvider(status);}
  }).catch(()=>{if(active)setError("Unable to verify live membership pricing. Refresh this page before continuing.");})
    .finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;controller.abort();};
 },[country]);
 const selected=plans.find(x=>x.code===plan);
 const quote=selected?.pricesPence[term]??null;
 const availableTerms:Term[]=["monthly","three_months","six_months"].filter(x=>selected?.pricesPence[x as Term]!=null) as Term[];
 const ready=Boolean(provider?.configured&&provider.checkoutEnabled&&provider.webhookEnabled&&country==="GB"&&term==="monthly");
 const price=selected?formatMarketMoney(quote,selected.currency):"—";
 const perMonth=quote!=null&&selected?formatMarketMoney(Math.round(quote/TERM_COUNT[term]),selected.currency):"—";
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
  <Link href="/membership" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4"/> Back to memberships</Link>
  <div className="mt-6 max-w-3xl space-y-2">
   <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary"><LockKeyhole className="h-3.5 w-3.5"/> Stripe-hosted secure checkout</div>
   <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Complete your CupidMatch membership</h1>
   <p className="text-muted-foreground">Review the membership and recurring amount, then pay securely on Stripe when checkout is available.</p>
  </div>
  <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
   <div className="space-y-6">
    <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
     <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">1. Membership details</h2><span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">Step 1 of 2</span></div>
     <CountryMarketSelector country={country} onChange={setCountry}/>
     {loading?<p role="status">Checking live country pricing…</p>:error?<p role="alert" className="text-sm text-destructive">{error}</p>:<>
      <div className="grid gap-3 sm:grid-cols-2">{plans.filter(x=>x.code==="plus"||x.code==="premium").map(x=><button type="button" key={x.code} onClick={()=>{setPlan(x.code);setTerm("monthly");}} aria-pressed={plan===x.code} className={`rounded-xl border-2 p-4 text-left transition-colors ${plan===x.code?"border-primary bg-accent/40":"border-border hover:border-primary/60"}`}>
       <div className="flex items-center justify-between"><span className="text-lg font-bold">{x.name}</span>{plan===x.code&&<CheckCircle2 className="h-5 w-5 text-primary"/>}</div>
       <span className="mt-2 block text-2xl font-semibold">{formatMarketMoney(x.pricesPence.monthly,x.currency)}</span>
       <span className="text-xs text-muted-foreground">per month</span>
      </button>)}</div>
      <label className="block text-sm font-semibold">Billing period
       <select value={availableTerms.includes(term)?term:"monthly"} onChange={e=>setTerm(e.target.value as Term)} className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3">
        {availableTerms.map(x=><option key={x} value={x}>{TERM_LABEL[x]}</option>)}
       </select>
      </label>
      <p className="text-xs text-muted-foreground">{marketActive?"Admin-approved local market price.":"No approved local market override; UK GBP base prices apply."} Only UK GBP monthly memberships are configured for Stripe at present. Other market quotes are for information only.</p>
     </>}
    </section>
    <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
     <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">2. Secure card payment</h2><span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">Step 2 of 2</span></div>
     <div className="flex items-start gap-3 rounded-xl border bg-accent/20 p-4">
       <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
       <div className="space-y-1">
         <p className="font-semibold">Pay securely with Stripe Checkout</p>
         <p className="text-sm text-muted-foreground">When payments are enabled, continue to Stripe to enter your card number, expiry date, security code and billing details. CupidMatch never receives or stores your full card number or CVV.</p>
       </div>
     </div>
     {!ready&&<div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>Card checkout is awaiting merchant approval and technical verification. No payment can be made or charged on CupidMatch now.</div>}
     <label className="flex items-start gap-3 text-sm"><Checkbox checked={accepted} onCheckedChange={v=>setAccepted(v===true)} className="mt-0.5"/><span>I accept the <Link href="/terms" className="underline text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline text-primary">Privacy Policy</Link>.</span></label>
     <label className="flex items-start gap-3 text-sm"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)} className="mt-0.5"/><span>I understand this is a recurring monthly subscription billed through Stripe until I cancel it. Paid access starts only after Stripe confirms payment.</span></label>
     {attemptError&&<p className="text-sm text-destructive" role="alert">{attemptError}</p>}
     <Button className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-center text-sm leading-5 sm:text-base" disabled={!ready||loading||!selected||!accepted||!consent||submitting||quote==null} onClick={()=>void beginCheckout()}>
       <LockKeyhole className="mr-2 h-4 w-4"/>{ready?`Continue to secure payment · ${price}`:"Secure Stripe checkout — not enabled yet"}
     </Button>
    </section>
   </div>
   <aside className="space-y-5 lg:sticky lg:top-6">
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
     <div className="bg-gradient-to-br from-[#2D1538] to-[#482153] p-5 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-[#E9CF93]">CupidMatch membership</p><h2 className="mt-2 text-2xl font-semibold">Order summary</h2><p className="mt-1 text-xs text-white/80">Your marriage journey, your choice</p></div>
     <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-4"><span>Membership</span><strong>{selected?.name??"—"}</strong></div>
      <div className="flex items-center justify-between gap-4"><span>Billing period</span><strong>{TERM_LABEL[term]}</strong></div>
      <div className="flex items-center justify-between gap-4"><span>Market</span><strong>{COUNTRY_MARKETS.find(x=>x.code===country)?.name}</strong></div>
      <div className="flex items-center justify-between gap-4"><span>Currency</span><strong>{selected?.currency??"GBP"}</strong></div>
      <div className="border-t pt-4"><div className="flex items-baseline justify-between gap-4"><span className="font-semibold">Total amount</span><strong className="text-2xl text-primary">{price}</strong></div>{term!=="monthly"&&<p className="mt-1 text-right text-xs text-muted-foreground">Equivalent to approx. {perMonth}/month for {TERM_COUNT[term]} months</p>}</div>
      {selected&&<ul className="space-y-2 border-t pt-4 text-sm">{planBenefitLabels(selected.entitlements,6).map(benefit=><li key={benefit} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary"/>{benefit}</li>)}</ul>}
      <p className="text-xs text-muted-foreground">Displayed quote only. Checkout currencies, final tax treatment, any recurring terms and actual card payment must be verified before enabling payments.</p>
     </div>
    </section>
    <div className="flex items-start gap-3 rounded-xl border p-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary"/><div><strong>Built for secure checkout</strong><p className="mt-1 text-muted-foreground">Payment credentials belong on the server, and provider confirmation must be verified before granting Plus or Premium.</p></div></div>
   </aside>
  </div>
 </main>;
}
