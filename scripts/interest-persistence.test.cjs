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
      const { body, status = 200 } = responses.shift();
      return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    } },
  });
  const source = ts.transpileModule(fs.readFileSync('src/lib/supabase/matches.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`)((name) => {
    if (name === './client') return { supabase: client };
    if (name === './timestamp') return {};
    throw new Error(`Unexpected dependency ${name}`);
  }, mod, mod.exports);
  return { send: () => mod.exports.sendInterest({ senderUid: 'alice', receiverUid: 'bob', message: 'Hello' }), calls, responses };
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
