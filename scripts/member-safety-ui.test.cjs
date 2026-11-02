const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const {load}=require('./helpers/load-ts.cjs');
function fixture({authenticate=async()=>({data:{user:{id:'viewer'}},error:null}),report=async()=>{},block=async()=>{}}={}){
 const file='src/components/safety/MemberSafetyActions.tsx';const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const mocks={};
 for(const statement of ast.statements)if(ts.isImportDeclaration(statement))mocks[statement.moduleSpecifier.text]=Object.fromEntries((statement.importClause?.namedBindings?.elements||[]).map(n=>[n.name.text,n.name.text]));
 const state=[];let cursor=0;const lock={current:false};const toasts=[],events=[];
 mocks.react={useState:value=>{const i=cursor++;if(!(i in state))state[i]=value;return[state[i],next=>{state[i]=typeof next==='function'?next(state[i]):next;}];},useRef:()=>lock};
 mocks['next/navigation']={useRouter:()=>({replace:path=>events.push(['navigate',path])})};
 mocks['@/hooks/use-toast']={useToast:()=>({toast:value=>toasts.push(value)})};
 mocks['@/lib/supabase/client']={supabase:{auth:{getUser:authenticate}}};
 mocks['@/lib/supabase/reports']={createReport:async value=>{events.push(['report',value]);await report(value);}};
 mocks['@/lib/supabase/blocks']={blockUser:async(...args)=>{events.push(['block',...args]);await block(...args);}};
 const api=load(file,mocks);const render=()=>{cursor=0;return api.MemberSafetyActions({memberId:'member'});};
 function find(node,label){if(!node||typeof node!=='object')return; if(node.type==='Button'&&node.props.children===label)return node;for(const child of[node.props?.children].flat(Infinity)){const result=find(child,label);if(result)return result;}}
 const action=label=>{const button=find(render(),label);assert.ok(button,`Missing ${label}`);return button.props.onClick;};
 return{state,toasts,events,lock,action,click:label=>action(label)()};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('report confirms only after persistence and derives reporter from verified auth',async()=>{
 let release;const f=fixture({report:()=>new Promise(resolve=>{release=resolve;})});f.click('Report member');f.click('Submit report');await flush();assert.equal(f.toasts.length,0);assert.deepEqual(f.events[0],['report',{reporterId:'viewer',reportedId:'member',reason:'safety_concern',description:''}]);release();await flush();assert.equal(f.toasts[0].title,'Report submitted');assert.equal(f.state[0],null);
});
test('block persists before navigating away and duplicate clicks share an auth lock',async()=>{
 let release;const f=fixture({authenticate:()=>new Promise(resolve=>{release=resolve;})});f.click('Block member');const submit=f.action('Confirm block');submit();submit();assert.equal(f.events.length,0);release({data:{user:{id:'viewer'}},error:null});await flush();assert.deepEqual(f.events,[['block','viewer','member'],['navigate','/discover']]);assert.equal(f.lock.current,false);
});
test('failed reporting stays open, preserves feedback and permits retry',async()=>{
 let fail=true;const f=fixture({report:async()=>{if(fail)throw{message:'Reports temporarily unavailable'};}});f.click('Report member');f.click('Submit report');await flush();assert.equal(f.toasts[0].description,'Reports temporarily unavailable');assert.equal(f.state[0],'report');assert.equal(f.lock.current,false);fail=false;f.click('Submit report');await flush();assert.equal(f.toasts.at(-1).title,'Report submitted');
});
test('expired sessions never submit a report or block',async()=>{
 const f=fixture({authenticate:async()=>({data:{user:null},error:null})});f.click('Block member');f.click('Confirm block');await flush();assert.equal(f.events.length,0);assert.match(f.toasts[0].description,/session has expired/);assert.equal(f.lock.current,false);
});

function blockedFixture(list) {
 const state = []; let cursor = 0, effectDeps, cleanup, subscriber;
 let subscriptions = 0, unsubscriptions = 0;
 const mocks = {
  react: {
   useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next; }]; },
   useRef: () => ({current: false}),
   useEffect: (effect, deps) => { if (!effectDeps || deps.some((value, i) => value !== effectDeps[i])) { cleanup?.(); effectDeps = deps; cleanup = effect(); } },
  },
  '@/lib/supabase/auth': {onAuthStateChanged: callback => { subscriptions++; subscriber = callback; callback({uid: 'viewer'}); return () => { unsubscriptions++; }; }},
  '@/lib/supabase/client': {supabase: {}},
  '@/lib/supabase/blocks': {listBlocks: list},
  '@/components/ui/button': {Button: 'Button'},
  '@/components/ui/card': Object.fromEntries(['Card','CardContent','CardHeader','CardTitle'].map(name => [name,name])),
  '@/hooks/use-toast': {useToast: () => ({toast() {}})},
 };
 const {BlockedMembers} = load('src/components/safety/BlockedMembers.tsx', mocks);
 function render() { cursor = 0; return BlockedMembers(); }
 function find(node, predicate) { if (!node || typeof node !== 'object') return; if (predicate(node)) return node; for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; } }
 return {render, state, find, auth: user => subscriber(user), unmount: () => cleanup(), counts: () => ({subscriptions, unsubscriptions})};
}
test('blocked list retries a failed load in place and clears the error after success', async () => {
 let attempts = 0;
 const f = blockedFixture(async () => { if (++attempts === 1) throw Error('offline'); return [{id:'block', reference:'CM-000002'}]; });
 f.render(); await flush();
 const failed = f.render(); assert.ok(f.find(failed, node => node.props?.role === 'alert'));
 f.find(failed, node => node.type === 'Button' && node.props.children === 'Try again').props.onClick();
 f.render(); await flush(); const recovered = f.render();
 assert.equal(attempts, 2); assert.equal(f.find(recovered, node => node.props?.role === 'alert'), undefined);
 assert.equal(f.state[0][0].reference, 'CM-000002');
 assert.deepEqual(f.counts(), {subscriptions: 2, unsubscriptions: 1}); f.unmount();
});
test('retried blocked list ignores stale requests and signed-out results', async () => {
 const pending = []; const f = blockedFixture(() => new Promise((resolve, reject) => pending.push({resolve, reject})));
 f.render(); pending[0].reject(Error('offline')); await flush();
 const failed = f.render(); f.find(failed, node => node.type === 'Button' && node.props.children === 'Try again').props.onClick(); f.render();
 f.auth({uid:'other'}); pending[1].resolve([{id:'stale'}]); await flush(); assert.equal(f.state[0].length, 0);
 f.auth(null); pending[2].resolve([{id:'private'}]); await flush(); assert.equal(f.state[0].length, 0); assert.equal(f.state[1], false);
 f.unmount();
});
