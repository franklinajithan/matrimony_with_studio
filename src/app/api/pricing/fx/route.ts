import {NextResponse} from "next/server";
export const dynamic = "force-dynamic";
const headers={"Cache-Control":"public, max-age=900, stale-while-revalidate=1800"};
type FxItem = {date:string; base:string; quote:string; rate:number};
export async function GET(){
 try{
   const [euro,dollar] = await Promise.all(["eur","usd"].map(async currency=>{
     const response=await fetch(`https://api.frankfurter.dev/v2/rate/gbp/${currency}?providers=ecb`,{next:{revalidate:3600}});
     if(!response.ok)throw Error("Rates unavailable");
     const data:FxItem=await response.json();
     if(data.base?.toUpperCase()!=="GBP"||data.quote?.toLowerCase()!==currency||!Number.isFinite(data.rate)||data.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(data.date))
       throw Error("Invalid FX rate response");
     if(Date.now()-Date.parse(data.date+"T00:00:00Z")>7*86400000||Date.parse(data.date+"T00:00:00Z")>Date.now()+86400000)
       throw Error("FX rates stale");
     return data;
   }));
   if(euro.date!==dollar.date)throw Error("Currency rate dates mismatch");
   return NextResponse.json({base:"GBP",rates:{GBP:1,EUR:euro.rate,USD:dollar.rate},asOf:euro.date,source:"European Central Bank via Frankfurter",displayOnly:true,checkoutCurrency:"GBP"}, {headers});
 }catch{
   return NextResponse.json({error:"Currency estimates temporarily unavailable. GBP prices remain authoritative."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
