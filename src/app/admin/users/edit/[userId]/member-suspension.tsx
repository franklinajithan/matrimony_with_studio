"use client";
import { useEffect,useState } from "react";
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
type Status={suspended:boolean;suspendedAt:string|null;reason:string|null;administrator:boolean};
export function MemberSuspension({memberId}:{memberId:string}){
 const [status,setStatus]=useState<Status|null>(null);const [loading,setLoading]=useState(true);
 const [reason,setReason]=useState("");const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 useEffect(()=>{let active=true;fetch(`/api/admin/member-suspension?memberId=${encodeURIComponent(memberId)}`,{cache:"no-store"})
 .then(async response=>{if(!response.ok)throw new Error();return response.json();}).then(data=>{if(active)setStatus(data);})
 .catch(()=>{if(active)setError("Could not load account status.");}).finally(()=>{if(active)setLoading(false);});return ()=>{active=false;};},[memberId]);
 async function submit(event:React.FormEvent<HTMLFormElement>){
 event.preventDefault();if(!status||saving||reason.trim().length<10)return;
 const suspend=!status.suspended;
 if(!window.confirm(suspend?"Suspend this account and disable its social interactions?":"Restore this member's social interactions?"))return;
 setSaving(true);setError("");setMessage("");
 try{const response=await fetch("/api/admin/member-suspension",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberId,suspend,reason:reason.trim()})});
 const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Unable to change status");
 const check=await fetch(`/api/admin/member-suspension?memberId=${encodeURIComponent(memberId)}`,{cache:"no-store"});
 if(!check.ok)throw new Error("Action completed but status refresh failed");setStatus(await check.json());setReason("");setMessage(suspend?"Account suspended.":"Account restored.");
 }catch(err){setError(err instanceof Error?err.message:"Unable to update account");}finally{setSaving(false);}
 }
 return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm"><CardHeader><CardTitle>Account access</CardTitle>
 <CardDescription>Suspension prevents social writes at database level. It does not revoke existing sign-in sessions or delete historical messages.</CardDescription></CardHeader>
 <CardContent className="space-y-4">{loading?<p role="status">Loading account status…</p>:status?<>
 <p className="text-sm font-semibold">{status.suspended?"Suspended":"Active"}</p>
 {status.suspended&&<p className="text-sm text-slate-600">Suspended {status.suspendedAt?new Date(status.suspendedAt).toLocaleString("en-GB"):""} · {status.reason}</p>}
 {status.administrator?<p className="text-sm text-slate-600">Administrator accounts require separate access controls.</p>:
 <form onSubmit={submit} className="space-y-3"><label htmlFor="suspension-reason" className="text-sm font-medium">{status.suspended?"Reason for restoring":"Reason for suspension"}</label>
 <Textarea id="suspension-reason" value={reason} maxLength={1000} rows={3} onChange={event=>setReason(event.target.value)}/>
 <Button type="submit" variant={status.suspended?"default":"destructive"} disabled={saving||reason.trim().length<10}>{saving?"Saving…":status.suspended?"Restore account":"Suspend account"}</Button></form>}</>:null}
 {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
 </CardContent></Card>;
}