"use client";
import { useEffect,useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Event={id:string;actor_id:string|null;action:string;target_type:string;target_id:string|null;created_at:string};
type Filters={action:string;target:string;actor:string;from:string;to:string};
const empty:Filters={action:"",target:"",actor:"",from:"",to:""};
export default function AuditExplorer(){
 const [draft,setDraft]=useState<Filters>(empty),[filters,setFilters]=useState<Filters>(empty),[events,setEvents]=useState<Event[]>([]),[cursor,setCursor]=useState<string|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const [page,setPage]=useState(1);
 function params(f:Filters,c?:string){const p=new URLSearchParams();for(const [k,v] of Object.entries(f))if(v.trim())p.set(k,v.trim());if(c)p.set("cursor",c);return p;}
 async function load(f:Filters,c?:string){
  setLoading(true);setError("");
  try{const response=await fetch("/api/admin/audit-log?"+params(f,c),{cache:"no-store"});const data=await response.json();if(!response.ok)throw Error(data.error||"Audit log unavailable");setEvents(data.events||[]);setCursor(data.nextCursor||null);}
  catch(e){setError(e instanceof Error?e.message:"Audit log unavailable");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load(empty);},[]);
 const update=(key:keyof Filters,value:string)=>setDraft(p=>({...p,[key]:value}));
 return <div className="space-y-6 pb-12" data-testid="admin-audit-explorer">
 <header className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-violet-700">SECURITY OPERATIONS</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Activity & audit explorer</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Investigate administrative changes, filter by actor or member, and export records for review. Every result is read from the protected audit log.</p></header>
 <form onSubmit={e=>{e.preventDefault();setFilters({...draft});setPage(1);void load(draft);}} className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
 <h2 className="mb-4 text-lg font-bold">Find an event</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 <label className="space-y-1 text-sm font-semibold">Action<Input value={draft.action} maxLength={100} placeholder="e.g. member_trial" onChange={e=>update("action",e.target.value)}/></label>
 <label className="space-y-1 text-sm font-semibold">Target / member ID<Input value={draft.target} maxLength={100} placeholder="Member ID or resource" onChange={e=>update("target",e.target.value)}/></label>
 <label className="space-y-1 text-sm font-semibold">Admin actor ID<Input value={draft.actor} placeholder="Optional admin UUID" onChange={e=>update("actor",e.target.value)}/></label>
 <label className="space-y-1 text-sm font-semibold">From (UTC)<Input type="date" value={draft.from} onChange={e=>update("from",e.target.value)}/></label>
 <label className="space-y-1 text-sm font-semibold">To (UTC)<Input type="date" value={draft.to} onChange={e=>update("to",e.target.value)}/></label>
 </div><div className="mt-5 flex flex-wrap gap-2"><Button type="submit" disabled={loading}>Apply filters</Button><Button type="button" variant="outline" onClick={()=>{setDraft(empty);setFilters(empty);setPage(1);void load(empty);}}>Clear</Button><Button type="button" variant="outline" onClick={()=>{window.location.href="/api/admin/audit-log?"+params(filters)+"&format=csv";}}>Export CSV</Button></div>
 <p className="mt-3 text-xs text-slate-500">CSV exports include up to 1,000 most recent matching records. Dates use UTC.</p>
 </form>
 <section className="rounded-3xl border bg-white p-4 shadow-sm sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Recorded actions</h2><p className="text-xs text-slate-500">Page {page} · Up to 50 events per page</p></div><Button variant="outline" disabled={loading} onClick={()=>{setPage(1);void load(filters);}}>Refresh</Button></div>
 {error&&<p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
 {loading?<p role="status" className="p-6 text-sm text-slate-500">Loading audit records…</p>:events.length===0?<p className="p-6 text-sm text-slate-500">No matching activity found.</p>:<div className="grid gap-3">{events.map(event=><article key={event.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800">{event.action.replace(/_/g," ")}</span><time className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString("en-GB",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"})} UTC</time></div><p className="mt-3 break-all text-sm font-semibold text-slate-800">{event.target_type}{event.target_id?" · "+event.target_id:""}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">Actor: {event.actor_id||"System"}</p></article>)}</div>}
 {cursor&&<div className="mt-5 flex justify-center"><Button variant="outline" disabled={loading} onClick={()=>{setPage(p=>p+1);void load(filters,cursor);}}>Older events</Button></div>}
 </section></div>;

}
