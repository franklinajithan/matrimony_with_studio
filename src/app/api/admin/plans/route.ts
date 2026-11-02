import { z } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireServerAdmin } from "@/lib/auth/admin";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
 if (!await requireServerAdmin()) return NextResponse.json({error:"Forbidden"},{status:403,headers});
 try {
  const db=await createSupabaseServerClient();
  const {data,error}=await db.from("subscription_plans").select("*").order("monthly_price_pence",{ascending:true}).limit(250);
  if(error)throw error;
  // Catalogue schemas differ between the deployed foundation and the billing branch.
  // Only return known plan fields; absent term prices remain unavailable.
  const plans=(data||[]).map(row=>({code:row.code,name:row.name,active:row.active??row.is_active,
   updatedAt:row.updated_at,currency:row.currency,monthly_price_pence:row.monthly_price_pence,
   three_month_price_pence:row.three_month_price_pence??null,six_month_price_pence:row.six_month_price_pence??null,
   entitlements:row.entitlements}));
  return NextResponse.json({plans},{headers});
 } catch {return NextResponse.json({error:"Could not load plans"},{status:503,headers});}
}

const amount=z.number().int().min(0).max(99999999);
const change=z.object({code:z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),expectedUpdatedAt:z.string().datetime({offset:true}),
 prices:z.object({monthly:amount,three_months:amount.nullable(),six_months:amount.nullable()}).strict(),reason:z.string().trim().min(10).max(500)}).strict();
export async function PATCH(request:Request){
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403,headers});
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403,headers});
 const parsed=change.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Enter valid prices, the current version and a reason (10–500 characters)."},{status:400,headers});
 try {
  const db=await createSupabaseServerClient();const input=parsed.data;
  const {data,error}=await db.rpc("admin_update_plan_prices",{p_code:input.code,p_expected_updated_at:input.expectedUpdatedAt,p_monthly:input.prices.monthly,p_three_months:input.prices.three_months,p_six_months:input.prices.six_months,p_reason:input.reason});
  if(error){if(error.code==="22023")return NextResponse.json({error:"Choose changed, valid prices. The Free plan must remain free and paid prices must be positive."},{status:400,headers});throw error;}
  if(!data)return NextResponse.json({error:"Prices changed or the plan is unavailable. Refresh and review again."},{status:409,headers});
  return NextResponse.json(data,{headers});
 } catch {return NextResponse.json({error:"Could not update catalogue prices. The pricing migration must be installed."},{status:503,headers});}
}
