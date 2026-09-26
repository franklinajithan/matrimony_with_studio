import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function POST(request:Request){
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403});
 let body:unknown;
 try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Invalid request"},{status:400});
 const {memberId,connectionId,reason}=body as Record<string,unknown>;
 if(typeof memberId!=="string"||!uuid.test(memberId)||typeof connectionId!=="string"||!uuid.test(connectionId)||typeof reason!=="string"||reason.trim().length<10||reason.trim().length>1000)
 return NextResponse.json({error:"Member, connection and a reason of 10–1000 characters required"},{status:400});
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.rpc("admin_remove_member_connection",{p_member_id:memberId,p_connection_id:connectionId,p_reason:reason.trim()});
 if(error)return NextResponse.json({error:error.code==="P0002"?"Connection not found":"Unable to remove connection"},{status:error.code==="P0002"?404:503});
 return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
}