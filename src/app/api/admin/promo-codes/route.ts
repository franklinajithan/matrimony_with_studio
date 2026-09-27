import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(){
 const admin=await requireServerAdmin(); if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 const db=await createSupabaseServerClient();
 const [codes,redemptions]=await Promise.all([
  db.from("promo_codes").select("id,code_hint,duration_months,max_redemptions,redemption_count,starts_at,expires_at,is_active,created_at").order("created_at",{ascending:false}).limit(100),
  db.from("promo_redemptions").select("id,promo_code_id,user_id,redeemed_at,trial_ends_at").order("redeemed_at",{ascending:false}).limit(100)
 ]);
 if(codes.error||redemptions.error)return NextResponse.json({error:"Unable to load promotion records"},{status:500});
 const ids=[...new Set((redemptions.data||[]).map(r=>r.user_id))];
 const people=ids.length?await db.from("profiles").select("id,display_name").in("id",ids):{data:[],error:null};
 if(people.error)return NextResponse.json({error:"Unable to load redemption records"},{status:500});
 const names=new Map((people.data||[]).map(p=>[p.id,p.display_name]));
 return NextResponse.json({codes:codes.data,redemptions:(redemptions.data||[]).map(r=>({...r,member_name:names.get(r.user_id)||"Member"}))},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin && origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const admin=await requireServerAdmin();if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request"},{status:400});}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid request"},{status:400});
 const b=body as Record<string,unknown>, months=b.durationMonths, limit=b.maxRedemptions, expiry=b.expiresAt;
 if(typeof months!=="number"||!Number.isInteger(months)||months<1||months>24||typeof limit!=="number"||!Number.isInteger(limit)||limit<1||limit>100000)return NextResponse.json({error:"Invalid duration or usage limit"},{status:400});
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
export async function PATCH(request:Request){
 const admin=await requireServerAdmin();if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 const origin=request.headers.get("origin");
 if(origin && origin!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid request"},{status:400});}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid request"},{status:400});
 const {id,isActive}=body as Record<string,unknown>;
 if(typeof id!=="string"||!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id)||typeof isActive!=="boolean")
  return NextResponse.json({error:"Invalid code or status"},{status:400});
 const db=await createSupabaseServerClient();
 const {data,error}=await db.from("promo_codes").update({is_active:isActive}).eq("id",id).select("id,is_active").single();
 return error?NextResponse.json({error:"Could not update code"},{status:500}):NextResponse.json({code:data});
}
