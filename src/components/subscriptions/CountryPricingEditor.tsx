"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {Button} from "@/components/ui/button";
import {COUNTRY_MARKETS,defaultCountryCurrency,formatMarketMoney,type CountryCode,type MarketCurrency,type CountryPriceRow} from "@/lib/subscriptions/country-markets";
import {parsePrice} from "@/lib/subscriptions/catalogue-data";
import {usePriceCurrency} from "@/hooks/use-price-currency";

const KEYS=["plus_monthly_minor","premium_monthly_minor","plus_three_month_minor","premium_three_month_minor","plus_six_month_minor","premium_six_month_minor"] as const;
type PriceKey=typeof KEYS[number];
const labels:Record<PriceKey,string>={
 plus_monthly_minor:"Plus — monthly",premium_monthly_minor:"Premium — monthly",
 plus_three_month_minor:"Plus — 3 months",premium_three_month_minor:"Premium — 3 months",
 plus_six_month_minor:"Plus — 6 months",premium_six_month_minor:"Premium — 6 months"
};
function decimal(n:number|null|undefined){return n===null||n===undefined?"":(n/100).toFixed(2);}
type Draft={currency:MarketCurrency;enabled:boolean;prices:Record<PriceKey,string>;updatedAt:string|null};
function emptyDraft(code:CountryCode):Draft{
 return {currency:defaultCountryCurrency(code),enabled:false,prices:Object.fromEntries(KEYS.map(k=>[k,""])) as Record<PriceKey,string>,updatedAt:null};
}
function fromRow(r:CountryPriceRow):Draft{return {
 currency:r.currency,enabled:r.enabled,
 prices:Object.fromEntries(KEYS.map(k=>[k,decimal(r[k])])) as Record<PriceKey,string>,
 updatedAt:r.updated_at
};}
export function CountryPricingEditor(){
 const [country,setCountry]=useState<CountryCode>("LK");
 const [rows,setRows]=useState<CountryPriceRow[]>([]);
 const [draft,setDraft]=useState<Draft>(()=>emptyDraft("LK"));
 const [baseline,setBaseline]=useState<{plus:number;premium:number}|null>(null);
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const fx=usePriceCurrency();
 const reload=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [marketResponse,baseResponse]=await Promise.all([
    fetch("/api/admin/country-prices",{cache:"no-store",credentials:"same-origin"}),
    fetch("/api/plans?country=GB",{cache:"no-store"})
   ]);
   const [marketJson,baseJson]=await Promise.all([marketResponse.json(),baseResponse.json()]);
   if(!marketResponse.ok||!Array.isArray(marketJson.markets)||!baseResponse.ok)throw Error("Unable to load central and country pricing");
   const records=marketJson.markets as CountryPriceRow[];
   const plus=baseJson.plans?.find((p:{code:string})=>p.code==="plus")?.pricesPence.monthly;
   const premium=baseJson.plans?.find((p:{code:string})=>p.code==="premium")?.pricesPence.monthly;
   if(!Number.isSafeInteger(plus)||!Number.isSafeInteger(premium))throw Error("GBP base prices unavailable");
   setBaseline({plus,premium});setRows(records);
   setDraft(records.find(x=>x.country_code===country)?fromRow(records.find(x=>x.country_code===country)!):emptyDraft(country));
  }catch(e){setError(e instanceof Error?e.message:"Unable to load markets");}
  finally{setLoading(false);}
 },[country]);
 useEffect(()=>{void reload()},[reload]);
 function choose(c:CountryCode){setCountry(c);setMessage("");setError("");}
 const saved=useMemo(()=>rows.find(row=>row.country_code===country),[rows,country]);
 function suggestedConversion(){
  if(!baseline)return;
  const rate=draft.currency==="GBP"?1:draft.currency==="EUR"?fx.rates?.rates.EUR:draft.currency==="USD"?fx.rates?.rates.USD:undefined;
  if(!rate||!Number.isFinite(rate)){setError("Automatic GBP conversion is available for EUR and USD only. Set other currencies manually.");return;}
  setDraft(current=>({...current,prices:{...current.prices,plus_monthly_minor:(Math.round(baseline.plus*rate)/100).toFixed(2),premium_monthly_minor:(Math.round(baseline.premium*rate)/100).toFixed(2)}}));
  setError("");setMessage("Converted using a reference rate. Review and approve your local prices before enabling the market.");
 }
 async function save(){
  setError("");setMessage("");
  let v:Record<PriceKey,number|null>;
  try{
   v=Object.fromEntries(KEYS.map(k=>[k,parsePrice(draft.prices[k])])) as Record<PriceKey,number|null>;
   if(v.plus_monthly_minor===null||v.premium_monthly_minor===null||v.plus_monthly_minor<1||v.premium_monthly_minor<1)throw Error("Both monthly prices are required and must exceed zero.");
  }catch(e){setError(e instanceof Error?e.message:"Invalid prices");return;}
  if(!confirm(`Save ${COUNTRY_MARKETS.find(x=>x.code===country)?.name} prices in ${draft.currency}? ${draft.enabled?"This market will immediately display these prices.":"This market will remain disabled and use GBP fallback."} Card checkout remains unavailable.`))return;
  setSaving(true);
  try{
   const response=await fetch("/api/admin/country-prices",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    country,currency:draft.currency,enabled:draft.enabled,
    plusMonthly:v.plus_monthly_minor,premiumMonthly:v.premium_monthly_minor,
    plusThree:v.plus_three_month_minor,premiumThree:v.premium_three_month_minor,
    plusSix:v.plus_six_month_minor,premiumSix:v.premium_six_month_minor,
    expectedUpdatedAt:draft.updatedAt
   })});
   const json=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(json.error||"Could not save country prices");
   setMessage("Country prices saved and audited.");await reload();
  }catch(e){setError(e instanceof Error?e.message:"Could not save");}
  finally{setSaving(false);}
 }
 return <section className="space-y-5 rounded-2xl border bg-card p-4 sm:p-6" aria-label="Country pricing management">
  <div><h2 className="text-xl font-bold">Country pricing management</h2>
   <p className="mt-1 text-sm text-muted-foreground">Set independent local prices by market. Disabled or unconfigured countries use the GBP base catalogue. Free always remains free.</p></div>
  {baseline&&<p className="text-sm">UK reference: Plus <strong>{formatMarketMoney(baseline.plus,"GBP")}</strong> · Premium <strong>{formatMarketMoney(baseline.premium,"GBP")}</strong></p>}
  <div className="grid gap-4 sm:grid-cols-2">
   <label className="text-sm font-medium">Country
    <select className="mt-1 w-full rounded-lg border bg-background p-3" value={country} onChange={e=>choose(e.target.value as CountryCode)}>
     {COUNTRY_MARKETS.filter(x=>x.code!=="GB").map(c=><option key={c.code} value={c.code}>{c.name} {rows.some(r=>r.country_code===c.code&&r.enabled)?"(active)":rows.some(r=>r.country_code===c.code)?"(disabled)":"(GBP fallback)"}</option>)}
    </select>
   </label>
   <label className="text-sm font-medium">Local currency
    <select className="mt-1 w-full rounded-lg border bg-background p-3" value={draft.currency} onChange={e=>setDraft(d=>({...d,currency:e.target.value as MarketCurrency}))}>
     {(["GBP","EUR","USD","LKR","INR","CAD","AUD","CHF"] as MarketCurrency[]).map(c=><option key={c} value={c}>{c}</option>)}
    </select>
   </label>
  </div>
  <label className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium">
   <input type="checkbox" className="h-5 w-5" checked={draft.enabled} onChange={e=>setDraft(d=>({...d,enabled:e.target.checked}))}/>
   Enable this market's local prices
  </label>
  <div className="flex flex-wrap items-center gap-3">
   <Button variant="outline" disabled={!baseline||!(draft.currency==="GBP"||draft.currency==="EUR"||draft.currency==="USD")} onClick={suggestedConversion}>Suggest prices from current GBP rates</Button>
   <span className="text-xs text-muted-foreground">Optional conversion only. Manual prices are authoritative after saving.</span>
  </div>
  <div className="grid gap-4 sm:grid-cols-2">
   {KEYS.map((k,i)=><label key={k} className="text-sm font-medium">{labels[k]} ({draft.currency}){i>=2&&<span className="font-normal text-muted-foreground"> · optional</span>}
    <input type="text" inputMode="decimal" placeholder={i>=2?"Not offered":"Required"} className="mt-1 w-full rounded-lg border bg-background p-3"
     value={draft.prices[k]} onChange={e=>setDraft(d=>({...d,prices:{...d.prices,[k]:e.target.value}}))} />
   </label>)}
  </div>
  <p className="text-xs text-muted-foreground">Last saved: {saved?.updated_at?new Date(saved.updated_at).toLocaleString("en-GB"):"Not configured"}. Changes are audited. Existing receipts are unaffected.</p>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  {message&&<p role="status" className="text-sm text-foreground">{message}</p>}
  <Button disabled={loading||saving} onClick={()=>void save()}>{saving?"Saving market…":"Save country prices"}</Button>
  <p className="text-xs text-muted-foreground">Country prices are currently display-only: a suitable payment gateway must be enabled before charging cards in local currencies. No country selection activates a payment.</p>
 </section>;
}
