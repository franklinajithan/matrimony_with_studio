"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
export function PremiumLaunchOffer() {
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[endsAt,setEndsAt]=useState("");
 const lock=useRef(false);
 async function claim() {
  if(lock.current)return;lock.current=true;setBusy(true);setError("");
  try {
   const response=await fetch("/api/membership/premium-launch",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Unable to start Premium.");
   if(data.plan!=="premium"||data.durationMonths!==6||!Number.isFinite(Date.parse(data.endsAt)))throw Error("Unable to confirm Premium access.");
   setEndsAt(data.endsAt);
  }catch(e){setError(e instanceof Error?e.message:"Unable to start Premium.");}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className="space-y-4 rounded-3xl border border-primary bg-accent p-6" aria-label="Six-month Premium launch offer">
  <h2 className="text-2xl font-bold">Premium — free for 6 months</h2>
  <p>Start your six-month Premium launch offer today. No card required. No automatic charges.</p>
  <p className="text-sm text-muted-foreground">One launch offer per account. Your six months start when you activate it. After it ends, you return to Free unless you choose a future paid plan.</p>
  {endsAt?<div role="status" className="space-y-3"><p>{Date.parse(endsAt)>Date.now()?"Your Premium launch offer is active until":"Your Premium launch offer ended on"} {new Date(endsAt).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})}.</p><Button variant="outline" asChild><a href="/membership">View updated membership</a></Button></div>:<Button disabled={busy} onClick={()=>void claim()}>{busy?"Starting Premium…":"Start 6 months free"}</Button>}
  {error&&<p role="alert" className="text-destructive">{error}</p>}
 </section>;
}
