const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { load } = require('./helpers/load-ts.cjs');
function fixture(getProfile) {
  const file='src/components/profile/MatchDetailsEditor.tsx';
  const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const mocks={};
  for(const statement of ast.statements){if(ts.isImportDeclaration(statement))mocks[statement.moduleSpecifier.text]=Object.fromEntries((statement.importClause?.namedBindings?.elements||[]).map(n=>[n.name.text,n.name.text]));}
  const state=[];let cursor=0,effect,subscriber,unsubscribed=false;const toasts=[];
  mocks.react={useState:(value)=>{const i=cursor++;state[i]=value;return[value,v=>{state[i]=v;}];},useEffect:fn=>{effect=fn;}};
  mocks['@/lib/supabase/auth']={auth:{currentUser:null},onAuthStateChanged:fn=>{subscriber=fn;return()=>{unsubscribed=true;};}};
  mocks['@/lib/supabase/profiles']={getProfile};
  mocks['@/lib/profile-gender']=load('src/lib/profile-gender.ts');
  mocks['@/lib/onboarding/schema']={LANGUAGE_OPTIONS:[{label:'Tamil'}]};
  mocks['@/data/world-countries']={countryOptionsWithLegacy:()=>[]};
  mocks['@/hooks/use-toast']={useToast:()=>({toast:v=>toasts.push(v)})};
  load(file,mocks).MatchDetailsEditor();const cleanup=effect();
  return{state,toasts,auth:user=>subscriber(user),cleanup,unsubscribed:()=>unsubscribed};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('match details loads after cold-start auth hydration',async()=>{
 const f=fixture(async id=>({country:'Canada',extra:{gender:'female',matchDetails:{gender:'Man'}}}));
 assert.equal(f.state[0].country,'');f.auth({uid:'member'});await flush();
 assert.equal(f.state[0].country,'Canada');assert.equal(f.state[0].gender,'Woman');
 f.auth(null);assert.equal(f.state[0].country,'');assert.deepEqual(f.state[1],{});
 f.cleanup();assert.equal(f.unsubscribed(),true);
});
test('older profile loads cannot overwrite a changed account or an unmounted editor',async()=>{
 const pending={};const f=fixture(id=>new Promise(resolve=>{pending[id]=resolve;}));
 f.auth({uid:'first'});f.auth({uid:'second'});
 pending.second({country:'Australia'});await flush();
 pending.first({country:'Old account'});await flush();assert.equal(f.state[0].country,'Australia');
 f.auth({uid:'third'});f.cleanup();pending.third({country:'After unmount'});await flush();
 assert.equal(f.state[0].country,'Australia');
});
test('profile load failures provide feedback without an unhandled rejection',async()=>{
 const f=fixture(async()=>{throw new Error('Offline');});f.auth({uid:'member'});await flush();
 assert.equal(f.toasts[0].title,'Could not load match details');f.cleanup();
});
