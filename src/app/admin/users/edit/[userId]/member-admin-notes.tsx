"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NotebookPen } from "lucide-react";

type Note = { id:string; note:string; created_at:string; author_id:string };
export function MemberAdminNotes({ memberId }: { memberId:string }) {
 const [notes,setNotes]=useState<Note[]>([]);
 const [draft,setDraft]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 useEffect(() => {
  let active=true;
  fetch(`/api/admin/member-notes?memberId=${encodeURIComponent(memberId)}`,{cache:"no-store"})
   .then(async response=>{if(!response.ok) throw new Error("Unable to load notes");return response.json();})
   .then(result=>{if(active)setNotes(result.notes);})
   .catch(()=>{if(active)setError("Unable to load private notes.");})
   .finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[memberId]);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!draft.trim() || saving)return;
  setSaving(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/admin/member-notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({memberId,note:draft.trim()})});
   if(!response.ok)throw new Error("Unable to save note");
   const result=await response.json();
   setNotes(previous=>[result.note,...previous]);setDraft("");setSuccess("Private note saved.");
  }catch{setError("Unable to save private note.");}finally{setSaving(false);}
 }
 return <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
  <CardHeader><CardTitle className="flex items-center gap-2"><NotebookPen className="h-5 w-5 text-violet-700"/>Internal member notes</CardTitle>
   <CardDescription>Private administrator-only support history. Do not record passwords, payment card numbers or unnecessary identity documents.</CardDescription></CardHeader>
  <CardContent className="space-y-5">
   <form onSubmit={submit} className="space-y-3">
    <label htmlFor="member-admin-note" className="text-sm font-semibold">Add a support note</label>
    <Textarea id="member-admin-note" value={draft} maxLength={2000} rows={3} placeholder="Reason for assistance or action taken…" onChange={event=>setDraft(event.target.value)}/>
    <div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-500">{draft.length}/2000</span>
     <Button type="submit" disabled={saving || !draft.trim()}>{saving?"Saving…":"Save private note"}</Button></div>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {success&&<p role="status" className="text-sm text-emerald-700">{success}</p>}
   </form>
   <div className="border-t pt-4"><h3 className="mb-3 text-sm font-semibold">Note history</h3>
    {loading?<p role="status" className="text-sm text-slate-500">Loading notes…</p>:
     notes.length===0?<p className="text-sm text-slate-500">No notes recorded.</p>:
     <ul className="divide-y">{notes.map(note=><li key={note.id} className="py-3">
      <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{note.note}</p>
      <p className="mt-2 text-xs text-slate-500">{new Date(note.created_at).toLocaleString("en-GB")} · Administrator {note.author_id.slice(0,8)}</p>
     </li>)}</ul>}
   </div>
  </CardContent>
 </Card>;
}
