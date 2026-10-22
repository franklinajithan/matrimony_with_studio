const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const memberId = '10000000-0000-4000-8000-000000000001';
const adminId = '20000000-0000-4000-8000-000000000002';
function setup(options = {}) {
  const calls = [];
  const ok = { data: [], error: null };
  const db = {
    from(table) {
      const q = {
        select() { return q; },
        delete() { calls.push(`erase:${table}`); return q; },
        update() { calls.push(`anonymize:${table}`); return q; },
        eq() { return q; },
        single: async () => ({ data: { id: memberId, is_admin: !!options.targetAdmin }, error: null }),
        then(resolve) { return Promise.resolve(table.includes('subscriptions') && options.paid ? { data: [{ stripe_subscription_id: 'sub_1', status: 'active' }], error: null } : ok).then(resolve); },
      }; return q;
    },
    auth: { admin: {
      getUserById: async () => ({ data: { user: { email: 'member@example.com' } }, error: null }),
      updateUserById: async () => { calls.push('ban'); return ok; },
      deleteUser: async (id, soft) => { calls.push(['deleteAuth', id, soft]); return { error: options.authFail ? new Error('fail') : null }; },
    } },
    storage: {
      listBuckets: async () => ({ data: [{ id: 'media' }, { id: 'horoscope-private' }], error: null }),
      from(bucket) { return {
        list: async (folder, { offset }) => {
          calls.push(['list', bucket, folder, offset]);
          if (options.storageFail) return { error: new Error('fail') };
          if (bucket !== 'media') return ok;
          if (folder === `users/${memberId}`) return { data: [{ name: 'photos', id: null }], error: null };
          return { data: Array.from({ length: offset ? 1 : 100 }, (_, i) => ({ id: String(offset + i), name: String(offset + i) })), error: null };
        },
        remove: async paths => { calls.push(['remove', bucket, paths]); return ok; },
      }; },
    },
  };
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('src/app/api/admin/delete-member/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(name => {
    if (name === 'next/server') return { NextResponse: { json: (body, init) => ({ body, status: init.status }) } };
    if (name === '@/lib/auth/admin') return { requireServerAdmin: async () => options.denied ? null : { id: adminId } };
    if (name === '@/lib/supabase/admin') return { createSupabaseAdminClient: () => { if (options.configMissing) throw new Error('Permanent deletion is not configured'); return db; } };
    throw new Error(name);
  }, mod, mod.exports);
  const request = new Request('https://cupidmatch.co.uk/api/admin/delete-member', { method: 'POST', headers: { origin: options.origin || 'https://cupidmatch.co.uk', 'content-type': 'application/json' }, body: JSON.stringify(options.body || { memberId, email: 'member@example.com' }) });
  return { calls, run: () => mod.exports.POST(request) };
}
for (const [name, options, status] of [
  ['denies non-admins', { denied: true }, 403],
  ['denies cross-origin', { origin: 'https://evil.example' }, 403],
  ['rejects malformed target', { body: { memberId: 'bad', email: 'x' } }, 400],
  ['rejects self deletion', { body: { memberId: adminId, email: 'x' } }, 403],
  ['protects administrator targets', { targetAdmin: true }, 403],
  ['checks Auth email', { body: { memberId, email: 'wrong@example.com' } }, 400],
  ['blocks ongoing paid billing', { paid: true }, 409],
]) test(name, async () => { const s = setup(options); assert.equal((await s.run()).status, status); assert.equal(s.calls.length, 0); });
test('hard deletes only after paginated nested storage and residual data cleanup', async () => {
  const s = setup(); assert.equal((await s.run()).status, 200);
  const removals = s.calls.filter(c => c[0] === 'remove');
  assert.equal(removals.length, 2); assert.equal(removals.flatMap(c => c[2]).length, 101);
  assert.ok(removals.every(c => c[2].every(p => p.startsWith(`users/${memberId}/photos/`))));
  assert.deepEqual(s.calls.at(-1), ['deleteAuth', memberId, false]);
  assert.ok(s.calls.includes('erase:subscription_events')); assert.ok(s.calls.includes('erase:success_stories'));
  assert.ok(s.calls.includes('anonymize:admin_audit_log'));
});
test('storage failure prevents Auth deletion and reports failure', async () => {
  const s = setup({ storageFail: true }); assert.equal((await s.run()).status, 503);
  assert.ok(!s.calls.some(c => c[0] === 'deleteAuth'));
});
test('Auth failure never returns success', async () => {
  const s = setup({ authFail: true }); assert.equal((await s.run()).status, 503);
});
test('missing configuration gives an actionable error without claiming partial deletion', async () => {
  const s = setup({ configMissing: true }); const response = await s.run();
  assert.equal(response.status, 503);
  assert.match(response.body.error, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(response.body.error, /No account data was changed/);
  assert.equal(s.calls.length, 0);
});
