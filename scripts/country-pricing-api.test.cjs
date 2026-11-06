const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/load-ts.cjs');
const data=load('src/lib/subscriptions/catalogue-data.ts');
const markets=load('src/lib/subscriptions/country-markets.ts');
const rows=[
 {code:'free',name:'Free',currency:'GBP',is_active:true,monthly_price_pence:0,three_month_price_pence:null,six_month_price_pence:null,entitlements:{interestsPerMonth:2}},
 {code:'plus',name:'Plus',currency:'GBP',is_active:true,monthly_price_pence:499,three_month_price_pence:null,six_month_price_pence:null,entitlements:{interestsPerMonth:30}},
 {code:'premium',name:'Premium',currency:'GBP',is_active:true,monthly_price_pence:799,three_month_price_pence:null,six_month_price_pence:null,entitlements:{interestsPerMonth:null}}
];
const lk={country_code:'LK',currency:'LKR',enabled:true,plus_monthly_minor:149900,premium_monthly_minor:249900,plus_three_month_minor:null,premium_three_month_minor:null,plus_six_month_minor:null,premium_six_month_minor:null};
function fixture(override=lk){
 let marketReads=0;
 const library=load('src/lib/subscriptions/live-catalogue.ts',{
  './catalogue-data':data,'./country-markets':markets,
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>({from:table=>{
    const q={};for(const method of ['select','order','eq'])q[method]=()=>q;
    q.then=(done)=>done({data:rows,error:null});
    q.maybeSingle=async()=>{marketReads++;return {data:override,error:null}};
    return q;
  }})}
 });
 return {...library,getReads:()=>marketReads};
}
test('UK base remains GBP with no override lookup',async()=>{
 const f=fixture();
 const q=await f.countryCatalogue('GB');
 assert.equal(q.currency,'GBP');assert.equal(q.isOverride,false);assert.equal(f.getReads(),0);
 assert.deepEqual(q.plans.map(p=>p.pricesPence.monthly),[0,499,799]);
});
test('Sri Lankan approved prices override only prices and currency, retaining feature entitlements',async()=>{
 const q=await fixture().countryCatalogue('LK');
 assert.equal(q.isOverride,true);assert.equal(q.chargeCurrency,'GBP');assert.equal(q.paymentEnabled,false);
 assert.equal(q.currency,'LKR');assert.deepEqual(q.plans.map(p=>p.pricesPence.monthly),[0,149900,249900]);
 assert.equal(q.plans[1].entitlements.interestsPerMonth,30);
});
test('unconfigured and disabled markets safely fall back to base GBP',async()=>{
 for(const market of [null,{...lk,enabled:false}]){
  const q=await fixture(market).countryCatalogue('LK');
  assert.equal(q.currency,'GBP');assert.equal(q.isOverride,false);
  assert.equal(q.plans[2].pricesPence.monthly,799);
 }
});
test('public plans rejects unknown countries instead of guessing',async()=>{
 const api=load('src/app/api/plans/route.ts',{
  'next/server':{NextResponse:{json:(body,opts={})=>({body,status:opts.status??200,headers:opts.headers})}},
  '@/lib/subscriptions/live-catalogue':{countryCatalogue:async()=>{throw Error('should not access database')}},
  '@/lib/subscriptions/country-markets':markets
 });
 const r=await api.GET(new Request('https://cupidmatch.co.uk/api/plans?country=ZZ'));
 assert.equal(r.status,400);
});
