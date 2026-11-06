import {NextResponse} from "next/server";
import {countryCatalogue} from "@/lib/subscriptions/live-catalogue";
import {isCountryCode} from "@/lib/subscriptions/country-markets";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
export async function GET(request:Request){
 const url=new URL(request.url);
 const raw=url.searchParams.get("country")??"GB";
 if(!isCountryCode(raw))return NextResponse.json({error:"Unsupported country"},{status:400,headers});
 try{return NextResponse.json(await countryCatalogue(raw),{headers});}
 catch{return NextResponse.json({error:"Current prices unavailable"},{status:503,headers});}
}
