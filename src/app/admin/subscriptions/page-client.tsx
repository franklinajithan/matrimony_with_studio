"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Trial={user_id:string;name:string;email:string|null;starts_at:string;ends_at:string;duration_months:number;promo_code_id:string|null};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default function AdminSubscriptionsClient(){
 const [trials,setTrials]=useState<Trial[]>([]),[memberId,setMemberId]=useState(""),[action,setAction]=useState<"grant"|"extend"|"end">("extend"),[months,setMonths]=useState(3),[reason,setReason]=useState(""),[search,setSearch]=useState(""),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 async function load(){
  setLoading(true);
  try{const r=await fetch("/api/admin/trials",{cache:"no-store"});const body=await r.json();if(!r.ok)throw Error(body.error||"Unable to load trials");setTrials(body.trials||[]);}
  catch(e){setError(e instanceof Error?e.message:"Unable to load trials");}
  finally{setLoading(false);}
 }
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get("memberId");if(id&&uuid.test(id))setMemberId(id);void load();},[]);
 const filtered=useMemo(()=>trials.filter(t=>[t.name,t.email,t.user_id].some(s=>(s||"").toLowerCase().includes(search.toLowerCase()))),[trials,search]);
 const active=trials.filter(t=>new Date(t.ends_at).getTime()>Date.now()).length;
 async function submit(e:FormEvent){e.preventDefault();setError("");setSuccess("");
  if(!uuid.test(memberId)){setError("Enter a valid member ID.");return;}
  if(reason.trim().length<10){setError("Provide an audit reason of at least 10 characters.");return;}
  if(action==="end"&&!window.confirm("End this member's trial now? This action will be recorded in the audit log."))return;
  setBusy(true);
  try{const r=await fetch("/api/admin/trials",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberId,action,months:action==="end"?null:months,reason})});const body=await r.json();if(!r.ok)throw Error(body.error||"Unable to update trial");setSuccess("Trial updated. This action was recorded in the admin audit log.");setReason("");await load();}
  catch(e){setError(e instanceof Error?e.message:"Unable to update trial");}
  finally{setBusy(false);}
 }
 return <div className="space-y-7 pb-12" data-testid="admin-subscriptions">
 <div><p className="text-xs font-bold uppercase tracking-widest text-violet-700">MEMBERSHIP OPERATIONS</p><h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Trial control centre</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Grant, extend or end introductory memberships with a required reason and permanent audit entry. Payment-provider subscriptions remain separate.</p></div>
 <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Loaded trial records</p><p className="mt-2 text-3xl font-bold">{trials.length}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Active trials (loaded)</p><p className="mt-2 text-3xl font-bold text-emerald-700">{active}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">Special-code trials (loaded)</p><p className="mt-2 text-3xl font-bold text-violet-700">{trials.filter(t=>!!t.promo_code_id).length}</p></div></div>
 <form onSubmit={submit} className="space-y-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-7">
 <div><h2 className="text-xl font-bold">Adjust a member's trial</h2><p className="mt-1 text-sm text-slate-500">Choose an existing member below or paste a member ID from the Members directory.</p></div>
 <label className="block space-y-2 text-sm font-semibold">Member ID<Input required value={memberId} onChange={e=>setMemberId(e.target.value.trim())} placeholder="Member UUID" data-testid="trial-member-id"/></label>
 <fieldset className="space-y-2"><legend className="text-sm font-semibold">Action</legend><div className="grid gap-2 sm:grid-cols-3">{(["grant","extend","end"] as const).map(value=><label key={value} className={`cursor-pointer rounded-xl border p-3 text-sm ${action===value?"border-violet-600 bg-violet-50 text-violet-800":"border-slate-200"}`}><input type="radio" className="mr-2 accent-violet-700" checked={action===value} onChange={()=>setAction(value)}/>{value==="grant"?"Grant new trial":value==="extend"?"Extend trial":"End trial"}</label>)}</div></fieldset>
 {action!=="end"&&<label className="block space-y-2 text-sm font-semibold">Months to {action==="grant"?"grant":"add"}<Input type="number" min={1} max={12} required value={months} onChange={e=>setMonths(Number(e.target.value))}/></label>}
 <label className="block space-y-2 text-sm font-semibold">Reason for audit<textarea required minLength={10} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explain why this member's access is being changed…" className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-violet-500"/></label>
 <p className="text-xs text-slate-500">Changes require admin permission. You cannot change your own trial, modify another administrator's trial or grant access to a member without a verified mobile number.</p>
 <Button disabled={busy} type="submit" className={action==="end"?"bg-red-700 hover:bg-red-800":""}>{busy?"Saving…":action==="end"?"End member trial":"Save trial change"}</Button>
 {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
 </form>
 <section className="rounded-3xl border bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Member trials</h2><p className="text-xs text-slate-500">Latest 200 records by expiry. Counts are for loaded records only.</p></div><Button variant="outline" disabled={loading} onClick={()=>void load()}>Refresh</Button></div>
 <Input aria-label="Search trials" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email or member ID" className="mb-4"/>
 {loading?<p className="p-5 text-slate-500">Loading trial records…</p>:filtered.length===0?<p className="p-5 text-slate-500">No matching trial records.</p>:<div className="grid gap-3 md:grid-cols-2">{filtered.map(t=>{const live=new Date(t.ends_at).getTime()>Date.now();return <div key={t.user_id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold">{t.name}</h3><p className="truncate text-xs text-slate-500">{t.email||t.user_id}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${live?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{live?"Active":"Ended"}</span></div><p className="mt-3 text-sm text-slate-600">{t.duration_months} months · {t.promo_code_id?"Special code":"Standard / admin"}</p><p className="mt-1 text-sm text-slate-600">Ends {new Date(t.ends_at).toLocaleDateString("en-GB")}</p><Button className="mt-3" size="sm" variant="outline" onClick={()=>{setMemberId(t.user_id);setAction(live?"extend":"extend");window.scrollTo({top:0,behavior:"smooth"});}}>Manage membership</Button></div>})}</div>}
 </section></div>;
}
