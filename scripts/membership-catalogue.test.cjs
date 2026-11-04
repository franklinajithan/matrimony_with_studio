const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/load-ts.cjs');
const {cataloguePlan,planBenefitLabels,parsePrice}=load('src/lib/subscriptions/catalogue-data.ts');
const fixtures=[
 {code:'free',name:'Free',is_active:true,currency:'GBP',monthly_price_pence:0,entitlements:{interestsPerMonth:2,messagesPerMonth:2,profileViewsPerMonth:50,searchPlacement:0}},
 {code:'plus',name:'Plus',is_active:true,currency:'GBP',monthly_price_pence:499,entitlements:{interestsPerMonth:30,messagesPerMonth:30,profileViewsPerMonth:400,searchPlacement:20}},
 {code:'premium',name:'Premium',is_active:true,currency:'GBP',monthly_price_pence:799,entitlements:{interestsPerMonth:null,messagesPerMonth:null,profileViewsPerMonth:null,searchPlacement:10}}
];
test('live catalogue uses exactly one GBP quote per plan',()=>{
 const plans=fixtures.map(cataloguePlan);
 assert.deepEqual(plans.map(p=>p.pricesPence.monthly),[0,499,799]);
 assert.equal(parsePrice('4.99'),499);
 assert.equal(parsePrice('7.99'),799);
});
test('feature comparison shows specific monthly quotas and placement priority',()=>{
 const [free,plus,premium]=fixtures.map(p=>planBenefitLabels(p.entitlements,8).join(' | '));
 for(const text of ['2 interests/month','2 messages/month','50 profile views/month'])assert.ok(free.includes(text));
 for(const text of ['30 interests/month','30 messages/month','400 profile views/month','Top 20'])assert.ok(plus.includes(text));
 for(const text of ['Unlimited interests/month','Unlimited messages/month','Unlimited profile views/month','Top 10'])assert.ok(premium.includes(text));
});
