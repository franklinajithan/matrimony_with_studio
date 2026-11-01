const {test}=require('node:test');const assert=require('node:assert/strict');const {createClient}=require('@supabase/supabase-js');
const {load}=require('./helpers/load-ts.cjs');
function fixture(responses){const calls=[];const db=createClient('https://example.supabase.co','test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url,init)=>{calls.push({url:new URL(url),headers:new Headers(init.headers),body:init.body&&JSON.parse(init.body),method:init.method});assert.ok(responses.length,'Unexpected HTTP request');const response=responses.shift();return new Response(JSON.stringify(response),{status:200,headers:{'Content-Type':'application/json'}});}}});
 const api=load('src/lib/supabase/blocks.ts',{'./client':{supabase:db},'./timestamp':{Timestamp:{fromISO:value=>value,now:()=>null}}});return{api,calls};}
test('mutual block check uses scoped server boolean and never cardinality-sensitive row selection',async()=>{
 const f=fixture([true,false,null]);assert.equal(await f.api.areBlocked('a','b'),true);assert.equal(await f.api.areBlocked('a','b'),false);await assert.rejects(f.api.areBlocked('a','b'),/Could not verify/);
 assert.match(f.calls[0].url.pathname,/rpc\/are_blocked$/);assert.deepEqual(f.calls[0].body,{user_a:'a',user_b:'b'});
});
test('repeat blocking ignores duplicates without requiring update privileges',async()=>{
 const f=fixture([null]);await f.api.blockUser('a','b');assert.match(f.calls[0].headers.get('prefer'),/resolution=ignore-duplicates/);assert.equal(f.calls[0].url.searchParams.get('on_conflict'),'blocker_id,blocked_id');
});
test('unblock verifies affected row and fails on zero-row denial or stale state',async()=>{
 const f=fixture([[{id:'block'}],[]]);await f.api.unblockUser('a','b');assert.equal(f.calls[0].method,'DELETE');assert.equal(f.calls[0].url.searchParams.get('blocker_id'),'eq.a');assert.equal(f.calls[0].url.searchParams.get('blocked_id'),'eq.b');await assert.rejects(f.api.unblockUser('a','b'),/no longer available/);
});
test('block list is server-owned and renders public references instead of internal IDs',async()=>{
 const f=fixture([[{id:'block',blocker_id:'a',blocked_id:'b',reference:'CM-000002',created_at:'2026-01-01'}]]);const rows=await f.api.listBlocks('untrusted-user',500);assert.equal(rows[0].reference,'CM-000002');assert.match(f.calls[0].url.pathname,/rpc\/own_blocked_members$/);assert.deepEqual(f.calls[0].body,{p_limit:500});
});
