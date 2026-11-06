import {NextResponse} from "next/server";
import {z} from "zod";
import {requireServerAdmin} from "@/lib/auth/admin";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {isCountryCode} from "@/lib/subscriptions/country-markets";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
const payload=z.object({
 country:z.string().refine(isCountryCode).refine(v=>v!=="GB"),
 currency:z.enum(["GBP","EUR","USD","LKR","INR","CAD","AUD","CHF","NZD","SGD","AED","ZAR"]),
 enabled:z.boolean(),
 plusMonthly:z.number().int().min(1).max(10000000),
 premiumMonthly:z.number().int().min(1).max(10000000),
 plusThree:z.number().int().min(1).max(60000000).nullable(),
 premiumThree:z.number().int().min(1).max(60000000).nullable(),
 plusSix:z.number().int().min(1).max(120000000).nullable(),
 premiumSix:z.number().int().min(1).max(120000000).nullable(),
 expectedUpdatedAt:z.string().datetime({offset:true}).nullable()
}).strict();
export async function GET(){
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403,headers});
 const db=await createSupabaseServerClient();
 const {data,error}=await db.rpc("admin_list_country_prices");
 if(error)return NextResponse.json({error:"Could not load country pricing"},{status:503,headers});
 return NextResponse.json({markets:data??[]},{headers});
}
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)
   return NextResponse.json({error:"Invalid origin"},{status:403,headers});
 if(!await requireServerAdmin())return NextResponse.json({error:"Forbidden"},{status:403,headers});
 const parsed=payload.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid country pricing form"},{status:400,headers});
 const p=parsed.data, db=await createSupabaseServerClient();
 const {data,error}=await db.rpc("admin_save_country_prices",{
 p_country_code:p.country,p_currency:p.currency,p_enabled:p.enabled,
 p_plus_monthly:p.plusMonthly,p_premium_monthly:p.premiumMonthly,
 p_plus_three:p.plusThree,p_premium_three:p.premiumThree,
 p_plus_six:p.plusSix,p_premium_six:p.premiumSix,p_expected_updated_at:p.expectedUpdatedAt
 });
 if(error)return NextResponse.json({error:error.code==="40001"?"Someone else updated this market. Refresh before saving.":error.code==="42501"?"Administrator access required.":"Could not save market. Review amounts and database availability."},{status:error.code==="40001"?409:error.code==="42501"?403:503,headers});
 return NextResponse.json({market:data},{headers});
}
