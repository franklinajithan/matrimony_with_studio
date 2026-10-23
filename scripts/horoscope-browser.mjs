/** Component UI checks with mocked APIs. No real accounts, uploads or member data. */
import { chromium, webkit, devices } from '@playwright/test';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url), route=new URL('src/app/horoscope-ui-qa/',root);
const dist='.next-horoscope-qa',base='http://127.0.0.1:54332';
const results=[];
let server;
const originalConfig=await readFile(new URL('tsconfig.json',root),'utf8');
const profiles=[
 ['desktop',chromium,devices['Desktop Chrome']],
 ['android-emulation',chromium,devices['Pixel 7']],
 ['iphone-webkit-emulation',webkit,devices['iPhone 13']],
 ['small-mobile',chromium,{viewport:{width:320,height:740}}],
];
const noOverflow=async page=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal page overflow');
try{
 await mkdir(new URL('artifacts/horoscope-ui/',root),{recursive:true});
 await mkdir(route,{recursive:true});
 await writeFile(new URL('page.tsx',route),'import HoroscopeStudio from "@/components/horoscope/HoroscopeStudio"; export default function QA(){return <HoroscopeStudio />}');
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','54332'],{
  cwd:root,env:{...process.env,NEXT_DIST_DIR:dist,NEXT_PUBLIC_SUPABASE_URL:'https://placeholder.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'ui-only'},stdio:'ignore',
 });
 let ready=false;
 for(let i=0;i<180;i++){
  try{if((await fetch(base+'/horoscope-ui-qa',{signal:AbortSignal.timeout(5000)})).ok){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 assert.ok(ready,'Temporary UI server did not start');
 for(const [device,engine,options] of profiles){
  let browser;
  try{
   browser=await engine.launch();
   const context=await browser.newContext(options),page=await context.newPage();
   let record=null,paused=false,conflict=true;
   await page.route('**/api/horoscope**',async request=>{
    const parsed=new URL(request.request().url()),method=request.request().method();
    const settings={horoscope_enabled:!paused,horoscope_upload_enabled:false,ai_horoscope_matching_enabled:false};
    if(parsed.pathname.endsWith('/documents'))return request.fulfill({json:{documents:[],providerConfigured:false}});
    if(method==='GET')return request.fulfill({json:{profile:record,settings}});
    if(method==='DELETE'){record=null;return request.fulfill({json:{deleted:true}});}
    assert.equal(method,'PUT');
    const body=request.request().postDataJSON();
    assert.equal(body.visibility,'private');assert.equal(body.fields.timeQuality,'unknown');
    assert.equal(body.ai_consent,false);assert.deepEqual(body.shared_fields,[]);
    if(conflict){conflict=false;return request.fulfill({status:409,json:{error:'Your horoscope changed. Reload before saving.'}});}
    record={...body,user_id:'10000000-0000-4000-8000-000000000001',revision:1,provenance:{planets:[]}};
    return request.fulfill({json:{profile:record}});
   });
   await page.goto(base+'/horoscope-ui-qa');
   await page.getByRole('heading',{name:'My Horoscope',exact:true}).waitFor();
   await noOverflow(page);
   const save=page.getByRole('button',{name:'Confirm & Save horoscope',exact:true});
   assert.equal(await save.isEnabled(),false);
   assert.equal(await page.locator('input[type="time"]').isEnabled(),false);
   await page.locator('input[type="date"]').fill('1990-01-01');
   for(const [name,value] of [['Birth city','London'],['Birth country','UK'],['Birth timezone (IANA)','Europe/London'],['Native language','Tamil']])
    await page.getByRole('textbox',{name,exact:true}).fill(value);
   await page.getByRole('checkbox',{name:/I have reviewed the values/}).check();
   await save.click();
   await page.getByRole('alert').filter({hasText:'Reload before saving'}).waitFor();
   assert.equal(await page.getByRole('textbox',{name:'Birth city',exact:true}).inputValue(),'London');
   await save.click();await page.getByRole('status').filter({hasText:'Saved privately.'}).waitFor();
   await page.getByRole('button',{name:'Preview',exact:true}).click();
   await page.getByRole('heading',{name:'Horoscope preview',exact:true}).waitFor();
   await noOverflow(page);
   await page.screenshot({path:new URL(`artifacts/horoscope-ui/${device}.png`,root).pathname,fullPage:true});
   await page.getByRole('button',{name:'Edit details',exact:true}).click();
   paused=true;await page.reload();
   await page.getByRole('heading',{name:'Horoscope rollout is paused'}).waitFor();
   assert.equal(await page.getByRole('textbox',{name:'Birth city',exact:true}).isEnabled(),false);
   assert.equal(await page.getByRole('button',{name:'Export my data',exact:true}).isEnabled(),true);
   const download=page.waitForEvent('download');
   await page.getByRole('button',{name:'Export my data',exact:true}).click();await download;
   page.once('dialog',dialog=>dialog.accept());
   await page.getByRole('button',{name:'Delete horoscope',exact:true}).click();
   await page.getByRole('status').filter({hasText:'Horoscope and source documents deleted.'}).waitFor();
   assert.equal(record,null);await noOverflow(page);
   results.push({device,status:'passed',scope:'mocked component UI; not physical Safari/PWA acceptance'});
  }catch(error){results.push({device,status:'failed',error:error.message});}
  finally{await browser?.close();}
 }
}finally{
 if(server){server.kill('SIGTERM');await new Promise(resolve=>{server.once('exit',resolve);setTimeout(resolve,3000);});}
 await rm(route,{recursive:true,force:true});
 await writeFile(new URL('tsconfig.json',root),originalConfig);
 await rm(new URL(dist+'/',root),{recursive:true,force:true});
 await mkdir(new URL('artifacts/horoscope-ui/',root),{recursive:true});
 await writeFile(new URL('artifacts/horoscope-ui/results.json',root),JSON.stringify(results,null,2));
}
console.log(JSON.stringify(results,null,2));
if(results.length!==profiles.length||results.some(r=>r.status!=='passed'))process.exitCode=1;
