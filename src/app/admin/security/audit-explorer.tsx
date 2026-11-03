"use client";
import { useEffect,useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Event={id:string;actor_id:string|null;action:string;target_type:string;target_id:string|null;created_at:string};
type Filters={action:string;target:string;actor:string;from:string;to:string};
const empty:Filters={action:"",target:"",actor:"",from:"",to:""};
export default function AuditExplorer(){
 const [draft,setDraft]=useState<Filters>(empty);
 const [query,setQuery]=useState<{filters:Filters;cursor:string|null;page:number}>({filters:empty,cursor:null,page:1});
 const [events,setEvents]=useState<Event[]>([]),[cursor,setCursor]=useState<string|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [reload,setReload]=useState(0);
 const {filters,page}=query;
 function params(f:Filters,c?:string|null){const p=new URLSearchParams();for(const [k,v] of Object.entries(f))if(v.trim())p.set(k,v.trim());if(c)p.set("cursor",c);return p;}
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError("");setEvents([]);setCursor(null);
  void fetch("/api/admin/audit-log?"+params(query.filters,query.cursor),{cache:"no-store",signal:controller.signal})
   .then(async response=>{const data=await response.json();if(!response.ok||!Array.isArray(data.events)||(data.nextCursor!==null&&typeof data.nextCursor!=="string"))throw Error(data.error||"Audit log unavailable");if(!controller.signal.aborted){setEvents(data.events);setCursor(data.nextCursor);}})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Audit log unavailable");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[query,reload]);
 function apply(f:Filters){setQuery({filters:{...f},cursor:null,page:1});}
 const update=(key:keyof Filters,value:string)=>setDraft(p=>({...p,[key]:value}));
 return <div className="space-y-6 pb-12" data-testid="admin-audit-explorer">
 <header className="rounded-3xl border border-border bg-gradient-to-br from-accent via-white to-background p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-primary">SECURITY OPERATIONS</p><h1 className="mt-2 text-3xl font-bold text-foreground">Activity & audit explorer</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Investigate administrative changes, filter by actor or member, and export records for review. Every result is read from the protected audit log.</p></header>
 <form onSubmit={e=>{e.preventDefault();apply(draft);}} className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
 <h2 className="mb-4 text-lg font-bold">Find an event</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 <label className="space-y-1 text-sm font-semibold">Action<Input value={draft.action} maxLength={100} placeholder="e.g. member_trial" onChange={e=>update("action",e.target.value)}/></label>
 <label className="space-y-1 text-sm font-semibold">Target / member ID<Input value={draft.target} maxLength={100} placeholder="Member ID or resource" onChange={e=>update("target",e.target.value)}/></label>
 <label className="space-y-1 text-sm font-semibold">Admin actor ID<Input value={draft.actor} placeholder="Optional admin UUID" onChange={e=>update("actor",e.target.value)}/></label>
 <label className="space-y-1 text-sm font-semibold">From (UTC)<Input type="date" value={draft.from} onChange={e=>update("from",e.target.value)}/></label>
 <label className="space-y-1 text-sm font-semibold">To (UTC)<Input type="date" value={draft.to} onChange={e=>update("to",e.target.value)}/></label>
 </div><div className="mt-5 flex flex-wrap gap-2"><Button type="submit" disabled={loading}>Apply filters</Button><Button type="button" variant="outline" onClick={()=>{setDraft(empty);apply(empty);}}>Clear</Button><Button type="button" variant="outline" onClick={()=>{window.location.href="/api/admin/audit-log?"+params(filters)+"&format=csv";}}>Export CSV</Button></div>
 <p className="mt-3 text-xs text-muted-foreground">CSV exports use the applied filters and include up to 1,000 most recent matching records. Dates use UTC.</p>
 </form>
 <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Recorded actions</h2><p className="text-xs text-muted-foreground">Page {page} · Up to 50 events per page</p></div><Button variant="outline" disabled={loading} onClick={()=>{apply(filters);}}>Refresh</Button></div>
 {error&&<div className="mb-4 space-y-2"><p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p><Button variant="outline" onClick={()=>setReload(value=>value+1)}>Retry audit records</Button></div>}
 {loading?<p role="status" className="p-6 text-sm text-muted-foreground">Loading audit records…</p>:error?null:events.length===0?<p className="p-6 text-sm text-muted-foreground">No matching activity found.</p>:<div className="grid gap-3">{events.map(event=><article key={event.id} className="rounded-2xl border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">{event.action.replace(/_/g," ")}</span><time className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString("en-GB",{timeZone:"UTC",dateStyle:"medium",timeStyle:"short"})} UTC</time></div><p className="mt-3 break-all text-sm font-semibold text-foreground">{event.target_type}{event.target_id?" · "+event.target_id:""}</p><p className="mt-1 break-all font-mono text-xs text-muted-foreground">Actor: {event.actor_id||"System"}</p></article>)}</div>}
 {cursor&&!error&&<div className="mt-5 flex justify-center"><Button variant="outline" disabled={loading} onClick={()=>{setQuery({filters,cursor,page:page+1});}}>Older events</Button></div>}
 </section></div>;
}
