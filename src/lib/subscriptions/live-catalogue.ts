import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cataloguePlan } from "./catalogue-data";
export async function publicCatalogue(){
 const db=await createSupabaseServerClient();
 const {data,error}=await db.from("subscription_plans").select("*").order("monthly_price_pence",{ascending:true}).limit(250);
 if(error||!data)throw Error("Catalogue unavailable");
 return data.map(cataloguePlan).filter(plan=>plan.active).map(({updatedAt,...plan})=>{void updatedAt;return plan;});
}
