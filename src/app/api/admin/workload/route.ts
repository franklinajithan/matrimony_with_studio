import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
 if (!await requireServerAdmin()) return NextResponse.json({error:"Forbidden"},{status:403,headers});
 try {
  const db=await createSupabaseServerClient();
  const since=new Date(Date.now()-7*24*60*60*1000).toISOString();
  const results=await Promise.all([
   db.from("profiles").select("id",{head:true,count:"exact"}).eq("is_published",true),
   db.from("profiles").select("id",{head:true,count:"exact"}).eq("is_admin",false).gte("created_at",since),
   db.from("verification_requests").select("id",{head:true,count:"exact"}).eq("status","pending"),
   db.from("reports").select("id",{head:true,count:"exact"}).in("status",["pending","reviewing"]),
   db.from("success_stories").select("id",{head:true,count:"exact"}).eq("status","pending"),
   db.from("member_subscriptions").select("id",{head:true,count:"exact"}).eq("status","active"),
  ]);
  const counts=results.map(result=>result.error||!Number.isSafeInteger(result.count)||(result.count ?? -1)<0?null:result.count);
  if(counts.every(count=>count===null))throw Error("Unavailable");
  const keys=["publishedProfiles","newMembers","verificationRequests","openReports","pendingStories","activeSubscriptions"];
  return NextResponse.json({counts:Object.fromEntries(keys.map((key,index)=>[key,counts[index]])),updatedAt:new Date().toISOString()},{headers});
 } catch {return NextResponse.json({error:"Admin workload unavailable"},{status:503,headers});}
}
