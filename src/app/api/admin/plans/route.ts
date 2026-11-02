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
   currency:row.currency,monthly_price_pence:row.monthly_price_pence,
   three_month_price_pence:row.three_month_price_pence??null,six_month_price_pence:row.six_month_price_pence??null,
   entitlements:row.entitlements}));
  return NextResponse.json({plans},{headers});
 } catch {return NextResponse.json({error:"Could not load plans"},{status:503,headers});}
}
