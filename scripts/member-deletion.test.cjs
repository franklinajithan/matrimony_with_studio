const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
function load(file, mocks={}) {
 const mod={exports:{}};
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(n=>{if(n==='server-only')return {};if(n in mocks)return mocks[n];throw Error(n)},mod,mod.exports);
 return mod.exports;
}
const {hasRecentAuthentication}=load('src/lib/account/recent-auth.ts');
test('recent authentication uses AMR, rejects refresh iat, missing, future and stale proof',()=>{
 const now=Date.now(),timestamp=Math.floor(now/1000);
 for(const method of ['password','otp','oauth'])assert.equal(hasRecentAuthentication({amr:[{method,timestamp}]},now),true);
 for(const claims of [{},{iat:timestamp},{amr:[{method:'password',timestamp:timestamp-301}]},{amr:[{method:'password',timestamp:timestamp+120}]},{amr:[{method:'anonymous',timestamp}]}])assert.equal(hasRecentAuthentication(claims,now),false);
});
const {deleteAccount}=load('src/lib/account/deletion.ts');
function setup(options={}) {
 const calls=[];let state=options.completed?'completed':options.prior?'failed':null,exists=!options.absent,objects=Array.from({length:205},(_,i)=>({bucket_id:i%2?'media':'horoscope-private',name:`owned/${i}`}));
 const ok={error:null,data:null};
 const db={
  from(table){let operation='select',patch;const q={
   select(){return q},eq(){return q},or(){return q},
   update(p){operation='update';patch=p;return q},
   async maybeSingle(){if(operation==='update'){calls.push('claim');if(options.claimed)return {data:null,error:null};state=patch.state;return {data:{user_id:'member',attempts:0},error:null}}return {data:state?{state}:null,error:null}},
   async single(){return {data:{is_admin:!!options.admin},error:null}},
   then(resolve){calls.push(`ledger:${patch.state}`);if(!options.ledgerFail)state=patch.state;return Promise.resolve({error:options.ledgerFail&&patch.state==='completed'?Error():null}).then(resolve)}
  };return q},
  async rpc(name){calls.push(name);if(name==='account_billing_active')return {data:!!options.paid,error:options.billingFail?Error():null};if(name==='account_begin_deletion'){state='pending';return ok}if(name==='account_storage_objects')return {data:objects.slice(0,100),error:options.storageFail?Error():null};if(name==='account_erase_residuals')return {error:options.residualFail?Error():null};throw Error(name)},
  auth:{admin:{
   async getUserById(){return {data:{user:exists?{id:'member',email:'test@example.com',identities:options.identities||[{provider:'email'}]}:null},error:exists?null:{status:404}}},
   async updateUserById(){calls.push('ban');return {error:options.banFail?Error():null}},
   async deleteUser(id,soft){calls.push(['deleteAuth',id,soft]);if(options.authFail)return {error:Error()};exists=false;return ok}
  }},
  storage:{from(bucket){return {async remove(paths){calls.push(['files',bucket,paths.length]);objects=objects.filter(o=>o.bucket_id!==bucket||!paths.includes(o.name));return ok}}}}
 };
 return {db,calls,run:()=>deleteAccount(db,'member','actor','test@example.com'),state:()=>state};
}
for(const [label,identities] of [['email',[{provider:'email'}]],['Google',[{provider:'google'}]],['linked',[{provider:'email'},{provider:'google'}]]])test(`${label}: batches files before hard Auth deletion, handles repeated request`,async()=>{
 const s=setup({identities});await s.run();assert.equal(s.calls.filter(c=>c[0]==='files').reduce((sum,c)=>sum+c[2],0),205);assert.deepEqual(s.calls.find(c=>c[0]==='deleteAuth'),['deleteAuth','member',false]);assert.ok(s.calls.indexOf('account_erase_residuals')<s.calls.findIndex(c=>c[0]==='deleteAuth'));const count=s.calls.length;await s.run();assert.equal(s.calls.length,count);
});
for(const option of ['storageFail','authFail','residualFail','banFail'])test(`${option} records recoverable failure and never reports success`,async()=>{const s=setup({[option]:true});await assert.rejects(s.run(),/pending recovery/);assert.equal(s.state(),'failed');if(option!=='authFail')assert.ok(!s.calls.some(c=>c[0]==='deleteAuth'))});
test('protect admin accounts and paid subscriptions before requesting deletion',async()=>{for(const o of [{admin:true},{paid:true},{billingFail:true}]){const s=setup(o);await assert.rejects(s.run());assert.ok(!s.calls.includes('account_begin_deletion'))}});
test('concurrent processing does not run destructive steps twice',async()=>{const s=setup({claimed:true});await assert.rejects(s.run(),/already in progress/);assert.ok(!s.calls.includes('ban'))});
test('lost completion after Auth deletion can recover without the Auth identity',async()=>{const s=setup({prior:true,absent:true});await s.run();assert.equal(s.state(),'completed');assert.ok(!s.calls.includes('ban'))});
test('confirmation email cannot target a different member',async()=>{const s=setup();await assert.rejects(deleteAccount(s.db,'member','admin','wrong@example.com'),/does not match/);assert.ok(!s.calls.includes('account_begin_deletion'))});
test('same-origin and strict admin checks precede service-role deletion',async()=>{
 const deletion=load('src/lib/account/deletion.ts');let called=false;
 const api=load('src/app/api/admin/delete-member/route.ts',{
  'next/server':{NextResponse:{json:(body,init)=>({body,status:init.status})}},
  '@/lib/auth/admin':{requireServerAdmin:async()=>({id:'admin'})},
  '@/lib/account/server':{recentAccountUser:async()=>null},
  '@/lib/account/deletion':deletion,
  '@/lib/account/edge':{invokeAccountOperation:()=>{called=true}}
 });
 assert.equal((await api.POST(new Request('https://cupidmatch.co.uk/api/admin/delete-member',{method:'POST',headers:{origin:'https://evil.example'}}))).status,403);
 assert.equal((await api.POST(new Request('https://cupidmatch.co.uk/api/admin/delete-member',{method:'POST',headers:{origin:'https://cupidmatch.co.uk'}}))).status,401);assert.equal(called,false);
});
test('Edge deployment copies match the tested server modules',()=>{
 for(const file of ['deletion','recent-auth'])assert.equal(fs.readFileSync(`supabase/functions/account-lifecycle/${file}.ts`,'utf8'),fs.readFileSync(`src/lib/account/${file}.ts`,'utf8'));
});
function edge(options={}) {
 let handler;const deleted=[];const now=Math.floor(Date.now()/1000),id='10000000-0000-4000-8000-000000000001';
 const token='header.'+Buffer.from(JSON.stringify({amr:[{method:'password',timestamp:options.stale?now-600:now}]})).toString('base64url')+'.signature';
 const admin={auth:{getUser:async()=>({data:{user:options.anonymous?null:{id}},error:null})}};
 const member={rpc:async name=>({data:name==='is_admin'?!!options.admin:!options.revoked,error:null})};
 const mocks={
  '@supabase/supabase-js':{createClient:(_url,key)=>key==='service'?admin:member},
  './deletion.ts':{deleteAccount:async(...args)=>deleted.push(args),DeletionError:load('src/lib/account/deletion.ts').DeletionError},
  './recent-auth.ts':{hasRecentAuthentication},
 };
 const mod={exports:{}};const source=ts.transpileModule(fs.readFileSync('supabase/functions/account-lifecycle/index.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{require:n=>mocks[n],module:mod,exports:mod.exports,Deno:{env:{get:key=>key==='SUPABASE_SERVICE_ROLE_KEY'?'service':'anon'},serve:fn=>{handler=fn}},Request,Response,TextDecoder,TextEncoder,Uint8Array,atob,crypto:require('node:crypto').webcrypto,console});
 return {id,deleted,run:body=>handler(new Request('https://project.supabase.co/functions/v1/account-lifecycle',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(body)}))};
}
for(const options of [{anonymous:true},{stale:true},{revoked:true}])test(`Edge denies invalid caller ${JSON.stringify(options)}`,async()=>{const s=edge(options);assert.equal((await s.run({action:'delete',confirmation:'DELETE'})).status,401);assert.equal(s.deleted.length,0)});
test('Edge refuses admin deletion by ordinary members and wrong confirmation',async()=>{
 const s=edge();assert.equal((await s.run({action:'admin-delete',confirmation:'DELETE'})).status,403);assert.equal((await s.run({action:'delete',confirmation:'yes'})).status,400);assert.equal(s.deleted.length,0);
});
test('Edge self deletion derives target from verified identity, ignores supplied IDs',async()=>{
 const s=edge();assert.equal((await s.run({action:'delete',confirmation:'DELETE',memberId:'victim'})).status,200);assert.equal(s.deleted[0][1],s.id);assert.equal(s.deleted[0][2],s.id);
});
