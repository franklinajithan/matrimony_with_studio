import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function POST(request:Request){
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request"},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Invalid request"},{status:400});
 const {memberId,suspend,reason}=body as Record<string,unknown>;
 if(typeof memberId!=="string"||!uuid.test(memberId)||typeof suspend!=="boolean"||typeof reason!=="string"||reason.trim().length<10||reason.trim().length>1000)
 return NextResponse.json({error:"Valid member, action and reason (10–1000 characters) required"},{status:400});
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.rpc("admin_set_member_suspension",{p_member_id:memberId,p_suspend:suspend,p_reason:reason.trim()});
 if(error)return NextResponse.json({error:error.code==="P0002"?"Member not found":error.code==="42501"?"Not permitted":"Unable to update suspension"},{status:error.code==="P0002"?404:error.code==="42501"?403:503});
 return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
}

export async function GET(request:Request){
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403});
 const memberId=new URL(request.url).searchParams.get("memberId");
 if(!memberId||!uuid.test(memberId))return NextResponse.json({error:"Invalid member"},{status:400});
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.from("profiles").select("id,suspended_at,suspension_reason,is_admin").eq("id",memberId).single();
 if(error||!data)return NextResponse.json({error:"Unable to load member status"},{status:404});
 return NextResponse.json({suspended:Boolean(data.suspended_at),suspendedAt:data.suspended_at,reason:data.suspension_reason,administrator:data.is_admin},{headers:{"Cache-Control":"no-store"}});
}
