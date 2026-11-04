const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const identity = { id: 'test-member', email: 'test@example.invalid', identities: [{}], user_metadata: { full_name: 'Test Member' } };
function setup(options = {}) {
  let listener; let unsubscribed = false; let oauth; let signups = 0; let signupInput; let resendInput;
  const client = { auth: {
    signUp: async value => { signupInput=value; signups++; return { data: { user: options.user || identity, session: options.session || null }, error: null }; },
    resend: async value => {resendInput=value;return {error:null};},
    getSession: async () => ({ data: { session: options.session || null }, error: null }),
    onAuthStateChange: cb => { listener = cb; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; },
    signInWithOAuth: async value => { oauth = value; return { data: { url: 'https://provider.invalid' }, error: options.oauthError || null }; },
  } };
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('src/lib/supabase/auth.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = vm.createContext({ console, fetch: async () => ({ok: true, json: async () => ({ enabled: options.enabled !== false })}) });
  vm.runInContext(`(function(require,module,exports){${source}\n})`, context)(name => {
    if (name === './client') return { supabase: client };
    if (name === './env') return { isSupabaseConfigured: () => true, getSiteUrl: () => 'https://cupidmatch.co.uk' };
    throw new Error(name);
  }, mod, mod.exports);
  return { api: mod.exports, emit: session => listener('SIGNED_IN', session), unsubscribed: () => unsubscribed, oauth: () => oauth, signups: () => signups, signupInput: () => signupInput, resendInput: () => resendInput };
}
test('confirmation-required signup returns identity but never caches a signed-in user', async () => {
  const { api } = setup();
  const result = await api.createUserWithEmailAndPassword(null, identity.email, 'test-password');
  assert.equal(result.user.uid, identity.id);
  assert.equal(result.needsEmailConfirmation, true);
  assert.equal(result.session, null);
  assert.equal(api.auth.currentUser, null);
});
test('signup with a session exposes the authenticated user', async () => {
  const session = { user: identity };
  const { api } = setup({ session });
  const result = await api.createUserWithEmailAndPassword(null, identity.email, 'test-password');
  assert.equal(result.needsEmailConfirmation, false);
  assert.equal(api.auth.currentUser.uid, identity.id);
});
test('paused registration never calls signup', async () => {
  const s = setup({ enabled: false });
  await assert.rejects(s.api.createUserWithEmailAndPassword(null, identity.email, 'test-password'), /paused/);
  assert.equal(s.signups(), 0);
});
test('duplicate unconfirmed identity remains an error and never authenticates', async () => {
  const s = setup({ user: { ...identity, identities: [] } });
  await assert.rejects(s.api.createUserWithEmailAndPassword(null, identity.email, 'test-password'), error => error.code === 'auth/email-already-in-use');
  assert.equal(s.api.auth.currentUser, null);
});
test('hydration and later OAuth state reach subscribers; unsubscribe stops updates', async () => {
  const s = setup({ session: { user: identity } }); const seen = [];
  const stop = s.api.onAuthStateChanged(user => seen.push(user?.uid ?? null));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(seen[0], identity.id);
  s.emit(null); assert.equal(seen.at(-1), null);
  stop(); s.emit({ user: identity });
  assert.equal(seen.at(-1), null); assert.equal(s.unsubscribed(), true);
});
test('Google OAuth preserves an encoded internal destination and provider errors reject', async () => {
  const s = setup();
  await s.api.signInWithOAuth('google', '/onboarding?step=2');
  assert.equal(s.oauth().provider, 'google');
  assert.equal(s.oauth().options.redirectTo, 'https://cupidmatch.co.uk/auth/callback?next=%2Fonboarding%3Fstep%3D2');
  const failed = setup({ oauthError: { message: 'network unavailable' } });
  await assert.rejects(failed.api.signInWithOAuth('google'), /network unavailable/);
});

test('signup always continues to profile onboarding without selecting or granting a plan',async()=>{const s=setup();await s.api.createUserWithEmailAndPassword(null,identity.email,'fixture-pass',{displayName:'Fixture Member'});const u=new URL(s.signupInput().options.emailRedirectTo);assert.equal(u.origin,'https://cupidmatch.co.uk');assert.equal(u.searchParams.get('next'),'/onboarding');assert.equal(s.api.auth.currentUser,null);assert.equal(s.signupInput().options.data.plan,undefined);assert.equal(s.signupInput().options.data.display_name,'Fixture Member');});

test('confirmation resend continues onboarding without a membership choice',async()=>{const s=setup();await s.api.resendSignupConfirmation(identity.email);const u=new URL(s.resendInput().options.emailRedirectTo);assert.equal(u.origin,'https://cupidmatch.co.uk');assert.equal(u.searchParams.get('next'),'/onboarding');assert.equal(s.api.auth.currentUser,null);});
