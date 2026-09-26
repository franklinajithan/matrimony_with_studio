const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the real TypeScript modules with isolated Auth/Next boundaries.
// No network, real sessions, or additional test dependencies are needed.
function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const module = { exports: {} };
  const requireMock = (name) => {
    if (name === 'server-only') return {};
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === 'react/jsx-runtime') return {
      jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }),
    };
    throw new Error(`Unexpected dependency: ${name} in ${relative}`);
  };
  vm.runInThisContext(`(function(require,module,exports){${outputText}\n})`, { filename })(requireMock, module, module.exports);
  return module.exports;
}

const user = { id: 'verified-user', user_metadata: { isAdmin: true } };
function authModule({ authUser = user, authError = null, role = true, roleError = null, throwsAt } = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => {
      calls.push('getUser');
      if (throwsAt === 'auth') throw new Error('Auth unavailable');
      return { data: { user: authUser }, error: authError };
    } },
    rpc: async (name, ...args) => {
      calls.push(name);
      assert.equal(name, 'is_admin');
      assert.equal(args.length, 0, 'Caller must not choose the user whose role is checked');
      if (throwsAt === 'rpc') throw new Error('Database unavailable');
      return { data: role, error: roleError };
    },
  };
  return { calls, ...load('src/lib/auth/admin.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: async () => {
      if (throwsAt === 'client') throw new Error('Missing configuration');
      return client;
    } },
  }) };
}

test('only a verified user with a true database role is authorized', async () => {
  const api = authModule();
  assert.equal((await api.getServerAdminAccess()).user, user);
  assert.deepEqual(api.calls, ['getUser', 'is_admin']);
});

for (const scenario of [
  { name: 'guest', authUser: null, status: 'unauthenticated' },
  { name: 'invalid session even with a user object', authError: new Error('invalid token'), status: 'unauthenticated' },
  { name: 'member with forged user metadata', role: false, status: 'forbidden' },
  { name: 'missing role', role: null, status: 'forbidden' },
  { name: 'string role', role: 'true', status: 'forbidden' },
  { name: 'numeric role', role: 1, status: 'forbidden' },
  { name: 'RPC error even with true data', roleError: new Error('RPC failed'), status: 'unavailable' },
  ...['client', 'auth', 'rpc'].map(throwsAt => ({ name: `${throwsAt} failure`, throwsAt, status: 'unavailable' })),
]) {
  test(`fail closed: ${scenario.name}`, async () => {
    const api = authModule(scenario);
    const access = await api.getServerAdminAccess();
    assert.equal(access.status, scenario.status);
    assert.equal(access.user, null);
    assert.equal(await api.requireServerAdmin(), null);
    if (scenario.status === 'unauthenticated') assert.ok(!api.calls.includes('is_admin'));
  });
}

test('a revoked admin role is rechecked on the next call', async () => {
  let role = true;
  const api = load('src/lib/auth/admin.ts', {
    '@/lib/supabase/server': { createSupabaseServerClient: async () => ({
      auth: { getUser: async () => ({ data: { user }, error: null }) },
      rpc: async () => ({ data: role, error: null }),
    }) },
  });
  assert.equal(await api.requireServerAdmin(), user);
  role = false;
  assert.equal(await api.requireServerAdmin(), null);
});

for (const [status, destination] of [
  ['unauthenticated', '/login?next=%2Fadmin'], ['forbidden', '/dashboard'],
  ['unavailable', null], ['authorized', null],
]) {
  test(`page guard: ${status}`, async () => {
    let redirected;
    const guard = load('src/app/admin/guard.tsx', {
      '@/lib/auth/admin': { getServerAdminAccess: async () => ({ status, user: status === 'authorized' ? user : null }) },
      'next/navigation': { redirect: value => { redirected = value; throw new Error('redirect'); } },
    });
    if (status === 'authorized') assert.equal(await guard.requireAdminPage(), user);
    else await assert.rejects(guard.requireAdminPage());
    assert.equal(redirected, destination ?? undefined);
  });
}

function files(dir, basename) {
  return fs.readdirSync(path.resolve(__dirname, '..', dir), { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(`${dir}/${entry.name}`, basename) : entry.name === basename ? [`${dir}/${entry.name}`] : []);
}
const componentStubs = new Proxy({}, { get: (_, name) => name });
const adminPages = ['src/app/admin/layout.tsx', ...files('src/app/admin', 'page.tsx')];
for (const file of adminPages) {
  for (const authorized of [false, true]) {
    test(`${file}: ${authorized ? 'admin allowed' : 'denied before rendering'}`, async () => {
      const denied = new Error('Denied');
      let checks = 0;
      const guard = { requireAdminPage: async () => { checks++; if (!authorized) throw denied; return user; } };
      const page = load(file, {
        '@/app/admin/guard': guard, './guard': guard,
        '@/lib/admin/dashboard': { getAdminDashboardMetrics: async () => ({ members: 14, activeUsers: 3, pendingVerification: 12, updatedAt: '2026-09-18T10:00:00Z' }) },
        '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ from: table => { assert.equal(table, 'admin_audit_log'); return { select: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }; } }) },
        './page-client': { default: 'AdminPageClient' },
        '@/components/shared/Logo': componentStubs, '@/components/ui/card': componentStubs,
        'lucide-react': componentStubs, 'next/link': { default: 'Link' },
        '@/lib/subscriptions/plans': { PLANS: {}, formatPlanPrice: () => '' },
      });
      if (authorized) assert.ok(await page.default({ children: 'protected' }));
      else await assert.rejects(page.default({ children: 'protected' }), error => error === denied);
      assert.equal(checks, 1);
    });
  }
}

for (const file of files('src/app/api/admin', 'route.ts')) {
  test(`${file}: rejects direct unauthorized requests without reading data`, async () => {
    let checks = 0;
    const api = load(file, {
      '@/lib/auth/admin': { requireServerAdmin: async () => { checks++; return null; } },
      '@/lib/supabase/server': { createSupabaseServerClient: () => { throw new Error('Protected data accessed before authorization'); } },
      '@/lib/subscriptions': { ADMIN_BILLING_CAPABILITIES: {} },
      '@/lib/admin/dashboard': { getAdminDashboardMetrics: () => { throw new Error('Read before authorization'); } },
      'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
    });
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      if (typeof api[method] !== 'function') continue;
      const response = await api[method]();
      assert.equal(response.status, 403);
    }
    assert.ok(checks > 0);
  });
}

for (const [name, payload, error, valid] of [
  ['real counts', { members: 14, activeUsers: 3, pendingVerification: 12, updatedAt: '2026-09-18T10:00:00Z' }, null, true],
  ['empty membership', { members: 0, activeUsers: 0, pendingVerification: 0, updatedAt: '2026-09-18T10:00:00Z' }, null, true],
  ['database error', null, { message: 'Permission denied' }, false],
  ['missing counts', {}, null, false],
  ['negative counts', { members: -1, activeUsers: 0, pendingVerification: 0, updatedAt: '2026-09-18T10:00:00Z' }, null, false],
  ['invalid timestamp', { members: 1, activeUsers: 0, pendingVerification: 0, updatedAt: 'invalid' }, null, false],
]) {
  test(`dashboard metrics: ${name}`, async () => {
    const metrics = load('src/lib/admin/dashboard.ts', {
      '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ rpc: async (name) => {
        assert.equal(name, 'admin_dashboard_counts');
        return { data: payload, error };
      } }) },
    });
    if (valid) assert.deepEqual(await metrics.getAdminDashboardMetrics(), payload);
    else await assert.rejects(metrics.getAdminDashboardMetrics(), /unavailable/);
  });
}

for (const unavailable of [false, true]) {
  test(`summary API: ${unavailable ? 'returns 503 on failure instead of false zeros' : 'returns counts without caching'}`, async () => {
    const payload = { members: 14, activeUsers: 3, pendingVerification: 12, updatedAt: '2026-09-18T10:00:00Z' };
    const api = load('src/app/api/admin/summary/route.ts', {
      '@/lib/auth/admin': { requireServerAdmin: async () => user },
      '@/lib/admin/dashboard': { getAdminDashboardMetrics: async () => {
        if (unavailable) throw new Error('Database failed');
        return payload;
      } },
      'next/server': { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200, headers: init?.headers }) } },
    });
    const result = await api.GET();
    assert.equal(result.status, unavailable ? 503 : 200);
    assert.equal(result.headers['Cache-Control'], 'no-store');
    if (!unavailable) assert.deepEqual(result.body, payload);
    else assert.equal(result.body.members, undefined);
  });
}
