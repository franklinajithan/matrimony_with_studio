const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers/load-ts.cjs');

test('every audit event remains reachable when more than one page shares a timestamp', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  try {
    await db.exec(`create table admin_audit_log(id uuid primary key,actor_id uuid,action text,target_type text,target_id text,created_at timestamptz);
      insert into admin_audit_log select ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,null,'profile_review','member',n::text,'2026-11-02T10:00:00.123456Z' from generate_series(1,125) n;`);
    const api = load('src/app/api/admin/audit-log/route.ts', {
      'next/server': { NextResponse: { json: (body, init={}) => ({ body, status: init.status || 200 }) } },
      '@/lib/auth/admin': { requireServerAdmin: async () => ({ id: 'admin' }) },
      '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ from: () => {
        const clauses=[],values=[]; let limit=51;
        const q={select:()=>q,order:()=>q,limit:n=>{limit=n;return q;},lt:(column,value)=>{values.push(value);clauses.push(`${column} < $${values.length}`);return q;},
          or:filter=>{
            const match=/^created_at\.lt\.([^,]+),and\(created_at\.eq\.([^,]+),id\.lt\.([^,)]+)\)$/.exec(filter);
            assert.ok(match,'Expected compound timestamp and ID boundary');assert.equal(match[1],match[2]);
            values.push(match[1],match[3]);clauses.push(`(created_at,id) < ($${values.length-1}::timestamptz,$${values.length}::uuid)`);return q;
          },
          then:(resolve,reject)=>db.query(`select id,actor_id,action,target_type,target_id,to_char(created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') created_at from admin_audit_log ${clauses.length?'where '+clauses.join(' and '):''} order by created_at desc,id desc limit ${limit}`,values).then(r=>({data:r.rows,error:null})).then(resolve,reject),
        };return q;
      } }) },
    });
    const ids=[];let cursor=null;
    for(let page=0;page<4;page++) {
      const response=await api.GET(new Request('https://cupidmatch.co.uk/api/admin/audit-log'+(cursor?'?cursor='+encodeURIComponent(cursor):'')));
      assert.equal(response.status,200);ids.push(...response.body.events.map(row=>row.id));cursor=response.body.nextCursor;if(!cursor)break;
    }
    assert.equal(ids.length,125,'Timestamp ties must not make records disappear after page one');assert.equal(new Set(ids).size,125);
    await db.exec(`insert into admin_audit_log values('20000000-0000-4000-8000-000000000999',null,'last_microsecond','member','edge','2026-11-02T23:59:59.999999Z');`);
    const endOfDay=await api.GET(new Request('https://cupidmatch.co.uk/api/admin/audit-log?to=2026-11-02'));
    assert.equal(endOfDay.body.events[0].action,'last_microsecond');
    assert.equal((await db.query("select count(*)::int n from admin_audit_log where action='last_microsecond' and created_at <= '2026-11-02T23:59:59.999Z' ")).rows[0].n,0,'Old millisecond cutoff excludes this real database event');
  } finally { await db.close(); }
});

function fixture({admin=true,rows=[],error=null,throws=false}={}) {
  const calls=[];let clients=0;
  const api=load('src/app/api/admin/audit-log/route.ts',{
    'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status||200,headers:init.headers})}},
    '@/lib/auth/admin':{requireServerAdmin:async()=>admin?{id:'admin'}:null},
    '@/lib/supabase/server':{createSupabaseServerClient:async()=>{
      clients++;if(throws)throw Error('private database detail');
      return {from:table=>{calls.push(['from',table]);const q={};for(const name of ['select','order','limit','ilike','or','eq','gte','lt'])q[name]=(...args)=>{calls.push([name,...args]);return q;};q.then=(resolve,reject)=>Promise.resolve({data:rows,error}).then(resolve,reject);return q;}};
    }},
  });
  const get=search=>api.GET(new Request('https://cupidmatch.co.uk/api/admin/audit-log?'+(search||'')));
  return {api,get,calls,clients:()=>clients};
}
const id='20000000-0000-4000-8000-000000000001';
test('audit reads stay guarded, private and bounded with an explicit projection',async()=>{
  const denied=fixture({admin:false});assert.equal((await denied.get()).status,403);assert.equal(denied.clients(),0);
  const f=fixture();const r=await f.get();assert.equal(r.status,200);assert.match(r.headers['Cache-Control'],/private, no-store/);
  assert.deepEqual(f.calls.find(c=>c[0]==='limit'),['limit',51]);assert.equal(f.calls.some(c=>c[0]==='select'&&/\*|metadata|email/.test(c[1])),false);
});
test('exact timestamp precision and UUID form a safe compound page boundary',async()=>{
  const time='2026-11-02T10:00:00.123456+00:00';const f=fixture();await f.get('cursor='+encodeURIComponent(time+'|'+id));
  assert.deepEqual(f.calls.find(c=>c[0]==='or'),['or',`created_at.lt.${time},and(created_at.eq.${time},id.lt.${id})`]);
  assert.equal(f.calls.some(c=>c[0]==='lt'),false);
});
test('invalid dates, reversed ranges and unsafe cursors fail before database reads',async()=>{
  for(const search of ['from=2026-02-30','to=2026-13-01','from=2026-11-02&to=2026-11-01','actor=forged','format=xml','cursor=2026-11-02T10:00:00Z',
    'cursor='+encodeURIComponent('2026-11-02T10:00:00Z|'+id+',id.gt.0'),'cursor='+encodeURIComponent('2026-11-02T99:00:00Z|'+id),
    'cursor='+encodeURIComponent('2026-02-30T10:00:00Z|'+id),'cursor='+encodeURIComponent('2026-11-02T10:00:00.1234567Z|'+id)]) {
    const f=fixture();assert.equal((await f.get(search)).status,400,search);assert.equal(f.clients(),0);
  }
});
test('to date uses exclusive UTC midnight including final database microseconds',async()=>{
  const f=fixture();assert.equal((await f.get('from=2024-02-29&to=2024-02-29')).status,200);
  assert.deepEqual(f.calls.find(c=>c[0]==='gte'),['gte','created_at','2024-02-29T00:00:00.000Z']);
  assert.deepEqual(f.calls.find(c=>c[0]==='lt'),['lt','created_at','2024-03-01T00:00:00.000Z']);
});
test('last pages return no cursor and full pages use the last visible event, not the lookahead',async()=>{
  const rows=Array.from({length:51},(_,n)=>({id:`${n}`,created_at:'2026-11-02T10:00:00.000001Z'}));
  const f=fixture({rows});const r=await f.get();assert.equal(r.body.events.length,50);assert.equal(r.body.nextCursor,rows[49].created_at+'|49');
  for(const n of [0,1,50])assert.equal((await fixture({rows:rows.slice(0,n)}).get()).body.nextCursor,null);
});
test('client and database failures are retryable without leaking database details or showing empty activity',async()=>{
  for(const options of [{throws:true},{error:{message:'private database detail'}}]) {
    const r=await fixture(options).get();assert.equal(r.status,503);assert.doesNotMatch(JSON.stringify(r.body),/private database detail/);assert.equal('events' in r.body,false);assert.match(r.headers['Cache-Control'],/no-store/);
  }
});
test('CSV stays private, bounded and escapes spreadsheet formulas and quotes',async()=>{
  const f=fixture({rows:[{created_at:'2026-11-02T10:00:00Z',action:'=DANGEROUS()',target_type:'Member "test"',target_id:'\n=MORE()',actor_id:null}]});
  const r=await f.get('format=csv');assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/private, no-store/);assert.equal(r.headers.get('X-Export-Limit'),'1000');
  assert.deepEqual(f.calls.find(c=>c[0]==='limit'),['limit',1000]);const csv=await r.text();assert.ok(csv.includes('"\'=DANGEROUS()"'));assert.ok(csv.includes('"Member ""test"""'));assert.ok(csv.includes('"\'\n=MORE()"'));
});
test('real PostgREST client preserves target and cursor filters together',async()=>{
  const {createClient}=require('@supabase/supabase-js');let url;
  const db=createClient('https://example.supabase.co','placeholder',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async input=>{url=new URL(String(input));return new Response('[]',{headers:{'Content-Type':'application/json'}});}}});
  const api=load('src/app/api/admin/audit-log/route.ts',{
    'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status||200})}},
    '@/lib/auth/admin':{requireServerAdmin:async()=>({id:'admin'})},'@/lib/supabase/server':{createSupabaseServerClient:async()=>db},
  });
  const cursor='2026-11-02T10:00:00.123456Z|'+id;
  const result=await api.GET(new Request('https://cupidmatch.co.uk/api/admin/audit-log?target=member&cursor='+encodeURIComponent(cursor)));
  assert.equal(result.status,200);assert.equal(url.searchParams.getAll('or').length,2);assert.match(url.searchParams.getAll('or')[0],/target_type.ilike/);assert.match(url.searchParams.getAll('or')[1],/created_at.lt/);
  assert.equal(url.searchParams.get('order'),'created_at.desc,id.desc');
});
