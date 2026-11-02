import {NextResponse} from "next/server";
import {publicCatalogue} from "@/lib/subscriptions/live-catalogue";
import {catalogueSavings} from "@/lib/subscriptions/catalogue-data";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
export async function GET(){try{const plans=await publicCatalogue();return NextResponse.json(Object.fromEntries(plans.map(plan=>[plan.code,{three_months:catalogueSavings({...plan,updatedAt:""},"three_months"),six_months:catalogueSavings({...plan,updatedAt:""},"six_months")}])) ,{headers});}catch{return NextResponse.json({error:"Current savings unavailable"},{status:503,headers});}}
