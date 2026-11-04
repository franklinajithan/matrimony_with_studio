"use client";

import {useCallback,useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
import {formatCataloguePrice,parsePrice} from "@/lib/subscriptions/catalogue-data";
import {usePriceCurrency} from "@/hooks/use-price-currency";
import {CurrencyPreviewSelector} from "./CurrencyPreviewSelector";

type Entitlement = boolean | number | null;
type PlanRow = {
 code:string; name:string; currency:string; monthly_price_pence:number;
 three_month_price_pence:number|null; six_month_price_pence:number|null;
 is_active:boolean; entitlements:Record<string,Entitlement>; updated_at:string;
};
const descriptions:Record<string,string>={
 interestsPerMonth:"Interests per month",messagesPerMonth:"Messages per month",profileViewsPerMonth:"Profile views per month",searchPlacement:"Priority search placement (0, 10, or 20)",profileSharesPerMonth:"Biodata / profile shares per month",
 biodataTemplates:"Available biodata templates",profileBoostsPerMonth:"Profile boosts per month",
 advancedFilters:"Advanced search filters",seeWhoLikesYou:"See who likes you",
 unlimitedMessaging:"Unlimited messaging where permitted",readReceipts:"Message read receipts",
 familyIntroduction:"Family introductions",fullHoroscope:"Full horoscope compatibility",
 premiumBadge:"Premium badge",prioritySupport:"Priority support",
};
function money(value:number|null){return value===null?"":(value/100).toFixed(2);}
export function AdminPricingEditor(){
 const fx=usePriceCurrency();
 const [plans,setPlans]=useState<PlanRow[]>([]);
 const [edits,setEdits]=useState<Record<string,PlanRow>>({});
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const reload=useCallback(async()=>{
   setLoading(true);setError("");
   try{
     const response=await fetch("/api/admin/plans",{cache:"no-store",credentials:"same-origin"});
     const result=await response.json();
     if(!response.ok||!Array.isArray(result.plans))throw Error(result.error||"Unable to load plans");
     setPlans(result.plans);setEdits(Object.fromEntries(result.plans.map((p:PlanRow)=>[p.code,structuredClone(p)])));
   }catch(e){setError(e instanceof Error?e.message:"Unable to load plans");}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 function update(code:string,patch:Partial<PlanRow>){setEdits(old=>({...old,[code]:{...old[code],...patch}}));}
 function entitlement(code:string,key:string,value:Entitlement){update(code,{entitlements:{...edits[code].entitlements,[key]:value}});}
 async function save(code:string){
  const draft=edits[code],original=plans.find(p=>p.code===code);
  if(!draft||!original)return;
  if(!confirm(`Save pricing and feature changes for ${draft.name}? Changes will immediately affect public plan displays and future membership eligibility.`))return;
  setSaving(code);setError("");setNotice("");
  try{
    const r=await fetch("/api/admin/plans",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({
       code,monthlyPricePence:draft.monthly_price_pence,
       threeMonthPricePence:draft.three_month_price_pence,
       sixMonthPricePence:draft.six_month_price_pence,
       entitlements:draft.entitlements,expectedUpdatedAt:original.updated_at
    })});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(data.error||"Unable to save");
    setNotice(`${draft.name} updated. The public catalogue now uses these values.`);
    await reload();
  }catch(e){setError(e instanceof Error?e.message:"Unable to update");}
  finally{setSaving("");}
 }
 if(loading)return <p role="status">Loading current production prices…</p>;
 return <div className="space-y-5">
   <p className="text-sm text-muted-foreground">GBP is the source of truth. Changes are audited. Keep paid feature promises consistent with implemented member permissions; changes to entitlement JSON cannot add new product features by themselves.</p>
   {error&&<p role="alert" className="rounded-xl border border-destructive p-3 text-destructive">{error}</p>}
   {notice&&<p role="status" className="rounded-xl border p-3">{notice}</p>}
   <CurrencyPreviewSelector currency={fx.currency} onChange={fx.setCurrency} rates={fx.rates} error={fx.error}/>
   <Button variant="outline" onClick={()=>void reload()}>Reload production catalogue</Button>
   <div className="grid gap-5 xl:grid-cols-3">
   {plans.map(plan=>{
     const v=edits[plan.code];if(!v)return null;
     const priceFields:[keyof PlanRow,string][]=[["monthly_price_pence","Monthly price (£)"],["three_month_price_pence","Three months (£)"],["six_month_price_pence","Six months (£)"]];
     return <section key={plan.code} className="space-y-4 rounded-2xl border bg-card p-5">
       <div><h2 className="text-xl font-bold">{plan.name}</h2><p className="text-sm text-muted-foreground">Current: {formatCataloguePrice(plan.monthly_price_pence,plan.currency)}/month · {fx.format(plan.monthly_price_pence)} {fx.currency!=="GBP"?"(estimate)":""}</p><p className="text-xs text-muted-foreground">Last updated {new Date(plan.updated_at).toLocaleString("en-GB")}</p></div>
       <div className="space-y-3">{priceFields.map(([key,label])=>{
         const vPrice=v[key] as number|null;
         return <label key={key} className="block text-sm font-medium">{label}
           <input type="number" min="0" max="10000" step="0.01" disabled={plan.code==="free"} value={money(vPrice)} placeholder="Not offered" onChange={e=>{
             try{
               const parsed=parsePrice(e.target.value);
               update(plan.code,{[key]:parsed===null?(key==="monthly_price_pence"?0:null):parsed} as Partial<PlanRow>);
             }catch{setError("Enter valid GBP prices with no more than two decimal places.");}
           }} className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3" />
         </label>;
       })}</div>
       <div className="space-y-3 border-t pt-3">
         <h3 className="font-semibold">Included benefits & limits</h3>
         {Object.entries(v.entitlements).map(([key,value])=><div key={key} className="flex items-center justify-between gap-3 text-sm">
           <label htmlFor={`${plan.code}-${key}`} className="flex-1">{descriptions[key]||key.replace(/([A-Z])/g," $1")}</label>
           {typeof value==="boolean"?<input id={`${plan.code}-${key}`} type="checkbox" checked={value} onChange={e=>entitlement(plan.code,key,e.target.checked)} className="h-5 w-5" />:
           <select id={`${plan.code}-${key}`} aria-label={descriptions[key]||key} className="max-w-32 rounded-md border bg-background p-2" value={value===null?"unlimited":String(value)} onChange={e=>entitlement(plan.code,key,e.target.value==="unlimited"?null:Number(e.target.value))}>
             <option value="unlimited">Unlimited</option>{[0,1,2,3,5,10,20,30,50,100,400].map(n=><option key={n} value={n}>{n}</option>)}
             {value!==null&&![0,1,2,3,5,10,20,30,50,100,400].includes(value)&&<option value={value}>{value}</option>}
           </select>}
         </div>)}
       </div>
       <Button onClick={()=>void save(plan.code)} disabled={Boolean(saving)||plan.code==="free"} className="w-full">{saving===plan.code?"Saving…":"Save plan & features"}</Button>
     </section>;
   })}
   </div>
   <p className="text-xs text-muted-foreground">Changes affect future plan quotes, not historical receipts. Paid purchases still require an enabled, verified payment provider; saving a plan never activates checkout.</p>
 </div>;
}
