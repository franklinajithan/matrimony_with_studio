// Actual React UI; HTTP data are synthetic fixtures, not real members or Tide.
import {build} from 'esbuild';import {chromium} from 'playwright';import assert from 'node:assert/strict';
import{mkdtemp,readFile,rm}from'node:fs/promises';import{tmpdir}from'node:os';import{resolve,join}from'node:path';import{createServer}from'node:http';import{execFileSync}from'node:child_process';
const root=resolve('.'),dir=await mkdtemp(join(tmpdir(),'cupid-payment-'));let browser,server,checks=0;
try{
 const bundle=await build({stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import{PremiumLaunchOffer}from'./src/components/subscriptions/PremiumLaunchOffer';import{PaymentHistory}from'./src/components/subscriptions/PaymentHistory';import{PaymentCheckout}from'./src/components/subscriptions/PaymentCheckout';import PaymentDashboard from'./src/app/admin/payments/page-client';import{SecureCheckoutExperience}from'./src/components/subscriptions/SecureCheckoutExperience';createRoot(document.getElementById('root')).render(location.hash==='#checkout'?<SecureCheckoutExperience/>:location.hash==='#admin'?<PaymentDashboard/>:<main className="mx-auto max-w-3xl space-y-6 p-4"><PremiumLaunchOffer available={location.hash!=='#unavailable'} initialEndsAt={location.hash==='#legacy'?'2027-05-01T12:00:00Z':''}/><PaymentCheckout/><PaymentHistory/></main>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',platform:'browser',tsconfig:join(root,'tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'isolated-link',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'fixture'}));b.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},({path})=>({contents:path==='navigation'?"export function useSearchParams(){return new URLSearchParams(window.location.search)}":"import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children);}",resolveDir:root}));}}]});
 execFileSync(join(root,'node_modules/.bin/tailwindcss'),['-i','src/app/globals.css','-o',join(dir,'style.css')],{stdio:'pipe'});const css=await readFile(join(dir,'style.css'));
 server=createServer((req,res)=>{if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents);}else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const options=process.env.PLAYWRIGHT_LAUNCH_OPTIONS_FILE?JSON.parse(await readFile(process.env.PLAYWRIGHT_LAUNCH_OPTIONS_FILE,'utf8')):{headless:true};browser=await chromium.launch(options);
 for(const width of[1280,390]){
  const page=await browser.newPage({viewport:{width,height:900}});let claims=0,history=0,disables=0;const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message)});
  await page.route('**/api/plans**',route=>route.fulfill({json:{plans:[{code:'free',name:'Free',active:true,currency:'GBP',pricesPence:{monthly:0,three_months:null,six_months:null},entitlements:{}},{code:'plus',name:'Plus',active:true,currency:'GBP',pricesPence:{monthly:999,three_months:null,six_months:null},entitlements:{}},{code:'premium',name:'Premium',active:true,currency:'GBP',pricesPence:{monthly:1999,three_months:null,six_months:null},entitlements:{}}]}}));
  await page.route('**/api/billing/provider-state',route=>route.fulfill({json:{provider:'tide',configured:false,checkoutEnabled:false,webhookEnabled:false}}));
  await page.route('**/api/membership/premium-launch',async route=>{claims++;await new Promise(r=>setTimeout(r,80));await route.fulfill({status:claims===1?503:200,json:claims===1?{error:'Please retry the offer.'}:{plan:'premium',durationMonths:2,startsAt:'2026-11-04T12:00:00Z',endsAt:'2027-01-04T12:00:00Z'}});});
  await page.route('**/api/payments/history*',route=>{history++;return route.fulfill({status:history===1?503:200,json:history===1?{error:'History temporarily unavailable.'}:{payments:[{id:'payment',plan_code:'premium',billing_term:'monthly',amount_pence:799,status:'pending',created_at:'2026-11-04T12:00:00Z'}],hasMore:false}});});
  await page.goto(base);await page.getByRole('alert').filter({hasText:'History temporarily'}).waitFor();checks++;
  await page.getByRole('button',{name:'Retry',exact:true}).click();await page.getByText('premium · £7.99').waitFor();checks++;
  await page.getByRole('button',{name:'Start 2 months free'}).click();await page.getByText('Please retry the offer.').waitFor();checks++;
  await page.getByRole('button',{name:'Start 2 months free'}).dblclick();await page.getByText(/4 January 2027/).waitFor();assert.equal(claims,2);checks++;
  await page.getByLabel('Plan',{exact:true}).selectOption('premium');await page.getByText('Price preview: £19.99').waitFor();assert.equal(await page.getByLabel('Membership period').locator('option[value="six_months"]').count(),0);checks++;
  assert.equal(await page.getByRole('link',{name:'Review secure checkout'}).getAttribute('href'),'/checkout?plan=premium&term=monthly&country=GB');checks++;
  assert.equal(await page.locator('input[type="password"],input[autocomplete="cc-number"]').count(),0);checks++;
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;
  await page.goto(base+'/#unavailable');await page.reload();await page.getByText('Premium trial activation is temporarily unavailable. Free membership remains available.').waitFor();assert.equal(await page.getByRole('button',{name:'Start 2 months free'}).isDisabled(),true);checks++;assert.equal(claims,2);checks++;
  await page.goto(base+'/#legacy');await page.reload();await page.getByText(/1 May 2027/).waitFor();assert.equal(await page.getByRole('button',{name:'Start 2 months free'}).count(),0);checks++;
  await page.route('**/api/admin/payments*',route=>{if(route.request().method()==='POST'){disables++;return route.fulfill({json:{enabled:false}});}return route.fulfill({json:{summary:{verifiedRevenuePence:799,refundedPence:0,pending:1,failed:1,cancelled:0,activeTrials:1,legacyActiveTrials:0,paidSubscriptions:0},payments:[{id:'pay',user_id:'synthetic-member',plan_code:'premium',amount_pence:799,status:'pending'}],trials:[{user_id:'synthetic-member',ends_at:'2027-01-04T12:00:00Z',duration_months:2}],legacyTrials:[],subscriptions:[],events:[],hasMore:false,readiness:{reason:'Tide merchant verification is unavailable.'}}});});
  await page.goto(base+'/?country=GB&plan=premium#checkout');
  await page.getByRole('heading',{name:'Complete your CupidMatch membership'}).waitFor();
  await page.getByRole('heading',{name:'Your selected membership'}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Order summary'}).count(),0);
  assert.equal(await page.getByRole('link',{name:'Change plan'}).count(),1);
  assert.equal(await page.getByText('Compare membership benefits').count(),0);
  await page.getByText('Secure Stripe checkout — not enabled yet').waitFor();
  assert.equal(await page.getByRole('button',{name:/Secure Stripe checkout/}).isDisabled(),true);
  assert.equal(await page.locator('input[autocomplete="cc-number"],input[autocomplete="cc-csc"],input[name="cardNumber"]').count(),0);
  assert.equal(await page.getByText(/enter your card number, expiry date/).count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;
  await page.goto(base+'/#admin');await page.reload();await page.getByRole('heading',{name:'Payment records',exact:true}).waitFor();checks++;
  await page.getByRole('button',{name:'Pause payments'}).click();await page.getByText('Payments paused. The action was recorded in the audit log.').waitFor();assert.equal(disables,1);checks++;
  assert.equal(await page.getByRole('button',{name:/enable live/i}).count(),0);checks++;
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;
  assert.deepEqual(errors,[]);checks++;await page.close();
 }
 console.log(`Payment browser acceptance: ${checks} checks passed at 1280px and 390px.`);
}finally{await browser?.close();await new Promise(r=>server?server.close(r):r());await rm(dir,{recursive:true,force:true});}
