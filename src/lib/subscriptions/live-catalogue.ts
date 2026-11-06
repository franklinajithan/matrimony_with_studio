import "server-only";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {cataloguePlan,type CataloguePlan} from "./catalogue-data";
import {isCountryCode,type CountryCode} from "./country-markets";
export type CountryCatalogue = {
 plans:CataloguePlan[];country:CountryCode;currency:string;isOverride:boolean;
 chargeCurrency:"GBP";paymentEnabled:false;
};
export async function countryCatalogue(countryInput="GB"):Promise<CountryCatalogue>{
 const country:CountryCode=isCountryCode(countryInput)?countryInput:"GB";
 const db=await createSupabaseServerClient();
 const {data,error}=await db.from("subscription_plans").select("*").order("sort_order");
 if(error||!data)throw Error("Catalogue unavailable");
 const plans=data.map(cataloguePlan).filter(plan=>plan.active).map(({updatedAt,...plan})=>{void updatedAt;return plan;});
 if(country==="GB")return {plans,country,currency:"GBP",isOverride:false,chargeCurrency:"GBP",paymentEnabled:false};
 const {data:market,error:marketError}=await db.from("subscription_country_prices")
  .select("country_code,currency,enabled,plus_monthly_minor,premium_monthly_minor,plus_three_month_minor,premium_three_month_minor,plus_six_month_minor,premium_six_month_minor")
  .eq("country_code",country).eq("enabled",true).maybeSingle();
 if(marketError)throw Error("Country pricing unavailable");
 if(!market||!market.enabled)return {plans,country,currency:"GBP",isOverride:false,chargeCurrency:"GBP",paymentEnabled:false};
 if(!["EUR","USD","LKR","INR","CAD","AUD","CHF","GBP","NZD","SGD","AED","ZAR"].includes(market.currency))throw Error("Unsupported market currency");
 const prices:Record<string,{monthly:number;three_months:number|null;six_months:number|null}>={
   plus:{monthly:market.plus_monthly_minor,three_months:market.plus_three_month_minor,six_months:market.plus_six_month_minor},
   premium:{monthly:market.premium_monthly_minor,three_months:market.premium_three_month_minor,six_months:market.premium_six_month_minor}
 };
 const localized=plans.map(plan=>{
  if(plan.code==="free")return {...plan,currency:market.currency};
  const override=prices[plan.code];
  if(!override||override.monthly<1)throw Error("Incomplete market pricing");
  return {...plan,currency:market.currency,pricesPence:override};
 });
 return {plans:localized,country,currency:market.currency,isOverride:true,chargeCurrency:"GBP",paymentEnabled:false};
}
export async function publicCatalogue(){
 const result=await countryCatalogue("GB");
 return result.plans;
}
