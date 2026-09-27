"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Promo={id:string;code_hint:string;duration_months:number;max_redemptions:number;redemption_count:number;expires_at:string|null;is_active:boolean;created_at:string};
export default function PromoCodesClient(){
 const [months,setMonths]=useState(6),[limit,setLimit]=useState(100),[expiry,setExpiry]=useState("");
 const [codes,setCodes]=useState<Promo[]>([]),[created,setCreated]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function load(){try{const r=await fetch("/api/admin/promo-codes",{cache:"no-store"});if(!r.ok)throw Error("Could not load codes");setCodes((await r.json()).codes||[]);}catch(e){setError(e instanceof Error?e.message:"Load failed");}}
 useEffect(()=>{void load();},[]);
 async function create(e:React.FormEvent){e.preventDefault();setBusy(true);setCreated("");setError("");try{const r=await fetch("/api/admin/promo-codes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({durationMonths:months,maxRedemptions:limit,expiresAt:expiry||null})});const data=await r.json();if(!r.ok)throw Error(data.error||"Creation failed");setCreated(data.code);await load();}catch(e){setError(e instanceof Error?e.message:"Creation failed");}finally{setBusy(false);}}
 return <div className="space-y-6">
 <div><p className="text-sm font-semibold text-violet-700">Member growth</p><h1 className="text-3xl font-bold text-slate-900">Special invitation codes</h1><p className="mt-2 text-slate-600">Create limited-use launch codes. New members can enter a code during registration.</p></div>
 <form onSubmit={create} className="grid gap-4 rounded-3xl border bg-white p-6 shadow-sm md:grid-cols-3">
 <label className="text-sm font-medium">Trial duration (months)<Input type="number" min={1} max={24} required value={months} onChange={e=>setMonths(Number(e.target.value))}/></label>
 <label className="text-sm font-medium">Maximum redemptions<Input type="number" min={1} max={100000} required value={limit} onChange={e=>setLimit(Number(e.target.value))}/></label>
 <label className="text-sm font-medium">Expiry date (optional)<Input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)}/></label>
 <div className="md:col-span-3"><Button disabled={busy} type="submit">{busy?"Creating…":"Generate secure code"}</Button></div>
 </form>
 {created&&<div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-semibold">New code — copy it now; it will not be shown again</p><p className="my-3 break-all font-mono text-xl">{created}</p><Button variant="outline" onClick={()=>void navigator.clipboard.writeText(created)}>Copy code</Button></div>}
 {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
 <div className="overflow-x-auto rounded-3xl border bg-white p-5"><h2 className="mb-4 text-xl font-semibold">Generated codes</h2><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-3">Code hint</th><th className="p-3">Months</th><th className="p-3">Used / Limit</th><th className="p-3">Expires</th><th className="p-3">Status</th></tr></thead><tbody>{codes.map(c=><tr className="border-b" key={c.id}><td className="p-3 font-mono">{c.code_hint}</td><td className="p-3">{c.duration_months}</td><td className="p-3">{c.redemption_count} / {c.max_redemptions}</td><td className="p-3">{c.expires_at?new Date(c.expires_at).toLocaleDateString():"No expiry"}</td><td className="p-3">{c.is_active?"Active":"Disabled"}</td></tr>)}</tbody></table>{codes.length===0&&<p className="p-4 text-slate-500">No codes created yet.</p>}</div>
 <p className="text-sm text-amber-800">Code creation is active. Redemption and automatic trial extensions are being implemented separately; do not distribute codes until redemption is enabled.</p>
 </div>;
}