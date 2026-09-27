import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(){
 const admin=await requireServerAdmin(); if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 const db=await createSupabaseServerClient();
 const {data,error}=await db.from("promo_codes").select("id,code_hint,duration_months,max_redemptions,redemption_count,starts_at,expires_at,is_active,created_at").order("created_at",{ascending:false}).limit(100);
 return error?NextResponse.json({error:"Unable to load codes"},{status:500}):NextResponse.json({codes:data});
}
export async function POST(request:Request){
 const admin=await requireServerAdmin();if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request"},{status:400});}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid request"},{status:400});
 const b=body as Record<string,unknown>, months=b.durationMonths, limit=b.maxRedemptions, expiry=b.expiresAt;
 if(!Number.isInteger(months)||Number(months)<1||Number(months)>24||!Number.isInteger(limit)||Number(limit)<1||Number(limit)>100000)return NextResponse.json({error:"Invalid duration or usage limit"},{status:400});
 let expiresAt:string|null=null;
 if(expiry!==null&&expiry!==undefined&&expiry!==""){
  if(typeof expiry!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(expiry))return NextResponse.json({error:"Invalid expiry date"},{status:400});
  const d=new Date(expiry+"T23:59:59.999Z");if(!Number.isFinite(d.getTime())||d.getTime()<=Date.now())return NextResponse.json({error:"Expiry must be in the future"},{status:400});
  expiresAt=d.toISOString();
 }
 const code="CUPID-"+randomBytes(9).toString("hex").toUpperCase();
 const hash=createHash("sha256").update(code).digest("hex");
 const db=await createSupabaseServerClient();
 const {error}=await db.from("promo_codes").insert({code_hash:hash,code_hint:code.slice(0,9)+"…"+code.slice(-4),duration_months:months,max_redemptions:limit,expires_at:expiresAt,created_by:admin.id});
 if(error)return NextResponse.json({error:"Could not create code"},{status:500});
 return NextResponse.json({code,message:"Copy this code now. It will not be shown again."},{status:201,headers:{"Cache-Control":"no-store"}});
}