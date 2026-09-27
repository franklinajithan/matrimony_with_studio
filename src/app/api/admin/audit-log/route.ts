import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const csvCell=(value:unknown)=>{const str=String(value??"");return '"'+(/^[=+@\-\t\r]/.test(str)?"'"+str:str).replace(/"/g,'""')+'"';};
export async function GET(request:Request){
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403});
 const params=new URL(request.url).searchParams;
 const action=(params.get("action")||"").trim(),target=(params.get("target")||"").trim(),actor=(params.get("actor")||"").trim();
 const from=params.get("from")||"",to=params.get("to")||"",cursor=params.get("cursor")||"";
 const exportCsv=params.get("format")==="csv";
 if(action.length>100||target.length>100||(actor&&!uuid.test(actor))||[from,to].some(s=>s&&!/^\d{4}-\d{2}-\d{2}$/.test(s))||(cursor&&!/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(cursor)))
  return NextResponse.json({error:"Invalid filters"},{status:400});
 const db=await createSupabaseServerClient();
 let query=db.from("admin_audit_log").select("id,actor_id,action,target_type,target_id,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(exportCsv?1000:51);
 if(action)query=query.ilike("action",`%${action.replace(/[%_,()]/g,"")}%`);
 if(target)query=query.or(`target_type.ilike.%${target.replace(/[%_,()]/g,"")}%,target_id.ilike.%${target.replace(/[%_,()]/g,"")}%`);
 if(actor)query=query.eq("actor_id",actor);
 if(from)query=query.gte("created_at",from+"T00:00:00.000Z");
 if(to)query=query.lte("created_at",to+"T23:59:59.999Z");
 if(cursor)query=query.lt("created_at",cursor);
 const {data,error}=await query;
 if(error)return NextResponse.json({error:"Audit records unavailable"},{status:503});
 if(exportCsv){
  const columns=["created_at","action","target_type","target_id","actor_id"] as const;
  const csv="\uFEFF"+columns.join(",")+"\r\n"+(data||[]).map(row=>columns.map(key=>csvCell(row[key])).join(",")).join("\r\n");
  return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=\"cupidmatch-admin-audit.csv\"","Cache-Control":"no-store","X-Export-Limit":"1000"}});
 }
 const items=(data||[]).slice(0,50);
 return NextResponse.json({events:items,nextCursor:(data||[]).length>50?items[items.length-1]?.created_at:null,limit:50},{headers:{"Cache-Control":"no-store"}});
}
