"use client";
import {useRef,useState,type FormEvent} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {parsePrice} from "@/lib/subscriptions/catalogue-data";
type Plan={code:string;currency:string;updatedAt:string;monthly_price_pence:number;three_month_price_pence:number|null;six_month_price_pence:number|null};
const text=(value:number|null)=>value===null?"":(value/100).toFixed(2);
export function PriceEditor({plan,onSaved}:{plan:Plan;onSaved:()=>void}){
 const [open,setOpen]=useState(false),[monthly,setMonthly]=useState(text(plan.monthly_price_pence)),[three,setThree]=useState(text(plan.three_month_price_pence)),[six,setSix]=useState(text(plan.six_month_price_pence)),[reason,setReason]=useState(""),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");const lock=useRef(false);
 const change=(setter:(value:string)=>void,value:string)=>{setter(value);setConfirm(false);setError("");};
 async function save(event:FormEvent){event.preventDefault();if(lock.current)return;setError("");
  let prices;try{prices={monthly:parsePrice(monthly),three_months:parsePrice(three),six_months:parsePrice(six)};if(prices.monthly===null)throw Error("A monthly price is required.");if(reason.trim().length<10)throw Error("Give a reason of at least 10 characters.");if(prices.monthly===plan.monthly_price_pence&&prices.three_months===plan.three_month_price_pence&&prices.six_months===plan.six_month_price_pence)throw Error("Change at least one price.");}catch(err){setError(err instanceof Error?err.message:"Check the prices.");return;}
  if(!confirm){setConfirm(true);return;}
  lock.current=true;setBusy(true);
  try{const response=await fetch("/api/admin/plans",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:plan.code,expectedUpdatedAt:plan.updatedAt,prices,reason:reason.trim()})});const body=await response.json();if(!response.ok)throw Error(body.error||"Could not save prices");setOpen(false);onSaved();}
  catch(err){setConfirm(false);setError(err instanceof Error?err.message:"Could not save prices");}finally{lock.current=false;setBusy(false);}
 }
 if(!open)return <Button variant="outline" disabled={!plan.updatedAt} onClick={()=>setOpen(true)}>Edit catalogue prices</Button>;
 return <form onSubmit={event=>void save(event)} className="space-y-3 rounded-xl border bg-accent p-4"><p className="text-sm">Amounts in {plan.currency}. Blank multi-month terms are not configured. These changes update the public catalogue, not existing charges.</p>{([["monthly","1 month",monthly,setMonthly],["three","3 months",three,setThree],["six","6 months",six,setSix]] as const).map(([key,label,value,setter])=><div key={key}><Label htmlFor={`${plan.code}-${key}`}>{label}</Label><Input id={`${plan.code}-${key}`} inputMode="decimal" value={value} disabled={busy} onChange={event=>change(setter,event.target.value)}/></div>)}<Label htmlFor={`${plan.code}-reason`}>Reason for audit</Label><Textarea id={`${plan.code}-reason`} value={reason} maxLength={500} disabled={busy} onChange={event=>change(setReason,event.target.value)}/>{confirm&&<p role="status" className="text-sm font-semibold">Confirm publishing these catalogue prices. Existing subscriptions and provider prices will not change.</p>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy?"Saving…":confirm?"Confirm price change":"Review price change"}</Button><Button type="button" variant="outline" disabled={busy} onClick={()=>{setOpen(false);setConfirm(false);setError("");}}>Cancel</Button></div></form>;
}
