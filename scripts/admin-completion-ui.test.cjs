const {test}=require('node:test');const assert=require('node:assert/strict');const {load}=require('./helpers/load-ts.cjs');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(t,file,fetcher){
 const previous=global.fetch;global.fetch=fetcher;t.after(()=>{global.fetch=previous;cleanup?.();});
 const state=[],refs=[],effects=[];let cursor=0,refCursor=0,effectCursor=0,cleanup;
 const react={useState:initial=>{const i=cursor++;if(!(i in state))state[i]=initial;return[state[i],next=>{state[i]=typeof next==='function'?next(state[i]):next;}];},useRef:initial=>{const i=refCursor++;return refs[i]||=( {current:initial});},useEffect:(callback,deps)=>{const i=effectCursor++;if(!effects[i]||deps.some((value,index)=>effects[i].deps[index]!==value)){effects[i]?.cleanup?.();const dispose=callback();effects[i]={deps,cleanup:dispose};cleanup=()=>effects.forEach(effect=>effect.cleanup?.());}}};
 const api=load(file,{react,'next/link':{default:'Link'},'@/components/ui/button':{Button:'Button'},'@/components/ui/textarea':{Textarea:'Textarea'},'@/components/ui/label':{Label:'Label'},'@/components/ui/input':{Input:'Input'}});
 const component=api.default||api.BillingRecords||api.WorkloadOverview;
 function render(){cursor=0;refCursor=0;effectCursor=0;return component();}
 function find(node,predicate){if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of[node.props?.children].flat(Infinity)){const result=find(child,predicate);if(result)return result;}}
 const button=label=>{const result=find(render(),node=>node.type==='Button'&&node.props.children===label);assert.ok(result,`Missing button ${label}`);return result;};
 return{render,find,button,state};
}
const story={id:'20000000-0000-4000-8000-000000000001',couple_names:'A and B',story_text:'Full submitted story',status:'pending',submitted_at:'2026-11-01'};
const response=(body,ok=true)=>({ok,json:async()=>body});
test('story screen retries load failures and preserves complete evidence',async t=>{
 let calls=0;const f=fixture(t,'src/app/admin/success-stories/page-client.tsx',async()=>{if(++calls===1)throw Error('offline');return response({stories:[story]});});f.render();await flush();assert.ok(f.find(f.render(),node=>node.props?.role==='alert'));f.button('Try again').props.onClick();f.render();await flush();assert.ok(f.find(f.render(),node=>node.props?.children===story.story_text));assert.equal(calls,2);
});
test('story review requires confirmation and persistence, prevents duplicates and permits retry',async t=>{
 let writes=0,release;const f=fixture(t,'src/app/admin/success-stories/page-client.tsx',async(url,options)=>{if(options.method==='PATCH'){writes++;return new Promise(resolve=>{release=resolve;});}return response({stories:[story]});});f.render();await flush();f.button('Approve publication').props.onClick();assert.equal(writes,0);assert.equal(f.button('Confirm review').props.disabled,true);
 f.find(f.render(),node=>node.type==='Textarea').props.onChange({target:{value:'Reviewed consent and content'}});
 const submit=f.button('Confirm review').props.onClick;submit();submit();await flush();assert.equal(writes,1);assert.equal(f.state[5],'');
 release(response({error:'Review changed. Refresh and review again.'},false));await flush();assert.ok(f.find(f.render(),node=>node.props?.role==='alert'));assert.ok(f.find(f.render(),node=>node.type==='Textarea'));
 f.button('Confirm review').props.onClick();await flush();release(response({id:story.id,status:'approved'}));await flush();f.render();await flush();assert.ok(f.find(f.render(),node=>node.props?.role==='status'&&node.props.children==='Review saved and recorded in the audit log.'));assert.equal(writes,2);
});
test('plans screen exposes database prices and inactive catalogue records',async t=>{
 const f=fixture(t,'src/app/admin/plans/page-client.tsx',async()=>response({plans:[{code:'premium',name:'Custom plan',active:false,currency:'GBP',monthly_price_pence:1234,three_month_price_pence:3000,six_month_price_pence:5000,entitlements:{advancedFilters:true}}]}));f.render();await flush();assert.ok(f.find(f.render(),node=>node.props?.children==='Custom plan'));assert.ok(f.find(f.render(),node=>node.props?.children==='£12.34'));
});
test('billing screen displays subscription records and permits recovery from errors',async t=>{
 let offline=true;const f=fixture(t,'src/app/admin/subscriptions/billing-records.tsx',async url=>{if(offline)throw Error('offline');return response(url.includes('billing-events')?{events:[]}:{subscriptions:[{id:'sub',user_id:'member',plan_code:'premium',status:'active',billing_term:'monthly',current_period_end:null,cancel_at_period_end:true}]});});f.render();await flush();assert.ok(f.find(f.render(),node=>node.props?.role==='alert'));offline=false;f.button('Retry billing').props.onClick();f.render();await flush();assert.ok(f.find(f.render(),node=>node.props?.children==='Cancels at period end'));
});
test('dashboard keeps healthy queue counts visible when billing setup is missing',async t=>{
 const f=fixture(t,'src/app/admin/workload-overview.tsx',async()=>response({counts:{publishedProfiles:12,newMembers:3,verificationRequests:1,openReports:null,pendingStories:2,activeSubscriptions:null}}));f.render();await flush();assert.ok(f.find(f.render(),node=>node.props?.children==='12'));assert.ok(f.find(f.render(),node=>node.props?.children==='Some queues are unavailable. Refresh after the required backend setup is complete.'));assert.ok(f.find(f.render(),node=>node.props?.['aria-label']==='Unavailable'&&node.props.children==='—'));
});
