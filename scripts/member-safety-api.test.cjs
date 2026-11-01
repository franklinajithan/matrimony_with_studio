const {test}=require('node:test');const assert=require('node:assert/strict');
const {load}=require('./helpers/load-ts.cjs');
const id='20000000-0000-4000-8000-000000000001';
function fixture({admin=true,result={data:{id,status:'reviewing'},error:null},fail=false}={}){
 const calls=[];let dbCount=0;
 const db={from(table){calls.push(['from',table]);const q={};for(const method of ['select','order','range','eq','update'])q[method]=(...args)=>{calls.push([method,...args]);return q;};q.maybeSingle=async()=>{if(fail)throw new Error('Unavailable');return result;};q.then=resolve=>Promise.resolve(result).then(resolve);return q;}};
 const api=load('src/app/api/admin/reports/route.ts',{
  'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status||200,headers:init.headers})}},
  '@/lib/auth/admin':{requireServerAdmin:async()=>admin?{id:'admin'}:null},
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>{dbCount++;return db;}},
 });
 const request=(body={id,status:'reviewing',expectedStatus:'pending'},origin='https://cupidmatch.co.uk')=>new Request('https://cupidmatch.co.uk/api/admin/reports',{method:'PATCH',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 return {api,calls,request,dbCount:()=>dbCount};
}
test('both report endpoints reject non-admins before database access',async()=>{
 const f=fixture({admin:false});assert.equal((await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/reports'))).status,403);assert.equal((await f.api.PATCH(f.request())).status,403);assert.equal(f.dbCount(),0);
});
test('cross-origin and malformed moderation requests fail before database access',async()=>{
 for(const [body,origin,status]of [[{id,status:'resolved',expectedStatus:'pending'},'https://evil.example',403],[{id,status:'invented',expectedStatus:'pending'},'https://cupidmatch.co.uk',400],[{id,status:'resolved',expectedStatus:'pending',reviewed_by:'forged'},'https://cupidmatch.co.uk',400]]){
  const f=fixture();assert.equal((await f.api.PATCH(f.request(body,origin))).status,status);assert.equal(f.dbCount(),0);
 }
});
test('valid moderation uses optimistic status check and never accepts client reviewer identity',async()=>{
 const f=fixture();assert.equal((await f.api.PATCH(f.request())).status,200);
 assert.deepEqual(f.calls.find(c=>c[0]==='update'),['update',{status:'reviewing'}]);assert.ok(f.calls.some(c=>c[0]==='eq'&&c[1]==='status'&&c[2]==='pending'));
});
test('stale/hidden report is a conflict and database errors are not success',async()=>{
 const stale=fixture({result:{data:null,error:null}});assert.equal((await stale.api.PATCH(stale.request())).status,409);
 const denied=fixture({result:{data:null,error:{message:'private database detail'}}});const response=await denied.api.PATCH(denied.request());assert.equal(response.status,503);assert.equal(JSON.stringify(response.body).includes('private database'),false);
});
test('report listing validates filters and bounds pagination without caching private evidence',async()=>{
 const f=fixture({result:{data:[],error:null}});
 const response=await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/reports?status=pending&offset=20'));
 assert.equal(response.status,200);assert.equal(response.headers['Cache-Control'],'no-store');assert.deepEqual(f.calls.find(c=>c[0]==='range'),['range',20,39]);
 for(const query of ['status=bogus','offset=-1','offset=1.5','offset=Infinity']){
  const invalid=fixture();assert.equal((await invalid.api.GET(new Request('https://cupidmatch.co.uk/api/admin/reports?'+query))).status,400);assert.equal(invalid.dbCount(),0);
 }
});
