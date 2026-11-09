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
type PlanChange = { id: string; actor_id: string | null; target_id: string; created_at: string; metadata: { before?: PlanRow; after?: PlanRow } };
const featureDefaults: Record<string, Record<string, Entitlement>> = {
 free: { interestsPerMonth: 2, messagesPerMonth: 2, profileViewsPerMonth: 50, searchPlacement: 0, profileHighlighting: false, advancedFilters: false },
 plus: { interestsPerMonth: 30, messagesPerMonth: 30, profileViewsPerMonth: 400, searchPlacement: 20, profileHighlighting: true, advancedFilters: true },
 premium: { interestsPerMonth: null, messagesPerMonth: null, profileViewsPerMonth: null, searchPlacement: 10, profileHighlighting: true, advancedFilters: true },
};
const descriptions:Record<string,string>={
 interestsPerMonth:"Interests per month",messagesPerMonth:"Messages per month",profileViewsPerMonth:"Profile views per month",searchPlacement:"Priority search placement (0, 10, or 20)",profileSharesPerMonth:"Biodata / profile shares per month",
 biodataTemplates:"Available biodata templates",profileBoostsPerMonth:"Profile boosts per month",
 profileHighlighting:"Profile highlighting",advancedFilters:"Advanced search filters",seeWhoLikesYou:"See who likes you",
 unlimitedMessaging:"Unlimited messaging where permitted",readReceipts:"Message read receipts",
 familyIntroduction:"Family introductions",fullHoroscope:"Full horoscope compatibility",
 premiumBadge:"Premium badge",prioritySupport:"Priority support",
};
function money(value:number|null){return value===null?"":(value/100).toFixed(2);}
export function AdminPricingEditor(){
 const fx=usePriceCurrency();
 const [history, setHistory] = useState<PlanChange[]>([]);
 const [plans,setPlans]=useState<PlanRow[]>([]);
 const [edits,setEdits]=useState<Record<string,PlanRow>>({});
 const [priceInputs,setPriceInputs]=useState<Record<string,Record<string,string>>>({});
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
     setHistory(result.history ?? []);
     setPlans(result.plans);setEdits(Object.fromEntries(result.plans.map((p:PlanRow)=>[p.code,structuredClone(p)])));
     setPriceInputs(Object.fromEntries(result.plans.map((p:PlanRow)=>[p.code,{monthly_price_pence:money(p.monthly_price_pence),three_month_price_pence:money(p.three_month_price_pence),six_month_price_pence:money(p.six_month_price_pence)}])));
   }catch(e){setError(e instanceof Error?e.message:"Unable to load plans");}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{void reload()},[reload]);
 function update(code:string,patch:Partial<PlanRow>){setEdits(old=>({...old,[code]:{...old[code],...patch}}));}
 function entitlement(code:string,key:string,value:Entitlement){update(code,{entitlements:{...edits[code].entitlements,[key]:value}});}
 async function save(code:string){
  const draft=edits[code],original=plans.find(p=>p.code===code);
  if(!draft||!original)return;
  let monthly:number|null,three:number|null,six:number|null;
  try{
    monthly=parsePrice(priceInputs[code]?.monthly_price_pence??money(draft.monthly_price_pence));
    three=parsePrice(priceInputs[code]?.three_month_price_pence??money(draft.three_month_price_pence));
    six=parsePrice(priceInputs[code]?.six_month_price_pence??money(draft.six_month_price_pence));
    if(monthly===null || (code!=="free"&&monthly<1) || (code==="free"&&monthly!==0))
       throw Error("Enter a valid monthly GBP price.");
  }catch(e){setError(e instanceof Error?e.message:"Invalid price");return;}
  if (Object.values(draft.entitlements).some(value => typeof value === "number" && (!Number.isInteger(value) || value < 0 || value > 100000))) {
    setError("Enter whole-number limits between 0 and 100,000, or leave the field blank for unlimited.");
    return;
  }
  if(!confirm(`Save pricing and feature changes for ${draft.name}? This updates all live quotes and future membership allowances.`))return;
  setSaving(code);setError("");setNotice("");
  try{
    const r=await fetch("/api/admin/plans",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({
       code,monthlyPricePence:monthly,
       threeMonthPricePence:three,
       sixMonthPricePence:six,
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
           <input type="text" inputMode="decimal" disabled={plan.code==="free"}
              value={priceInputs[plan.code]?.[key]??money(vPrice)} placeholder="Not offered"
              onChange={e=>setPriceInputs(previous=>({...previous,[plan.code]:{...previous[plan.code],[key]:e.target.value}}))}
              className="mt-1 min-h-11 w-full rounded-lg border bg-background px-3" />
         </label>;
       })}</div>
       <div className="space-y-3 border-t pt-3">
         <h3 className="font-semibold">Included benefits & limits</h3>
         {Object.entries(v.entitlements).map(([key,value])=><div key={key} className="flex items-center justify-between gap-3 text-sm">
           <label htmlFor={`${plan.code}-${key}`} className="flex-1">{descriptions[key]||key.replace(/([A-Z])/g," $1")}</label>
           {key==="searchPlacement"?<select id={`${plan.code}-${key}`} aria-label="Search placement" className="rounded-md border bg-background p-2" value={value===null?"0":String(value)} onChange={e=>entitlement(plan.code,key,Number(e.target.value))}>
            <option value="0">Normal</option><option value="20">Top 20 priority</option><option value="10">Top 10 priority</option>
           </select>:typeof value==="boolean"?<input id={`${plan.code}-${key}`} type="checkbox" checked={value} onChange={e=>entitlement(plan.code,key,e.target.checked)} className="h-5 w-5" />:
           <input id={`${plan.code}-${key}`} type="number" min={0} max={100000} step={1}
             value={value ?? ""} placeholder="Unlimited" className="w-28 rounded-md border bg-background p-2"
             onChange={e=>entitlement(plan.code,key,e.target.value === "" ? null : e.target.valueAsNumber)}/>}
         </div>)}
       </div>
       <p className="text-xs text-muted-foreground">Leave a limit blank for unlimited. Set it to zero to disable the allowance.</p>
       <details>
         <summary className="cursor-pointer text-sm font-medium">Preview membership benefits</summary>
         <ul className="mt-2 space-y-1 text-sm">
           {Object.keys(featureDefaults[plan.code] ?? {}).filter(key => key in v.entitlements).map(key => {
             const value = v.entitlements[key];
             return <li key={key}>{descriptions[key]} · {value === null ? "Unlimited" : typeof value === "boolean" ? value ? "Enabled" : "Disabled" : key === "searchPlacement" ? value ? `Top ${value}` : "Normal" : value}</li>;
           })}
         </ul>
       </details>
       {featureDefaults[plan.code] && <Button variant="outline" className="w-full" disabled={Boolean(saving)} onClick={()=>{
         const defaults = Object.entries(featureDefaults[plan.code]).filter(([key]) => key in v.entitlements);
         update(plan.code, { entitlements: { ...v.entitlements, ...Object.fromEntries(defaults) } });
       }}>Load feature defaults</Button>}
       <Button onClick={()=>void save(plan.code)} disabled={Boolean(saving)} className="w-full">{saving===plan.code?"Saving…":"Save plan & features"}</Button>
     </section>;
   })}
   </div>
   <section className="space-y-2 rounded-2xl border bg-card p-5">
     <h2 className="font-semibold">Recent plan changes</h2>
     {history.length === 0 && <p className="text-sm text-muted-foreground">No recorded changes.</p>}
     {history.map(change => {
       const before = change.metadata.before;
       const after = change.metadata.after;
       const changed = Object.keys(after?.entitlements ?? {}).filter(key => before?.entitlements[key] !== after?.entitlements[key]);
       return <details key={change.id} className="border-t py-2 text-sm">
         <summary className="cursor-pointer">{change.target_id} · {new Date(change.created_at).toLocaleString("en-GB")}</summary>
         <p className="break-all text-muted-foreground">Administrator {change.actor_id ?? "Account removed"}</p>
         {changed.map(key => <p key={key}>{descriptions[key] ?? key} · {String(before?.entitlements[key] ?? "Unlimited")} → {String(after?.entitlements[key] ?? "Unlimited")}</p>)}
       </details>;
     })}
   </section>
   <p className="text-xs text-muted-foreground">Price changes affect future plan quotes. Paid purchases still require an enabled, verified payment provider; saving a plan never activates checkout.</p>
 </div>;
}
