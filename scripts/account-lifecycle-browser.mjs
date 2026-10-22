/** UI-only test: temporary harness, fake Auth responses, no real accounts. */
import { chromium, webkit, devices } from '@playwright/test';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),harness=new URL('src/app/account-lifecycle-qa/',root);
const base='http://127.0.0.1:54331';
const id='10000000-0000-4000-8000-000000000001';
const now=Math.floor(Date.now()/1000);
const jwt=[{alg:'HS256',typ:'JWT'},{sub:id,aud:'authenticated',role:'authenticated',exp:now+3600,iat:now,session_id:'20000000-0000-4000-8000-000000000001',amr:[{method:'password',timestamp:now}]}].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.fake-ui-only';
const user={id,aud:'authenticated',role:'authenticated',email:'disposable-ui@example.com',app_metadata:{provider:'email',providers:['email']},user_metadata:{},identities:[],created_at:new Date().toISOString()};
const session={access_token:jwt,refresh_token:'fake-ui-only',expires_in:3600,expires_at:now+3600,token_type:'bearer',user};
let server;
const results=[];
try {
 await mkdir(harness,{recursive:true});
 await writeFile(new URL('page.tsx',harness),'import { AccountLifecycle } from "@/components/account/AccountLifecycle"; export default function QA(){return <main className="mx-auto max-w-2xl p-4"><AccountLifecycle /></main>}');
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','54331'],{cwd:root,env:{...process.env,NEXT_DIST_DIR:'.next-account-qa',NEXT_PUBLIC_SUPABASE_URL:'https://placeholder.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'fake-ui-only'},stdio:'ignore'});
 for(let i=0;i<120;i++){try{if((await fetch(base+'/account-lifecycle-qa')).ok)break}catch{}await new Promise(r=>setTimeout(r,500));}
 for(const [name,type,options] of [['desktop',chromium,devices['Desktop Chrome']],['android-emulation',chromium,devices['Pixel 7']],['iphone-webkit',webkit,devices['iPhone 13']]]){
  let browser;
  try {
   browser=await type.launch();const context=await browser.newContext(options);
   await context.addCookies([{name:'sb-placeholder-auth-token',value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url'),url:base}]);
   const page=await context.newPage();let deleted=false,deactivated=false;
   await page.route('**/auth/v1/**',route=>route.fulfill({json:route.request().url().includes('/user')?user:session}));
   await page.route('**/api/account',async route=>{
    if(route.request().method()==='GET')return route.fulfill({json:{deactivated}});
    const body=route.request().postDataJSON();assert.equal(body.confirmation,body.action==='delete'?'DELETE':'CONFIRM');
    if(body.action==='delete')deleted=true;else deactivated=body.action==='deactivate';
    return route.fulfill({json:{success:true}});
   });
   await page.goto(base+'/account-lifecycle-qa');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.getByRole('button',{name:'Deactivate Account',exact:true}).click();
   await page.getByLabel('Current password').fill('not-a-real-password');await page.getByRole('button',{name:'Verify password',exact:true}).click();
   await page.getByLabel('Type CONFIRM to confirm').fill('CONFIRM');await page.getByRole('button',{name:'Deactivate Account',exact:true}).last().click();
   await page.getByRole('button',{name:'Reactivate Account',exact:true}).waitFor();assert.equal(deactivated,true);
   await page.getByRole('button',{name:'Delete Account Permanently',exact:true}).click();
   const confirm=page.getByRole('button',{name:'Delete Account Permanently',exact:true}).last();assert.equal(await confirm.isEnabled(),false);
   await page.getByLabel('Current password').fill('not-a-real-password');await page.getByRole('button',{name:'Verify password',exact:true}).click();
   await page.getByLabel('Type DELETE to confirm').fill('DELETE');
   await page.evaluate(()=>localStorage.setItem('qa-member-state','private'));
   await confirm.click();await page.waitForURL(base+'/');assert.equal(deleted,true);assert.equal(await page.evaluate(()=>localStorage.getItem('qa-member-state')),null);
   results.push({device:name,status:'passed',scope:'mocked UI; not a physical installed PWA'});
  }catch(error){results.push({device:name,status:'failed',error:error.message})}finally{await browser?.close()}
 }
 console.log(JSON.stringify(results,null,2));if(results.some(r=>r.status!=='passed'))process.exitCode=1;
}finally{
 server?.kill('SIGTERM');await rm(harness,{recursive:true,force:true});
 const config=new URL('tsconfig.json',root);
 await writeFile(config,(await readFile(config,'utf8')).replace(',\n    ".next-account-qa/types/**/*.ts"',''));
 await rm(new URL('.next-account-qa/',root),{recursive:true,force:true});
}
