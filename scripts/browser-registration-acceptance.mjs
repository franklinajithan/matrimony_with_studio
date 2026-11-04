// Actual React/Radix components in a browser with isolated HTTP fixtures.
// This does not impersonate a member or establish signed-in Supabase acceptance.
import { build } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
const root=resolve('.'), dir=await mkdtemp(join(tmpdir(),'cupidmatch-registration-'));
let browser,server;
try {
  const bundle=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Signup from './src/app/(auth)/signup/signup-form';import CheckEmail from './src/app/(auth)/signup/check-email/page';import{OnboardingWizard}from'./src/components/onboarding/OnboardingWizard';import{I18nProvider}from'./src/components/i18n/I18nProvider';createRoot(document.getElementById('root')).render(<I18nProvider>{location.hash==='#signup'?<Signup/>:location.hash==='#check-email'?<CheckEmail/>:<OnboardingWizard/>}</I18nProvider>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',platform:'browser',tsconfig:join(root,'tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'isolated-link',setup(build){build.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'boundary'}));
build.onResolve({filter:/supabase\/auth$/},()=>({path:'auth',namespace:'boundary'}));
build.onResolve({filter:/supabase\/storage$/},()=>({path:'storage',namespace:'boundary'}));
build.onLoad({filter:/.*/,namespace:'boundary'},args=>({contents:args.path==='navigation'?`const router={push:path=>{window.__navigation=path},replace:path=>{window.__navigation=path},refresh:()=>{}};export const useRouter=()=>router;export const useSearchParams=()=>new URLSearchParams(location.search);export const usePathname=()=>location.pathname;`:args.path==='auth'?`export const auth={currentUser:{uid:'fixture-member'}};export function onAuthStateChanged(a,b){(b||a)(auth.currentUser);return()=>{}};export async function createUserWithEmailAndPassword(_a,email,password,extras){const r=await fetch('/fixture/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,...extras})});const d=await r.json();if(!r.ok)throw Error(d.error);return d};export async function resendSignupConfirmation(email,membershipPlan){window.__resend={email,membershipPlan};}export async function signInWithOAuth(provider,next){window.__oauth={provider,next};}`:`export const resolveMediaUrl=v=>v;export const mediaPathForUser=()=>'';export const uploadMediaFile=async()=>{throw Error('Not part of this test')};`,resolveDir:root}));
build.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test-link'}));build.onLoad({filter:/.*/,namespace:'test-link'},()=>({contents:"import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children);}",resolveDir:root}));}}]});
  execFileSync(join(root,'node_modules/.bin/tailwindcss'),['-i','src/app/globals.css','-o',join(dir,'style.css')],{stdio:'pipe'});
  const css=await readFile(join(dir,'style.css'));
  server=createServer((req,res)=>{if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents);}else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><main class="p-4"><div id="root"></div></main><script src="/bundle.js"></script></body></html>');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const options=process.env.PLAYWRIGHT_LAUNCH_OPTIONS_FILE?JSON.parse(await readFile(process.env.PLAYWRIGHT_LAUNCH_OPTIONS_FILE,'utf8')):{headless:true};
  let checks=0;
  for(const viewport of[{width:1280,height:900},{width:390,height:844}]){
   browser=await chromium.launch(options);const context=await browser.newContext({viewport});const page=await context.newPage();page.setDefaultTimeout(8000);
   await page.clock.setFixedTime(new Date('2026-11-02T12:00:00Z'));
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   let draft={displayName:'Test Member',gender:'female',dob:'1995-05-12',country:'Sri Lanka',region:'Jaffna',languages:['Tamil'],lookingFor:'marriage',relationshipTimeline:'ready',bio:'I value kindness, honesty and a lasting partnership.',educationLevel:"Bachelor's",relocationOpenness:'open',photoPrivacy:'connections'};
   let storedStep=3,failSave=false,saves=0,publishes=0,releaseSave=null,expectedPrivacy='connections',lastPublished=null;
   await page.route('**/api/onboarding/draft',route=>route.fulfill({json:{draft,step:storedStep,isPublished:false}}));
   await page.route('**/api/onboarding/save',async route=>{saves++;const body=route.request().postDataJSON();if(failSave)return route.fulfill({status:503,json:{error:'Temporary save failure'}});if(releaseSave){await releaseSave;}draft={...body.draft};storedStep=body.step;await route.fulfill({json:{ok:true,draft,step:storedStep}});});
   await page.route('**/api/onboarding/publish',async route=>{publishes++;const body=route.request().postDataJSON();assert.equal(body.draft.reviewConfirmed,true);assert.equal(body.membershipChoice,'free');assert.equal(body.draft.photoPrivacy,expectedPrivacy);lastPublished=body.draft;await route.fulfill({json:{ok:true,isPublished:true,step:8}});});
   await page.goto(base);await page.locator('#bio').waitFor();checks++;
   // Explicit step link overrides the saved checkpoint.
   await page.goto(base+'/?step=0');await page.locator('#displayName').waitFor();checks++;
   failSave=true;await page.getByRole('button',{name:'Save and exit',exact:true}).click();await page.getByText('Temporary save failure',{exact:true}).first().waitFor();
   assert.equal(await page.evaluate(()=>window.__navigation),undefined,'A failed Save & exit must keep the member on the form');checks++;
   await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByText('Temporary save failure',{exact:true}).first().waitFor();assert.equal(await page.locator('#displayName').count(),1,'Save failure must not advance the wizard');checks++;
   failSave=false;assert.equal(await page.getByRole('combobox',{name:'Birth year',exact:true}).locator('option[value="2015"]').count(),0);await page.getByRole('combobox',{name:'Birth year',exact:true}).selectOption('2008');await page.getByRole('combobox',{name:'Birth month',exact:true}).selectOption('12');await page.getByRole('combobox',{name:'Birth day',exact:true}).selectOption('31');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByText('You must be 18 or older to create a profile.',{exact:true}).waitFor();checks++;
   await page.getByRole('combobox',{name:'Birth year',exact:true}).selectOption('1995');await page.getByRole('combobox',{name:'Birth month',exact:true}).selectOption('5');await page.getByRole('combobox',{name:'Birth day',exact:true}).selectOption('12');
   let release;releaseSave=new Promise(resolve=>{release=resolve});
   const before=saves;await page.locator('#displayName').fill('First edit');
   await new Promise(resolve=>{const started=Date.now();const poll=()=>saves>before?resolve():Date.now()-started>3000?resolve():setTimeout(poll,30);poll();});
   await page.locator('#displayName').fill('Latest edit');releaseSave=null;release();await new Promise(resolve=>setTimeout(resolve,1300));
   assert.equal(await page.locator('#displayName').inputValue(),'Latest edit','A stale save response must not replace newer typing');assert.equal(draft.displayName,'Latest edit');checks++;
   // Traverse all eight real screens; the fixture starts with complete editable fields.
   for(const expected of['#country','#partnershipStyle','#bio','#religion','#open']){await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator(expected).waitFor();if(expected==='#partnershipStyle'){assert.equal(await page.getByRole('radio',{name:/Long-term partnership|Open to either/}).count(),0);await page.locator('#maritalStatus').selectOption('Divorced');checks++;}}
   await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('radio',{name:'Visible to accepted connections only',exact:true}).waitFor();
   await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Publish profile',exact:true}).waitFor();
   await page.getByRole('button',{name:'Publish profile',exact:true}).click();assert.equal(publishes,0);checks++;
   await page.getByRole('checkbox',{name:'I confirm these details are accurate and I want to publish my profile for other members to see.',exact:true}).check();await page.getByRole('radio',{name:/Free membership/}).check();await page.getByRole('button',{name:'Publish profile',exact:true}).click();await page.waitForFunction(()=>window.__navigation==='/dashboard');assert.equal(publishes,1);checks++;
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);checks++;
   draft={displayName:'Minimal Member',gender:'male',dob:'1990-06-10'};storedStep=0;expectedPrivacy='members';
   await page.goto(base);await page.locator('#displayName').waitFor();assert.equal(await page.locator('#displayName').inputValue(),'Minimal Member');
   await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('#country').waitFor();
   await page.getByRole('button',{name:'Skip optional details and review',exact:true}).click();await page.getByRole('button',{name:'Publish profile',exact:true}).waitFor();checks++;
   await page.getByRole('checkbox',{name:'I confirm these details are accurate and I want to publish my profile for other members to see.',exact:true}).check();await page.getByRole('radio',{name:/Free membership/}).check();await page.getByRole('button',{name:'Publish profile',exact:true}).click();await page.waitForFunction(()=>window.__navigation==='/dashboard');assert.equal(publishes,2);checks++;
   for(const key of['country','region','bio','educationLevel','relationshipTimeline','relocationOpenness','photoURL','maritalStatus'])assert.equal(lastPublished[key]||'','',key+' remains optional');assert.deepEqual(lastPublished.languages,[]);checks++;
   let signups=0,duplicate=false;
   await page.route('**/fixture/signup',async route=>{signups++;const body=route.request().postDataJSON();assert.equal(body.pendingPhone,'');assert.equal(body.displayName,'Fixture Member');assert.equal(body.membershipPlan,undefined);assert.equal(body.email,'fixture-member@example.invalid');return route.fulfill(duplicate?{status:400,json:{error:'An account with this email already exists.'}}:{json:{needsEmailConfirmation:true,session:null,user:{uid:'fixture-member'}}});});
   await page.goto(base+'/#signup');await page.reload();
   assert.equal(await page.getByRole('link',{name:'Log in',exact:true}).getAttribute('href'),'/login');checks++;
   await page.getByRole('textbox',{name:'Full name',exact:true}).fill('   ');await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByText('Name must be at least 2 characters.',{exact:true}).waitFor();assert.equal(signups,0);checks++;
   await page.getByRole('textbox',{name:'Full name',exact:true}).fill('  Fixture Member  ');await page.getByRole('textbox',{name:'Email',exact:true}).fill('fixture-member@example.invalid');
   await page.getByLabel('Password',{exact:true}).fill('Fixture-pass-123');await page.getByLabel('Confirm password',{exact:true}).fill('Not-matching');
   await page.getByRole('button',{name:'Show password',exact:true}).first().click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'text');await page.getByRole('button',{name:'Hide password',exact:true}).click();assert.equal(await page.getByLabel('Password',{exact:true}).getAttribute('type'),'password');checks++;
   await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByText('Passwords do not match.',{exact:true}).waitFor();assert.equal(signups,0);checks++;
   await page.locator('input[name="confirmPassword"]').fill('Fixture-pass-123');await page.getByRole('checkbox',{name:'I am 18 or older and I am creating this account for myself.',exact:true}).check();
   await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByText('You must accept the terms to continue.',{exact:true}).waitFor();assert.equal(signups,0);checks++;
   await page.getByRole('checkbox',{name:'I agree to the Terms of Service and Privacy Policy.',exact:true}).check();await page.getByRole('button',{name:'Create account',exact:true}).click();await page.waitForFunction(()=>window.__navigation?.startsWith('/signup/check-email'));assert.equal(signups,1);checks++;
   duplicate=true;await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByText('An account with this email already exists.',{exact:true}).first().waitFor();checks++;
   for(const name of ['Log in','Go to log in'])assert.equal(await page.getByRole('link',{name,exact:true}).getAttribute('href'),'/login');checks++;
   await page.goto(base+'/?plan=premium&next=%2Fmembership#signup');await page.getByRole('textbox',{name:'Full name',exact:true}).waitFor();assert.equal(await page.getByRole('combobox',{name:'Membership',exact:true}).count(),0);assert.equal(await page.getByText(/activate your Premium trial/).count(),0);checks++;
   await page.getByRole('button',{name:'Google',exact:true}).click();await page.waitForFunction(()=>window.__oauth?.provider==='google');assert.equal(await page.evaluate(()=>window.__oauth.next),'/onboarding');checks++;
   await page.goto(base+'/?email=fixture%40example.invalid&plan=premium#check-email');await page.getByRole('button',{name:'Resend confirmation email',exact:true}).waitFor();assert.equal(await page.getByRole('link',{name:'I have confirmed — log in',exact:true}).getAttribute('href'),'/login?next=%2Fonboarding');assert.equal(await page.getByRole('link',{name:'Use a different email',exact:true}).getAttribute('href'),'/signup');checks++;
   await page.getByRole('button',{name:'Resend confirmation email',exact:true}).click();await page.waitForFunction(()=>window.__resend?.email==='fixture@example.invalid');assert.equal(await page.evaluate(()=>window.__resend.membershipPlan),undefined);checks++;assert.equal(await page.getByRole('button',{name:/Resend available in/}).isDisabled(),true);checks++;
   assert.deepEqual(errors,[]);
   console.log(`PASS signup/onboarding ${viewport.width}px (26 checks)`);await context.close();await browser.close();browser=null;
  }
  console.log(`${checks} registration/onboarding browser checks passed with fixture identity/HTTP boundaries.`);
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
