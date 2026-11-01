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
