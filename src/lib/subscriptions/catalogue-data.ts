export type CataloguePlan = {
 code:string; name:string; active:boolean; currency:string; updatedAt:string;
 pricesPence:{monthly:number;three_months:number|null;six_months:number|null};
 entitlements:Record<string,unknown>;
};
export function cataloguePlan(row:Record<string,unknown>):CataloguePlan {
 const integer=(value:unknown,optional=false):number|null=>{
  if(optional&&(value===null||value===undefined))return null;
  if(typeof value!=="number"||!Number.isSafeInteger(value)||value<0)throw Error("Invalid catalogue price");return value;
 };
 if(typeof row.code!=="string"||!row.code||typeof row.name!=="string"||typeof row.currency!=="string"||!/^[A-Z]{3}$/.test(row.currency)||typeof (row.active??row.is_active)!=="boolean")throw Error("Invalid catalogue entry");
 return {code:row.code,name:row.name,active:(row.active??row.is_active) as boolean,currency:row.currency,
 updatedAt:typeof row.updated_at==="string"?row.updated_at:"",
 pricesPence:{monthly:integer(row.monthly_price_pence)!,three_months:integer(row.three_month_price_pence,true),six_months:integer(row.six_month_price_pence,true)},
 entitlements:row.entitlements&&typeof row.entitlements==="object"&&!Array.isArray(row.entitlements)?row.entitlements as Record<string,unknown>:{} };
}
export function parsePrice(value:string):number|null {
 if(value.trim()==="")return null;
 if(!/^\d{1,6}(\.\d{1,2})?$/.test(value))throw Error("Use a price with up to two decimal places.");
 const [whole,fraction=""]=value.split(".");return Number(whole)*100+Number(fraction.padEnd(2,"0"));
}
export function catalogueSavings(plan:CataloguePlan,term:"three_months"|"six_months") {
 const price=plan.pricesPence[term];return price===null?null:Math.max(0,plan.pricesPence.monthly*(term==="three_months"?3:6)-price);
}
export function formatCataloguePrice(pence:number|null,currency:string){
 if(pence===null)return "Not configured";
 return new Intl.NumberFormat("en-GB",{style:"currency",currency}).format(pence/100);
}
