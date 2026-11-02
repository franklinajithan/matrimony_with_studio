import {NextResponse} from "next/server";
import {publicCatalogue} from "@/lib/subscriptions/live-catalogue";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
export async function GET(){try{return NextResponse.json({plans:await publicCatalogue()},{headers});}catch{return NextResponse.json({error:"Current prices unavailable"},{status:503,headers});}}
