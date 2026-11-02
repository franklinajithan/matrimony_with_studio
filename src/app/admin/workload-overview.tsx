"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
const cards=[
 {key:"publishedProfiles",label:"Published profiles",href:"/admin/users"},
 {key:"newMembers",label:"New members · 7 days",href:"/admin/users"},
 {key:"verificationRequests",label:"Pending review requests",href:"/admin/verifications"},
 {key:"openReports",label:"Open member reports",href:"/admin/reports"},
 {key:"pendingStories",label:"Stories awaiting review",href:"/admin/success-stories"},
 {key:"activeSubscriptions",label:"Active subscription records",href:"/admin/subscriptions"},
] as const;
export function WorkloadOverview(){
 const [counts,setCounts]=useState<Record<string,number|null>|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError(false);setCounts(null);
  void fetch("/api/admin/workload",{cache:"no-store",signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok||!body.counts||cards.some(card=>body.counts[card.key]!==null&&(!Number.isSafeInteger(body.counts[card.key])||body.counts[card.key]<0)))throw Error("Unavailable");if(!controller.signal.aborted)setCounts(body.counts);}).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();
 },[reload]);
 return <section className="space-y-4" aria-label="Admin workload"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Operations & review queues</h2><Button variant="outline" disabled={loading} onClick={()=>setReload(value=>value+1)}>Refresh queues</Button></div>{error&&<p role="alert" className="text-sm text-destructive">Queue counts unavailable. Refresh to try again.</p>}<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card=><Link href={card.href} key={card.key} className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">{card.label}</p><p className="mt-2 text-3xl font-bold tabular-nums" aria-label={counts?.[card.key]===null||!counts?"Unavailable":undefined}>{counts?.[card.key]?.toLocaleString("en-GB")??"—"}</p></Link>)}</div>{counts&&Object.values(counts).some(value=>value===null)&&<p role="status" className="text-sm text-muted-foreground">Some queues are unavailable. Refresh after the required backend setup is complete.</p>}{loading&&<p role="status" className="text-sm text-muted-foreground">Loading queues…</p>}</section>;
}
