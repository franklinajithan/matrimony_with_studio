import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed=["height","religion","caste","language","hobbies","favorite_movies","favorite_music","education_level","smoking_habits","drinking_habits","country","region"] as const;
export async function PATCH(request:Request){
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Invalid request"},{status:400});
 const {memberId,fields}=body as Record<string,unknown>;
 if(typeof memberId!=="string"||!uuid.test(memberId)||!fields||typeof fields!=="object"||Array.isArray(fields))return NextResponse.json({error:"Invalid fields"},{status:400});
 const entries=Object.entries(fields);
 if(!entries.length||entries.some(([key,value])=>!allowed.some(allowedKey=>allowedKey===key)||typeof value!=="string"||value.length>500))
 return NextResponse.json({error:"Invalid editable fields"},{status:400});
 const supabase=await createSupabaseServerClient();
 const {data,error}=await supabase.rpc("admin_edit_member_extended",{p_id:memberId,p_fields:fields});
 if(error)return NextResponse.json({error:error.code==="P0002"?"Member not found":"Unable to update profile"},{status:error.code==="P0002"?404:503});
 return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
}