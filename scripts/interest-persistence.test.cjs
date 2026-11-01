const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

// Execute the real service and installed PostgREST query builder. Only HTTP is
// isolated; no credentials, remote database or real member records are used.
function fixture(responses) {
  const calls = [];
  const client = createClient('https://example.supabase.co', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url, init) => {
      calls.push({ url: new URL(url), method: init.method, body: init.body && JSON.parse(init.body), headers: new Headers(init.headers) });
      assert.ok(responses.length, 'Unexpected database request');
      const { body, status = 200, wait } = responses.shift();
      if (wait) await wait;
      return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    } },
  });
  const callbacks = [];
  let removed = false;
  const channel = { on: (_event, _filter, callback) => { callbacks.push(callback); return channel; }, subscribe: () => channel };
  client.channel = () => channel;
  client.removeChannel = async () => { removed = true; };
  const source = ts.transpileModule(fs.readFileSync('src/lib/supabase/matches.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`)((name) => {
    if (name === './client') return { supabase: client };
    if (name === './timestamp') return { Timestamp: { fromISO: (value) => value } };
    throw new Error(`Unexpected dependency ${name}`);
  }, mod, mod.exports);
  return { callbacks, removed: () => removed, api: mod.exports, send: () => mod.exports.sendInterest({ senderUid: 'alice', receiverUid: 'bob', message: 'Hello' }), calls, responses };
}
const id = 'alice_bob';
for (const status of ['declined', 'withdrawn', 'accepted']) {
  test(`resends ${status} only after returning the persisted row`, async () => {
    const replies = [{ body: { id, status } }];
    if (status === 'accepted') replies.push({ body: null });
    replies.push({ body: [{ id }] });
    const f = fixture(replies);
    assert.deepEqual(await f.send(), { id });
    const write = f.calls.at(-1);
    assert.equal(write.method, 'PATCH');
    assert.equal(write.url.searchParams.get('id'), `eq.${id}`);
    assert.equal(write.url.searchParams.get('status'), `eq.${status}`);
    assert.equal(write.url.searchParams.get('select'), 'id');
    assert.match(write.headers.get('prefer'), /return=representation/);
    assert.equal(write.body.status, 'pending');
    assert.equal(write.body.withdrawn_at, null);
    assert.equal(write.body.message, 'Hello');
    assert.equal(f.responses.length, 0);
  });
}
test('zero-row writes reject instead of confirming an RLS-hidden or concurrently changed request', async () => {
  const f = fixture([{ body: { id, status: 'withdrawn' } }, { body: [] }]);
  await assert.rejects(f.send(), /could not be resent/);
  assert.equal(f.calls.length, 2);
});
test('database errors preserve their message and do not report success', async () => {
  const f = fixture([{ body: { id, status: 'declined' } }, { status: 403, body: { code: '42501', message: 'Permission denied' } }]);
  await assert.rejects(f.send(), (error) => error.code === '42501' && error.message === 'Permission denied');
});
test('pending requests remain protected from a second send', async () => {
  const f = fixture([{ body: { id, status: 'pending' } }]);
  await assert.rejects(f.send(), /already sent/);
  assert.equal(f.calls.length, 1);
});
test('an accepted request with a connection cannot be reset', async () => {
  const f = fixture([{ body: { id, status: 'accepted' } }, { body: { id: 'connection' } }]);
  await assert.rejects(f.send(), /already connected/);
  assert.ok(f.calls.every((call) => call.method === 'GET'));
});
test('first-time interests still insert without an extra readback', async () => {
  const f = fixture([{ body: null }, { body: null, status: 201 }]);
  assert.deepEqual(await f.send(), { id });
  assert.equal(f.calls.at(-1).method, 'POST');
});

for (const action of ['withdrawInterest','declineInterest']) {
  test(`${action} confirms persistence and rejects stale zero-row responses`, async () => {
    const ok = fixture([{ body: [{ id }] }]);
    await ok.api[action](id);
    assert.equal(ok.calls[0].url.searchParams.get('status'), 'eq.pending');
    assert.equal(ok.calls[0].url.searchParams.get('select'), 'id');
    const stale = fixture([{ body: [] }]);
    await assert.rejects(stale.api[action](id), /no longer available/);
  });
}
const row = (id, sender, receiver, status) => ({ id, sender_id: sender, receiver_id: receiver, status, created_at: '2026-01-01', updated_at: '2026-01-01' });
test('profile lookup finds reverse-direction legacy IDs and prioritizes incoming consent', async () => {
  const f = fixture([{ body: [row('alice_bob','alice','bob','pending'), row('legacy-sorted','bob','alice','pending')] }]);
  const request = await f.api.getPairMatchRequest('alice','bob');
  assert.equal(request.id, 'legacy-sorted');
  assert.equal(request.receiverUid, 'alice');
  assert.equal(f.calls[0].url.searchParams.get('sender_id'), 'in.(alice,bob)');
  assert.equal(f.calls[0].url.searchParams.get('receiver_id'), 'in.(alice,bob)');
});
test('profile lookup returns the accepted request belonging to the canonical connection', async () => {
  const f = fixture([{ body: [row('other','alice','bob','accepted'),row('accepted','bob','alice','accepted')] }, { body: { created_from_request_id: 'accepted' } }]);
  assert.equal((await f.api.getPairMatchRequest('alice','bob')).id, 'accepted');
});
test('removed accepted connections and terminal requests do not block a new profile interest', async () => {
  const f = fixture([{ body: [row('accepted','alice','bob','accepted'),row('declined','bob','alice','declined')] }, { body: null }]);
  assert.equal(await f.api.getPairMatchRequest('alice','bob'), null);
});
test('acceptance uses only the atomic RPC and rejects an empty result', async () => {
  // RPC requests use the same real HTTP transport as table queries.
  const ok = fixture([{ body: [{ sender_id: 'alice', receiver_id: 'bob' }] }]);
  await ok.api.acceptInterest(id);
  assert.equal(ok.calls.length,1);
  assert.match(ok.calls[0].url.pathname, /rpc\/accept_interest_and_connect$/);
  assert.deepEqual(ok.calls[0].body, { p_request_id: id });
  const empty = fixture([{ body: [] }]);
  await assert.rejects(empty.api.acceptInterest(id), /could not be accepted/);
});
test('pair subscription ignores out-of-order responses and stops after unsubscribe', async () => {
  let release;
  const wait = new Promise(resolve => { release = resolve; });
  const f = fixture([{ body: [row('old','alice','bob','pending')], wait }, { body: [row('new','bob','alice','pending')] }]);
  const seen=[];
  const unsubscribe = f.api.subscribeToPairMatchRequest('alice','bob', value => seen.push(value?.id));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.callbacks.length,4);
  f.callbacks[0]();
  await new Promise(resolve => setImmediate(resolve));
  release();await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(seen,['new']);
  unsubscribe();assert.equal(f.removed(),true);
});
