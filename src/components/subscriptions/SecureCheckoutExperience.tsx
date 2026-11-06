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
 const [billingEmail,setBillingEmail]=useState("");
 const [billingName,setBillingName]=useState("");
 const [postalCode,setPostalCode]=useState("");
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
 const ready=provider?.configured&&provider.checkoutEnabled&&provider.webhookEnabled;
 const price=selected?formatMarketMoney(quote,selected.currency):"—";
 const perMonth=quote!=null&&selected?formatMarketMoney(Math.round(quote/TERM_COUNT[term]),selected.currency):"—";
 async function beginCheckout(){
  setAttemptError("");
  if(!ready)return;
  if(!selected||quote==null||!accepted||!consent||!billingEmail.trim()||!billingName.trim())return;
  setSubmitting(true);
  try{
   const response=await fetch("/api/billing/checkout",{method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({plan:selected.code,term,country,billing:{name:billingName.trim(),email:billingEmail.trim(),postalCode:postalCode.trim()},consent:true})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||typeof result.url!=="string")throw Error(result.error||"Secure card checkout is not ready.");
   const url=new URL(result.url);
   if(url.protocol!=="https:")throw Error("The payment provider did not return a secure checkout URL.");
   window.location.assign(url.href);
  }catch(e){setAttemptError(e instanceof Error?e.message:"Checkout is unavailable. No payment was taken.");}
  finally{setSubmitting(false);}
 }
 return <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
  <Link href="/membership" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4"/> Back to memberships</Link>
  <div className="mt-6 max-w-3xl space-y-2">
   <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary"><LockKeyhole className="h-3.5 w-3.5"/> Protected checkout preparation</div>
   <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Complete your CupidMatch membership</h1>
   <p className="text-muted-foreground">Review the plan, confirm your billing details, then pay securely through an approved payment provider.</p>
  </div>
  <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
   <div className="space-y-6">
    <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
     <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">1. Membership details</h2><span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">Step 1 of 3</span></div>
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
      <p className="text-xs text-muted-foreground">{marketActive?"Admin-approved local market price.":"No approved local market override; UK GBP base prices apply."} Your country selection is for the displayed quote, not proof of billing residency.</p>
     </>}
    </section>
    <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
     <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">2. Billing details</h2><span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">Step 2 of 3</span></div>
     <p className="text-xs text-muted-foreground">These details are entered for checkout preparation only. They are not sent or saved while payment integration is disabled.</p>
     <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Full name
       <input autoComplete="name" value={billingName} onChange={e=>setBillingName(e.target.value)} maxLength={120} placeholder="Name on your billing account" className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"/>
      </label>
      <label className="text-sm font-medium">Billing email
       <input type="email" autoComplete="email" value={billingEmail} onChange={e=>setBillingEmail(e.target.value)} maxLength={254} placeholder="you@example.com" className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"/>
      </label>
     </div>
     <label className="block text-sm font-medium">Billing postcode / ZIP (optional)
      <input autoComplete="postal-code" value={postalCode} onChange={e=>setPostalCode(e.target.value)} maxLength={24} placeholder="Postal code" className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"/>
     </label>
    </section>
    <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
     <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">3. Card payment</h2><span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">Step 3 of 3</span></div>
     <div className="flex items-center gap-2 text-sm font-medium"><CreditCard className="h-5 w-5 text-primary"/> Credit or debit card <span className="ml-auto text-xs text-muted-foreground">Visa · Mastercard</span></div>
     <div className="space-y-3 rounded-xl border border-dashed bg-accent/20 p-4">
       <div className="flex items-center justify-between"><span className="text-sm font-semibold text-primary">Secure provider-hosted card fields</span><LockKeyhole className="h-4 w-4 text-primary"/></div>
       <div className="space-y-2">
        <div><span className="mb-1 block text-xs text-muted-foreground">Card number</span><div className="flex h-11 items-center rounded-lg border bg-background px-3 text-sm text-muted-foreground" aria-label="Card number entry unavailable until merchant approval">•••• •••• •••• ••••</div></div>
        <div className="grid grid-cols-2 gap-3">
         <div><span className="mb-1 block text-xs text-muted-foreground">Expiry date</span><div className="flex h-11 items-center rounded-lg border bg-background px-3 text-sm text-muted-foreground">MM / YY</div></div>
         <div><span className="mb-1 block text-xs text-muted-foreground">Security code</span><div className="flex h-11 items-center rounded-lg border bg-background px-3 text-sm text-muted-foreground">•••</div></div>
        </div>
       </div>
       <p className="text-xs text-muted-foreground">These are display-only placeholders—not card-entry controls. Once Tide approves an eligible checkout product, the secure payment provider will handle real card details. CupidMatch will not store card numbers or CVV.</p>
     </div>
     {!ready&&<div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>Card checkout is awaiting merchant approval and technical verification. No payment can be made or charged now.</div>}
     <label className="flex items-start gap-3 text-sm"><Checkbox checked={accepted} onCheckedChange={v=>setAccepted(v===true)} className="mt-0.5"/><span>I accept the <Link href="/terms" className="underline text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline text-primary">Privacy Policy</Link>.</span></label>
     <label className="flex items-start gap-3 text-sm"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)} className="mt-0.5"/><span>I understand the selected plan and amount must be confirmed by a secure payment provider before any paid membership is activated.</span></label>
     {attemptError&&<p className="text-sm text-destructive" role="alert">{attemptError}</p>}
     <Button className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-center text-sm leading-5 sm:text-base" disabled={!ready||loading||!selected||!accepted||!consent||submitting||quote==null||!billingEmail||!billingName} onClick={()=>void beginCheckout()}>
       <LockKeyhole className="mr-2 h-4 w-4"/>{ready?`Continue to secure payment · ${price}`:"Secure card checkout — awaiting Tide approval"}
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
