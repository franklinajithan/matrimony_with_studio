import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireServerAdmin } from "@/lib/auth/admin";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
 if (!await requireServerAdmin()) return NextResponse.json({error:"Forbidden"},{status:403,headers});
 try {
  const db=await createSupabaseServerClient();
  const {data,error}=await db.from("subscription_events").select("id,user_id,event_type,created_at").order("created_at",{ascending:false}).limit(250);
  if(error)throw error;
  return NextResponse.json({events:data||[]},{headers});
 } catch {return NextResponse.json({error:"Could not load billing events"},{status:503,headers});}
}
