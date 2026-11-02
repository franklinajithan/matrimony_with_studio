const {test}=require('node:test');const assert=require('node:assert/strict');const {load}=require('./helpers/load-ts.cjs');
const id='20000000-0000-4000-8000-000000000001';
function fixture(file,{admin=true,result={data:{id,status:'approved'},error:null},throws=false}={}){
 const calls=[];let reads=0;
 const db={async rpc(name,args){calls.push(['rpc',name,args]);if(throws)throw Error('secret');return result;},from(table){calls.push(['from',table]);const q={};for(const method of ['select','order','limit','range','eq','update'])q[method]=(...args)=>{calls.push([method,...args]);return q;};q.maybeSingle=async()=>{if(throws)throw Error('secret');return result;};q.then=(resolve,reject)=>{if(throws)return Promise.reject(Error('secret')).then(resolve,reject);return Promise.resolve(result).then(resolve,reject);};return q;}};
 const api=load(`src/app/api/admin/${file}/route.ts`,{'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status||200,headers:init.headers})}},'@/lib/auth/admin':{requireServerAdmin:async()=>admin?{id:'verified-admin'}:null},'@/lib/supabase/server':{createSupabaseServerClient:async()=>{reads++;return db;}}});
 const request=(body={id,status:'approved',expectedStatus:'pending',note:'Reviewed consent and content'},origin='https://cupidmatch.co.uk')=>new Request(`https://cupidmatch.co.uk/api/admin/${file}`,{method:'PATCH',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 return {api,calls,request,reads:()=>reads};
}
test('all four admin endpoints fail closed before accessing data',async()=>{
 for(const name of ['success-stories','plans','subscriptions','billing-events']){const f=fixture(name,{admin:false});assert.equal((await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/'+name))).status,403);if(f.api.PATCH)assert.equal((await f.api.PATCH(f.request())).status,403);assert.equal(f.reads(),0);}
});
test('story reviews reject cross-origin, forged fields, short reasons and unchanged decisions',async()=>{
 const body={id,status:'approved',expectedStatus:'pending',note:'Reviewed consent and content'};
 for(const [payload,origin,status]of [[body,'https://evil.example',403],[{...body,actor:'forged'},'https://cupidmatch.co.uk',400],[{...body,note:'short'},'https://cupidmatch.co.uk',400],[{...body,status:'pending'},'https://cupidmatch.co.uk',400]]){const f=fixture('success-stories');assert.equal((await f.api.PATCH(f.request(payload,origin))).status,status);assert.equal(f.reads(),0);}
});
test('story review writes only decision/reason and matches previous status',async()=>{
 const f=fixture('success-stories');assert.equal((await f.api.PATCH(f.request())).status,200);assert.deepEqual(f.calls.find(c=>c[0]==='rpc'),['rpc','admin_review_success_story',{p_id:id,p_status:'approved',p_expected_status:'pending',p_note:'Reviewed consent and content'}]);assert.equal(f.calls.some(c=>c[0]==='update'),false);
});
test('stale decisions conflict and database errors are redacted',async()=>{
 const stale=fixture('success-stories',{result:{data:null,error:null}});assert.equal((await stale.api.PATCH(stale.request())).status,409);
 const broken=fixture('success-stories',{throws:true});const result=await broken.api.PATCH(broken.request());assert.equal(result.status,503);assert.ok(!JSON.stringify(result.body).includes('secret'));
});
test('story list is paginated and excludes contact details and private notes',async()=>{
 const f=fixture('success-stories',{result:{data:[],error:null}});const result=await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/success-stories?status=pending&offset=20'));
 assert.equal(result.status,200);assert.match(result.headers['Cache-Control'],/no-store/);assert.deepEqual(f.calls.find(c=>c[0]==='range'),['range',20,39]);assert.doesNotMatch(f.calls.find(c=>c[0]==='select')[1],/contact_email|admin_notes|original_story_text/);
 for(const q of ['offset=-1','offset=Infinity','offset=1.5','status=bad']){const invalid=fixture('success-stories');assert.equal((await invalid.api.GET(new Request('https://cupidmatch.co.uk/api/admin/success-stories?'+q))).status,400);assert.equal(invalid.reads(),0);}
});
test('catalogue and billing reads are bounded, private, explicit projections and retryable',async()=>{
 for(const name of ['plans','subscriptions','billing-events']){const f=fixture(name,{result:{data:[],error:null}});const response=await f.api.GET();assert.equal(response.status,200);assert.match(response.headers['Cache-Control'],/private, no-store/);assert.deepEqual(f.calls.find(c=>c[0]==='limit'),['limit',250]);assert.doesNotMatch(f.calls.find(c=>c[0]==='select')[1],name==='plans'?/stripe|payload/:/\*|stripe|payload/);const broken=fixture(name,{throws:true});assert.equal((await broken.api.GET()).status,503);}
});
test('workload checks admin access and uses exact server counts without loading member data',async()=>{
 const denied=fixture('workload',{admin:false});assert.equal((await denied.api.GET()).status,403);assert.equal(denied.reads(),0);
 let count=0;const calls=[];
 const api=load('src/app/api/admin/workload/route.ts',{
  'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status||200,headers:init.headers})}},
  '@/lib/auth/admin':{requireServerAdmin:async()=>({id:'admin'})},
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>({from:table=>{const result={data:null,count:++count,error:null};const q={then:resolve=>Promise.resolve(result).then(resolve)};for(const method of ['select','eq','gte','in'])q[method]=(...args)=>{calls.push([table,method,...args]);return q;};return q;}})},
 });
 const response=await api.GET();assert.equal(response.status,200);assert.deepEqual(response.body.counts,{publishedProfiles:1,newMembers:2,verificationRequests:3,openReports:4,pendingStories:5,activeSubscriptions:6});assert.ok(calls.filter(c=>c[1]==='select').every(c=>c[3].head===true&&c[3].count==='exact'));
});
test('workload failures never become misleading zero counts',async()=>{
 for(const count of [null,-1,1.5]){const f=fixture('workload',{result:{data:null,count,error:null}});assert.equal((await f.api.GET()).status,503);}
});
test('live plan schema maps is_active and preserves absent term pricing without inventing prices',async()=>{
 const f=fixture('plans',{result:{data:[{code:'premium',name:'Premium',is_active:false,currency:'GBP',monthly_price_pence:999,entitlements:{},unrecognized_internal_field:'hidden'}],error:null}});
 const response=await f.api.GET();assert.equal(response.body.plans[0].active,false);assert.equal(response.body.plans[0].three_month_price_pence,null);assert.equal(response.body.plans[0].monthly_price_pence,999);assert.equal('unrecognized_internal_field' in response.body.plans[0],false);
});
test('dashboard returns healthy counts when a staged table is absent',async()=>{
 const api=load('src/app/api/admin/workload/route.ts',{
  'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status||200})}},
  '@/lib/auth/admin':{requireServerAdmin:async()=>({id:'admin'})},
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>({from:table=>{const q={then:resolve=>Promise.resolve({count:table==='reports'?null:7,error:table==='reports'?{code:'42P01'}:null}).then(resolve)};for(const name of ['select','eq','in','gte'])q[name]=()=>q;return q;}})},
 });
 const response=await api.GET();assert.equal(response.status,200);assert.equal(response.body.counts.openReports,null);assert.equal(response.body.counts.pendingStories,7);
});
