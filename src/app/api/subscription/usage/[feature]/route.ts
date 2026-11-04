import {NextResponse} from "next/server";
import {getServerSubscription} from "@/lib/subscriptions/server";
import {createSupabaseServerClient} from "@/lib/supabase/server";

const FEATURES=new Set(["interestsPerMonth","messagesPerMonth","profileViewsPerMonth","profileSharesPerMonth","biodataTemplates","profileBoostsPerMonth"]);
const headers={"Cache-Control":"private, no-store"};
export async function GET(_request:Request,context:{params:Promise<{feature:string}>}){
 const {user,plan,subscription}=await getServerSubscription();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401,headers});
 const {feature}=await context.params;
 if(!FEATURES.has(feature))return NextResponse.json({error:"Unknown metered feature"},{status:404,headers});
 const db=await createSupabaseServerClient();
 const code=subscription?.plan_code==="plus"?"plus":plan.code==="premium_plus"?"premium":plan.code;
 const start=new Date();
 const periodStart=`${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,"0")}-01`;
 const [record,usage]=await Promise.all([
   db.from("subscription_plans").select("entitlements").eq("code",code).eq("is_active",true).maybeSingle(),
   db.from("subscription_usage").select("used_count").eq("user_id",user.id).eq("feature_key",feature).eq("period_start",periodStart).maybeSingle(),
 ]);
 if(record.error||!record.data||usage.error)return NextResponse.json({error:"Membership usage unavailable"},{status:503,headers});
 const entitlements=record.data.entitlements as Record<string,unknown>;
 const value=entitlements[feature];
 if(value!==null && (typeof value!=="number"||!Number.isSafeInteger(value)||value<0))
   return NextResponse.json({error:"Feature quota not configured"},{status:503,headers});
 const used=Number(usage.data?.used_count??0);
 return NextResponse.json({plan:code,feature,limit:value,used,remaining:value===null?null:Math.max(0,value-used),periodStart},{headers});
}
