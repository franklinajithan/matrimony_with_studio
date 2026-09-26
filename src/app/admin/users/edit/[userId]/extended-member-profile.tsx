"use client";
import { useEffect,useState } from "react";
import type { Profile } from "@/lib/supabase/types";
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Field="height"|"religion"|"caste"|"language"|"hobbies"|"favorite_movies"|"favorite_music"|"education_level"|"smoking_habits"|"drinking_habits"|"country"|"region";
const fields:{key:Field;label:string;profileKey:keyof Profile}[]=[
 {key:"height",label:"Height",profileKey:"height"},{key:"religion",label:"Religion",profileKey:"religion"},
 {key:"caste",label:"Caste (optional)",profileKey:"caste"},{key:"language",label:"Primary language",profileKey:"language"},
 {key:"hobbies",label:"Hobbies",profileKey:"hobbies"},{key:"favorite_movies",label:"Favourite movies",profileKey:"favoriteMovies"},
 {key:"favorite_music",label:"Favourite music",profileKey:"favoriteMusic"},{key:"education_level",label:"Education",profileKey:"educationLevel"},
 {key:"smoking_habits",label:"Smoking",profileKey:"smokingHabits"},{key:"drinking_habits",label:"Drinking",profileKey:"drinkingHabits"},
 {key:"country",label:"Country",profileKey:"country"},{key:"region",label:"Region",profileKey:"region"}];
export function ExtendedMemberProfile({memberId,profile}:{memberId:string;profile:Profile|null}){
 const [form,setForm]=useState<Record<Field,string>>(()=>Object.fromEntries(fields.map(f=>[f.key,""])) as Record<Field,string>);
 const [original,setOriginal]=useState<Record<Field,string>>(()=>Object.fromEntries(fields.map(f=>[f.key,""])) as Record<Field,string>);
 const [saving,setSaving]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 useEffect(()=>{if(!profile)return;const next=Object.fromEntries(fields.map(f=>[f.key,String(profile[f.profileKey]??"")])) as Record<Field,string>;setForm(next);setOriginal(next);},[profile]);
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const changed=Object.fromEntries(fields.filter(f=>form[f.key]!==original[f.key]).map(f=>[f.key,form[f.key]]));
  if(!Object.keys(changed).length)return;setSaving(true);setError("");setSuccess("");
  try{const response=await fetch("/api/admin/member-extended-profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberId,fields:changed})});
   if(!response.ok)throw new Error("Unable to save member details");setOriginal({...form});setSuccess("Extended profile saved and audited.");
  }catch{setError("Unable to save extended profile. Please retry.");}finally{setSaving(false);}
 }
 return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
 <CardHeader><CardTitle>Extended member profile</CardTitle><CardDescription>Assist members with additional profile details. Only changed fields are submitted and logged. Identity and subscription permissions are excluded.</CardDescription></CardHeader>
 <CardContent>{!profile?<p className="text-sm text-slate-500">Loading member details…</p>:<form onSubmit={save} className="space-y-4">
 <div className="grid gap-4 sm:grid-cols-2">{fields.map(f=><label key={f.key} className="block text-sm font-medium"><span className="mb-1 block">{f.label}</span><Input value={form[f.key]} maxLength={500} onChange={event=>setForm(previous=>({...previous,[f.key]:event.target.value}))}/></label>)}</div>
 {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{success&&<p role="status" className="text-sm text-emerald-700">{success}</p>}
 <Button type="submit" disabled={saving||fields.every(f=>form[f.key]===original[f.key])}>{saving?"Saving…":"Save extended details"}</Button>
 </form>}</CardContent></Card>;
}