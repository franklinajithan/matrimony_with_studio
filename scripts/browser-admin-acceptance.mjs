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
const root=resolve('.'), dir=await mkdtemp(join(tmpdir(),'cupidmatch-browser-'));
let browser,server;
try {
  const bundle=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Verification from './src/app/admin/verifications/page-client';import Audit from './src/app/admin/security/audit-explorer';import{PremiumLaunchOffer}from'./src/components/subscriptions/PremiumLaunchOffer';createRoot(document.getElementById('root')).render(location.hash==='#premium'?<PremiumLaunchOffer/>:location.hash==='#audit'?<Audit/>:<Verification/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',platform:'browser',tsconfig:join(root,'tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'isolated-link',setup(build){build.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test-link'}));build.onLoad({filter:/.*/,namespace:'test-link'},()=>({contents:"import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children);}",resolveDir:root}));}}]});
  execFileSync(join(root,'node_modules/.bin/tailwindcss'),['-i','src/app/globals.css','-o',join(dir,'style.css')],{stdio:'pipe'});
  const css=await readFile(join(dir,'style.css'));
  server=createServer((req,res)=>{if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].contents);}else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><main class="p-4"><div id="root"></div></main><script src="/bundle.js"></script></body></html>');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const options=process.env.PLAYWRIGHT_LAUNCH_OPTIONS_FILE?JSON.parse(await readFile(process.env.PLAYWRIGHT_LAUNCH_OPTIONS_FILE,'utf8')):{headless:true};
  let checks=0;
  for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
    browser=await chromium.launch(options);
    const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const request={id:'20000000-0000-4000-8000-000000000001',member_id:'member-A',member_note:'Please review my profile',created_at:'2026-11-01'};
    let writes=0,loads=0;
    await page.route('**/api/admin/verification-backlog?*',route=>{loads++;return route.fulfill({json:{profiles:[],requests:[request],hasMoreProfiles:false,hasMoreRequests:loads===1}});});
    await page.route('**/api/admin/verification-decisions',async route=>{writes++;const body=route.request().postDataJSON();assert.equal(body.requestId,request.id);assert.ok(body.note.length>=10);await new Promise(resolve=>setTimeout(resolve,150));await route.fulfill({json:{review:{id:request.id,status:body.decision}}});});
    await page.goto(base);
    await page.getByRole('button',{name:'Next requests',exact:true}).click();await page.waitForFunction(()=>!document.body.textContent.includes('Loading requests…'));
    assert.equal(await page.getByRole('button',{name:'Next requests',exact:true}).isDisabled(),true);checks++;
    await page.getByRole('button',{name:'Approve profile review',exact:true}).click();const dialog=page.getByRole('alertdialog');await dialog.waitFor();
    assert.ok((await dialog.textContent()).includes('member-A'));assert.equal(await page.getByRole('button',{name:'Confirm profile review',exact:true}).isDisabled(),true);checks++;
    await page.getByLabel('Review reason (10–1000 characters)').fill('Reviewed member A profile');
    // Tab cycles must remain inside the actual Radix focus trap.
    for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true);}checks++;
    await page.getByRole('button',{name:'Cancel',exact:true}).click();await dialog.waitFor({state:'hidden'});
    await page.getByRole('button',{name:'Reject',exact:true}).click();assert.equal(await page.getByLabel('Review reason (10–1000 characters)').inputValue(),'');checks++;
    await page.getByLabel('Review reason (10–1000 characters)').fill('Member information requires clarification');
    await page.getByRole('button',{name:'Confirm profile review',exact:true}).click();
    await page.getByText('Profile review saved and recorded in the audit log.',{exact:true}).waitFor();assert.equal(writes,1);checks++;
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;
    let auditLoads=0;
    await page.route('**/api/admin/audit-log?*',route=>{auditLoads++;return route.fulfill({json:{events:[{id:'event',actor_id:null,action:'profile_review',target_type:'member',target_id:'member-A',created_at:'2026-11-01T00:00:00Z'}],nextCursor:auditLoads===1?'2026-11-01T00:00:00Z|20000000-0000-4000-8000-000000000001':null}});});
    await page.goto(base+'/#audit');await page.reload();await page.getByRole('button',{name:'Older events',exact:true}).click();await page.getByText('Page 2 · Up to 50 events per page',{exact:true}).waitFor();checks++;
    await page.getByRole('button',{name:'Clear',exact:true}).click();await page.getByText('Page 1 · Up to 50 events per page',{exact:true}).waitFor();checks++;
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);checks++;
    let claims=0;
    await page.route('**/api/membership/premium-launch',async route=>{claims++;assert.deepEqual(route.request().postDataJSON(),{});await new Promise(resolve=>setTimeout(resolve,150));await route.fulfill({json:{plan:'premium',durationMonths:6,startsAt:'2026-11-02T10:00:00Z',endsAt:'2027-05-02T10:00:00Z'}});});
    await page.goto(base+'/#premium');await page.reload();
    await page.getByRole('heading',{name:'Premium — free for 6 months',exact:true}).waitFor();checks++;
    await page.getByRole('button',{name:'Start 6 months free',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Your Premium launch offer is active until'}).waitFor();assert.equal(claims,1);checks++;
    assert.equal(await page.getByRole('button',{name:'Start 6 months free',exact:true}).count(),0);checks++;
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;
    await context.close();await browser.close();browser=null;
    console.log(`PASS admin browser acceptance ${viewport.width}px (13 checks)`);
  }
  console.log(`${checks} desktop/mobile browser checks passed; API responses are fixtures.`);
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
