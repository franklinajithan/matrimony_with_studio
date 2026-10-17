const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file, mocks) {
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`)((name) => {
    if (name in mocks) return mocks[name];
    if (name === '@/lib/auth/safe-redirect') return load('src/lib/auth/safe-redirect.ts', {});
    throw Error('Unexpected import: ' + name);
  }, mod, mod.exports);
  return mod.exports;
}
function callback(exchange = async () => ({ error: null })) {
  return load('src/app/auth/callback/route.ts', {
    'next/server': { NextResponse: { redirect: (url) => new URL(url) } },
    '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ auth: { exchangeCodeForSession: exchange } }) },
  });
}
test('Google cancellation preserves requested destination without claiming link expiry', async () => {
  const result = await callback().GET(new Request('https://cupidmatch.co.uk/auth/callback?error=access_denied&next=%2Fadmin'));
  assert.equal(result.pathname, '/login');
  assert.equal(result.searchParams.get('error'), 'oauth_cancelled');
  assert.equal(result.searchParams.get('next'), '/admin');
});
test('OAuth exchange establishes session before returning to requested destination', async () => {
  let exchanged = '';
  const result = await callback(async (code) => { exchanged = code; return { error: null }; }).GET(new Request('https://cupidmatch.co.uk/auth/callback?code=fixture&next=%2Fadmin'));
  assert.equal(exchanged, 'fixture');
  assert.equal(result.href, 'https://cupidmatch.co.uk/admin');
});
test('OAuth return rejects external redirects', async () => {
  const result = await callback().GET(new Request('https://cupidmatch.co.uk/auth/callback?code=fixture&next=https%3A%2F%2Fevil.test'));
  assert.equal(result.href, 'https://cupidmatch.co.uk/onboarding');
});
test('Expired exchange retains requested destination for retry', async () => {
  const result = await callback(async () => ({ error: { message: 'code expired' } })).GET(new Request('https://cupidmatch.co.uk/auth/callback?code=expired&next=%2Fdashboard'));
  assert.equal(result.searchParams.get('error'), 'expired_link');
  assert.equal(result.searchParams.get('next'), '/dashboard');
});
test('Google OAuth starts on current browser origin with minimum scopes and safe redirect', async () => {
  const oldWindow = global.window;
  const calls = [];
  const client = { auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithOAuth: async (options) => { calls.push(options); return { data: { url: 'https://accounts.google.com/' }, error: null }; },
  } };
  try {
    global.window = { location: { origin: 'https://cupidmatch.co.uk' } };
    const auth = load('src/lib/supabase/auth.ts', {
      './client': { supabase: client },
      './env': { getSiteUrl: () => 'https://different-preview.vercel.app', isSupabaseConfigured: () => true },
    });
    await auth.signInWithOAuth('google', '/admin');
    const target = new URL(calls[0].options.redirectTo);
    assert.equal(target.origin, 'https://cupidmatch.co.uk');
    assert.equal(target.pathname, '/auth/callback');
    assert.equal(target.searchParams.get('next'), '/admin');
    assert.equal(calls[0].options.scopes, 'openid email profile');
    await auth.signInWithOAuth('google', '//evil.test');
    assert.equal(new URL(calls[1].options.redirectTo).searchParams.get('next'), '/dashboard');
  } finally { if (oldWindow === undefined) delete global.window; else global.window = oldWindow; }
});
