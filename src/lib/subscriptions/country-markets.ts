export const COUNTRY_MARKETS = [
 {code:"GB",name:"United Kingdom",currency:"GBP"},
 {code:"LK",name:"Sri Lanka",currency:"LKR"},
 {code:"IN",name:"India",currency:"INR"},
 {code:"US",name:"United States",currency:"USD"},
 {code:"CA",name:"Canada",currency:"CAD"},
 {code:"AU",name:"Australia",currency:"AUD"},
 {code:"NZ",name:"New Zealand",currency:"NZD"},
 {code:"DE",name:"Germany",currency:"EUR"},
 {code:"FR",name:"France",currency:"EUR"},
 {code:"IE",name:"Ireland",currency:"EUR"},
 {code:"NL",name:"Netherlands",currency:"EUR"},
 {code:"IT",name:"Italy",currency:"EUR"},
 {code:"ES",name:"Spain",currency:"EUR"},
 {code:"PT",name:"Portugal",currency:"EUR"},
 {code:"CH",name:"Switzerland",currency:"CHF"},
 {code:"SG",name:"Singapore",currency:"SGD"},
 {code:"AE",name:"United Arab Emirates",currency:"AED"},
 {code:"ZA",name:"South Africa",currency:"ZAR"}
] as const;
export type CountryCode = (typeof COUNTRY_MARKETS)[number]["code"];
export type MarketCurrency = "GBP"|"LKR"|"INR"|"USD"|"CAD"|"AUD"|"EUR"|"CHF"|"NZD"|"SGD"|"AED"|"ZAR";
export function isCountryCode(s:string):s is CountryCode{return COUNTRY_MARKETS.some(x=>x.code===s);}
export function defaultCountryCurrency(s:CountryCode):MarketCurrency {
 return COUNTRY_MARKETS.find(x=>x.code===s)!.currency;
}
export function formatMarketMoney(minor:number|null,currency:string){
 if(minor===null)return "Not offered";
 return new Intl.NumberFormat("en-GB",{style:"currency",currency,maximumFractionDigits:2}).format(minor/100);
}
export type CountryPriceRow={
 country_code:string;currency:MarketCurrency;enabled:boolean;
 plus_monthly_minor:number;premium_monthly_minor:number;
 plus_three_month_minor:number|null;premium_three_month_minor:number|null;
 plus_six_month_minor:number|null;premium_six_month_minor:number|null;
 updated_at:string;
};
