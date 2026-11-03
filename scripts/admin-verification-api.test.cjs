const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers/load-ts.cjs');
const id = '20000000-0000-4000-8000-000000000001';
const valid = { requestId: id, decision: 'approved', note: 'Reviewed the submitted member profile' };
function fixture(name, { admin = true, result = { data: { id, status: 'approved' }, error: null }, throws = false, rows = [] } = {}) {
  const calls = []; let clients = 0;
  const db = {
    async rpc(...args) { calls.push(['rpc', ...args]); if (throws) throw Error('private database detail'); return result; },
    from(table) {
      calls.push(['from', table]); const q = {};
      for (const method of ['select', 'eq', 'order', 'range']) q[method] = (...args) => { calls.push([table, method, ...args]); return q; };
      q.then = (resolve, reject) => (throws ? Promise.reject(Error('private database detail')) : Promise.resolve({ data: rows, error: result.error })).then(resolve, reject);
      return q;
    },
  };
  const api = load(`src/app/api/admin/${name}/route.ts`, {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200, headers: init.headers }) } },
    '@/lib/auth/admin': { requireServerAdmin: async () => admin ? { id: 'actual-admin' } : null },
    '@/lib/supabase/server': { createSupabaseServerClient: async () => { clients++; return db; } },
  });
  const request = (body = valid, origin = 'https://cupidmatch.co.uk') => new Request(`https://cupidmatch.co.uk/api/admin/${name}`, {
    method: 'POST', headers: { ...(origin ? { origin } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return { api, calls, request, clients: () => clients };
}
test('verification endpoints deny non-admin reads and writes without database access', async () => {
  for (const name of ['verification-backlog', 'verification-decisions']) {
    const f = fixture(name, { admin: false });
    const r = name.endsWith('backlog') ? await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/'+name)) : await f.api.POST(f.request());
    assert.equal(r.status, 403); assert.equal(f.clients(), 0); assert.match(r.headers['Cache-Control'], /private, no-store/);
  }
});
test('decisions reject missing/cross origin and forged actor fields', async () => {
  for (const [body, origin, status] of [[valid, '', 403], [valid, 'https://other.example', 403], [{ ...valid, actor: 'forged' }, 'https://cupidmatch.co.uk', 400]]) {
    const f = fixture('verification-decisions'); assert.equal((await f.api.POST(f.request(body, origin))).status, status); assert.equal(f.clients(), 0);
  }
});
test('invalid decisions and empty, whitespace or oversized reasons never invoke review', async () => {
  for (const body of [null, [], { ...valid, requestId: 'invalid' }, { ...valid, decision: 'pending' }, { ...valid, note: ' '.repeat(30) }, { ...valid, note: 'short' }, { ...valid, note: 'x'.repeat(1001) }, { ...valid, note: 123 }]) {
    const f = fixture('verification-decisions'); assert.equal((await f.api.POST(f.request(body))).status, 400); assert.equal(f.clients(), 0);
  }
});
test('malformed JSON returns a private structured error', async () => {
  const f = fixture('verification-decisions');
  const r = await f.api.POST(new Request('https://cupidmatch.co.uk/api/admin/verification-decisions', { method: 'POST', headers: { origin: 'https://cupidmatch.co.uk' }, body: '{' }));
  assert.equal(r.status, 400); assert.equal(f.clients(), 0);
});
test('only trimmed input reaches the existing atomic review RPC and response is projected', async () => {
  const f = fixture('verification-decisions', { result: { data: { id, status: 'approved', internal: 'private' }, error: null } });
  const r = await f.api.POST(f.request({ ...valid, note: '  '+valid.note+'  ' })); assert.equal(r.status, 200);
  assert.deepEqual(f.calls, [['rpc', 'review_profile_verification_request', { p_request_id: id, p_decision: 'approved', p_reviewer_note: valid.note }]]);
  assert.deepEqual(r.body, { review: { id, status: 'approved' } });
});
test('stale/deleted/forbidden/database failures map to actionable errors without private details', async () => {
  for (const [code, status] of [['23505', 409], ['P0002', 404], ['42501', 403], ['XX000', 503]]) {
    const f = fixture('verification-decisions', { result: { data: null, error: { code, message: 'private database detail' } } });
    const r = await f.api.POST(f.request()); assert.equal(r.status, status); assert.doesNotMatch(JSON.stringify(r.body), /private database detail/); assert.match(r.headers['Cache-Control'], /no-store/);
  }
});
test('thrown client failures and unconfirmed RPC responses never report success', async () => {
  for (const options of [{ throws: true }, { result: { data: null, error: null } }, { result: { data: { id: 'wrong', status: 'approved' }, error: null } }, { result: { data: { id, status: 'rejected' }, error: null } }]) {
    const f = fixture('verification-decisions', options); const r = await f.api.POST(f.request()); assert.equal(r.status, 503); assert.doesNotMatch(JSON.stringify(r.body), /private database detail/);
  }
});
test('queue independently pages profiles and submitted requests with timestamp tie breakers', async () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({ id: i }));
  const f = fixture('verification-backlog', { rows });
  const r = await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/verification-backlog?profileOffset=120&requestOffset=40'));
  assert.equal(r.status, 200); assert.equal(r.body.profiles.length, 20); assert.equal(r.body.requests.length, 20);
  assert.equal(r.body.hasMoreProfiles, true); assert.equal(r.body.hasMoreRequests, true);
  assert.deepEqual(f.calls.filter(c => c[1] === 'range'), [['profiles', 'range', 120, 140], ['verification_requests', 'range', 40, 60]]);
  assert.deepEqual(f.calls.filter(c => c[1] === 'order' && c[2] === 'id'), [['profiles', 'order', 'id', { ascending: true }], ['verification_requests', 'order', 'id', { ascending: true }]]);
  assert.deepEqual(f.calls.find(c => c[0] === 'verification_requests' && c[1] === 'eq'), ['verification_requests', 'eq', 'status', 'pending']);
  assert.equal(f.calls.some(c => c[1] === 'select' && /reviewer_note|\*|email/.test(c[2])), false);
});
test('queue last page has no misleading next button including exactly 20 results', async () => {
  for (const length of [0, 1, 20]) {
    const f = fixture('verification-backlog', { rows: Array.from({ length }, (_, id) => ({ id })) });
    const r = await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/verification-backlog'));
    assert.equal(r.body.hasMoreProfiles, false); assert.equal(r.body.hasMoreRequests, false);
  }
});
test('invalid page offsets fail before queries', async () => {
  for (const value of ['-1', '1.2', 'Infinity', 'NaN', '9007199254740992', '9007199254740991', 'garbage', '']) {
    const f = fixture('verification-backlog'); assert.equal((await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/verification-backlog?requestOffset='+value))).status, 400); assert.equal(f.clients(), 0);
  }
});
test('queue failures remain unavailable instead of a misleading empty queue', async () => {
  for (const options of [{ throws: true }, { result: { data: null, error: { code: '42P01', message: 'private database detail' } } }]) {
    const f = fixture('verification-backlog', options); const r = await f.api.GET(new Request('https://cupidmatch.co.uk/api/admin/verification-backlog'));
    assert.equal(r.status, 503); assert.doesNotMatch(JSON.stringify(r.body), /private database detail/); assert.equal('requests' in r.body, false);
  }
});
