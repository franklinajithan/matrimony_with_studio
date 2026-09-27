import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET() {
 if (!await requireServerAdmin()) return NextResponse.json({error:"Forbidden"},{status:403});
 const db=await createSupabaseServerClient();
 const {data:trials,error}=await db.from("member_trials").select("user_id,starts_at,ends_at,duration_months,promo_code_id").order("ends_at",{ascending:false}).limit(200);
 if(error)return NextResponse.json({error:"Unable to load trial records"},{status:503});
 const ids=(trials||[]).map(t=>t.user_id);
 let members: {id:string;display_name:string|null;email:string|null}[]=[];
 if(ids.length){
  const profiles=await db.from("profiles").select("id,display_name,email").in("id",ids);
  if(profiles.error)return NextResponse.json({error:"Unable to load member details"},{status:503});
  members=profiles.data||[];
 }
 const byId=new Map(members.map(m=>[m.id,m]));
 return NextResponse.json({trials:(trials||[]).map(t=>({...t,name:byId.get(t.user_id)?.display_name||"Member",email:byId.get(t.user_id)?.email||null})),limit:200},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403});
 const origin=request.headers.get("origin");
 if(origin && origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request"},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Invalid request"},{status:400});
 const {memberId,action,months,reason}=body as Record<string,unknown>;
 if(typeof memberId!=="string"||!uuid.test(memberId)||!["grant","extend","end"].includes(String(action))||typeof reason!=="string"||reason.trim().length<10||reason.trim().length>500||(action!=="end"&&(typeof months!=="number"||!Number.isInteger(months)||months<1||months>12)))
  return NextResponse.json({error:"Enter a valid member, action, duration and reason (10–500 characters)"},{status:400});
 const db=await createSupabaseServerClient();
 const {data,error}=await db.rpc("admin_adjust_member_trial",{p_member_id:memberId,p_action:action,p_months:action==="end"?null:months,p_reason:reason.trim()});
 if(error){
  const status=error.code==="42501"?403:error.code==="P0002"?404:error.code==="22023"?400:503;
  return NextResponse.json({error:status===503?"Unable to adjust trial":error.message},{status});
 }
 return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
}
