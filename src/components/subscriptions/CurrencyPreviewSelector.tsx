"use client";
import type {DisplayCurrency,RateSnapshot} from "@/hooks/use-price-currency";
export function CurrencyPreviewSelector({currency,onChange,rates,error}:{
 currency:DisplayCurrency;onChange:(value:DisplayCurrency)=>void;rates:RateSnapshot|null;error:string;
}){
 return <div className="space-y-2 rounded-xl border bg-accent/30 p-3">
  <label className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
   Display prices in
   <select aria-label="Display currency" className="min-h-11 rounded-lg border bg-background px-3" value={currency} onChange={e=>onChange(e.target.value as DisplayCurrency)}>
    <option value="GBP">GBP — British pound</option>
    <option value="EUR" disabled={!rates}>EUR — Euro {rates?"(estimate)":""}</option>
    <option value="USD" disabled={!rates}>USD — US dollar {rates?"(estimate)":""}</option>
   </select>
  </label>
  {rates?<p className="text-xs text-muted-foreground">ECB reference estimates ({rates.asOf}): £1 ≈ €{rates.rates.EUR.toFixed(4)} / $ {rates.rates.USD.toFixed(4)}. GBP is the checkout currency. Your card provider may apply a different rate and fees.</p>:
   <p className="text-xs text-muted-foreground">{error||"Loading EUR/USD reference rates…"} All charges are currently priced in GBP.</p>}
 </div>;
}
