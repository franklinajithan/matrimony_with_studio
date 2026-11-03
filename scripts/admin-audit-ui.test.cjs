const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./helpers/load-ts.cjs');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const event={id:'event-1',actor_id:null,action:'member_trial_granted',target_type:'member',target_id:'first-result',created_at:'2026-11-02T10:00:00Z'};
const response=(body,status=200)=>({ok:status===200,status,json:async()=>body});
function fixture(t,fetcher){
 const previous=global.fetch;global.fetch=fetcher;
 const states=[],effects=[];let s=0,e=0;const pending=[];
 const cleanup=()=>effects.forEach(effect=>effect.dispose?.());t.after(()=>{global.fetch=previous;cleanup();});
 const react={useState:initial=>{const i=s++;if(!(i in states))states[i]=initial;return[states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];},useEffect:(cb,deps)=>{const i=e++;if(!effects[i]||deps.some((v,n)=>effects[i].deps[n]!==v)){const old=effects[i];effects[i]={deps};pending.push(()=>{old?.dispose?.();effects[i].dispose=cb();});}}};
 const component=load('src/app/admin/security/audit-explorer.tsx',{react,'@/components/ui/button':{Button:'Button'},'@/components/ui/input':{Input:'Input'}}).default;
 const render=()=>{s=e=0;const tree=component();while(pending.length)pending.shift()();return tree;};
 function all(node,predicate){if(!node||typeof node!=='object')return[];return[...(predicate(node)?[node]:[]),...[node.props?.children].flat(Infinity).flatMap(child=>all(child,predicate))];}
 const find=predicate=>all(render(),predicate)[0];
 const button=label=>{const node=find(n=>n.type==='Button'&&n.props.children===label);assert.ok(node,'Missing button '+label);return node;};
 const input=(placeholder,value)=>{const node=find(n=>n.type==='Input'&&n.props.placeholder===placeholder);assert.ok(node);node.props.onChange({target:{value}});};
 const submit=()=>find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
 return {render,find,button,input,submit,cleanup};
}
async function ready(f){f.render();await flush();f.render();}
test('security page renders the real explorer only after the server admin guard',async()=>{
 let authorized=false;
 const api=load('src/app/admin/security/page.tsx',{'@/app/admin/guard':{requireAdminPage:async()=>{if(!authorized)throw Error('Denied');}},'./audit-explorer':{default:'AuditExplorer'}});
 await assert.rejects(api.default(),/Denied/);authorized=true;assert.equal((await api.default()).type,'AuditExplorer');
});
test('initial audit failures show retry without a misleading no-activity message',async t=>{
 let count=0;const f=fixture(t,async()=>{if(++count===1)throw Error('offline');return response({events:[event],nextCursor:null});});
 await ready(f);assert.ok(f.find(n=>n.props?.role==='alert'));assert.equal(f.find(n=>n.props?.children==='No matching activity found.'),undefined);
 f.button('Retry audit records').props.onClick();await ready(f);assert.ok(f.find(n=>n.type==='article'));assert.equal(count,2);
});
test('clear/filter changes ignore older responses even when fetch does not honor abort',async t=>{
 const requests=[];const f=fixture(t,(url,opts)=>new Promise(resolve=>requests.push({url,opts,resolve})));
 f.render();f.button('Clear').props.onClick();f.render();assert.equal(requests[0].opts.signal.aborted,true);
 requests[1].resolve(response({events:[{...event,target_id:'current-results'}],nextCursor:null}));await flush();f.render();
 requests[0].resolve(response({events:[{...event,target_id:'obsolete-results'}],nextCursor:'old'}));await flush();
 assert.ok(f.find(n=>Array.isArray(n.props?.children)&&n.props.children.includes(' · current-results')));
 assert.equal(f.find(n=>Array.isArray(n.props?.children)&&n.props.children.includes(' · obsolete-results')),undefined);
});
test('older-page clicks preserve applied filters and do not advance twice on duplicate click',async t=>{
 const urls=[];const cursor='2026-11-02T10:00:00.123456Z|20000000-0000-4000-8000-000000000001';
 const f=fixture(t,async url=>{urls.push(url);return response({events:[event],nextCursor:cursor});});await ready(f);
 f.input('e.g. member_trial','member_trial');f.submit();await ready(f);assert.equal(new URL(urls.at(-1),'https://test').searchParams.get('action'),'member_trial');
 const click=f.button('Older events').props.onClick;click();click();await ready(f);
 const params=new URL(urls.at(-1),'https://test').searchParams;assert.equal(params.get('cursor'),cursor);assert.equal(params.get('action'),'member_trial');
 assert.ok(f.find(n=>Array.isArray(n.props?.children)&&n.props.children[1]===2));
 f.button('Refresh').props.onClick();await ready(f);assert.equal(new URL(urls.at(-1),'https://test').searchParams.has('cursor'),false);
});
test('malformed API success is an error rather than an empty audit list',async t=>{
 const f=fixture(t,async()=>response({events:'wrong',nextCursor:null}));await ready(f);assert.ok(f.find(n=>n.props?.role==='alert'));assert.equal(f.find(n=>n.props?.children==='No matching activity found.'),undefined);
});
test('failed older-page read can retry the same cursor without incrementing the page',async t=>{
 const urls=[];let first=true,fail=false;
 const f=fixture(t,async url=>{urls.push(url);if(fail){fail=false;throw Error('temporary');}const result={events:[event],nextCursor:first?'next-page':null};first=false;return response(result);});await ready(f);
 fail=true;f.button('Older events').props.onClick();await ready(f);assert.ok(f.find(n=>n.props?.role==='alert'));
 f.button('Retry audit records').props.onClick();await ready(f);assert.equal(urls.at(-1),urls.at(-2));assert.ok(f.find(n=>Array.isArray(n.props?.children)&&n.props.children[1]===2));
});
