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
  assert.equal(result.href, 'https://cupidmatch.co.uk/dashboard');
});
test('Expired exchange retains requested destination for retry', async () => {
  const result = await callback(async () => ({ error: { message: 'code expired' } })).GET(new Request('https://cupidmatch.co.uk/auth/callback?code=expired&next=%2Fdashboard'));
  assert.equal(result.searchParams.get('error'), 'expired_link');
  assert.equal(result.searchParams.get('next'), '/dashboard');
});
test('OAuth callbacks with no destination open dashboard and email recovery opens password reset', async () => {
  const result = await callback().GET(new Request('https://cupidmatch.co.uk/auth/callback?code=fixture'));
  assert.equal(result.pathname, '/dashboard');
  const handler = load('src/app/auth/callback/route.ts', {
    'next/server': {NextResponse:{redirect:url=>new URL(url)}},
    '@/lib/supabase/server': {createSupabaseServerClient:async()=>({auth:{verifyOtp:async()=>({error:null})}})},
  });
  const recovery = await handler.GET(new Request('https://cupidmatch.co.uk/auth/callback?token_hash=fixture&type=recovery'));
  assert.equal(recovery.pathname, '/reset-password');
});

function middlewareHarness(user, options={}) {
  class FakeResponse extends Response {
    constructor(body,init) {super(body,init);this.saved=new Map();this.cookies={
      getAll:()=>Array.from(this.saved.values()),
      set:(name,value,cookieOptions={})=>{const c=typeof name==='string'?{name,value,...cookieOptions}:name;this.saved.set(c.name,c)},
    }}
    static next(){return new FakeResponse(null)}
    static redirect(url){return new FakeResponse(null,{status:307,headers:{location:String(url)}})}
  }
  return load('src/lib/supabase/middleware.ts',{
    'next/server':{NextResponse:FakeResponse},
    './env':{getSupabaseUrl:()=>options.missing?null:'https://fixture.supabase.co',getSupabaseAnonKey:()=>'publishable_fixture'},
    '@supabase/ssr':{createServerClient:(_url,_key,config)=>({auth:{getUser:async()=>{
      if(options.throw)throw Error('Network unavailable');
      if(options.refresh)config.cookies.setAll([{name:'sb-fixture-auth-token',value:'refreshed_fixture',options:{path:'/',sameSite:'lax'}}]);
      return {data:{user},error:options.error || null};
    }}})},
  });
}
function middlewareRequest(path) {
  const nextUrl=new URL('https://cupidmatch.co.uk'+path);
  nextUrl.clone=()=>new URL(nextUrl);
  return {url:nextUrl.href,nextUrl,cookies:{getAll:()=>[],set:()=>{}}};
}
test('middleware preserves refreshed cookies on dashboard redirect and prevents session caching',async()=>{
  const r=await middlewareHarness({id:'fixture'},{refresh:true}).updateSession(middlewareRequest('/login'));
  assert.equal(new URL(r.headers.get('location')).pathname,'/dashboard');
  assert.equal(r.cookies.getAll()[0].value,'refreshed_fixture');
  assert.equal(r.headers.get('cache-control'),'private, no-store');
});
test('middleware keeps requested route on anonymous login and fails closed during auth outage',async()=>{
  const r=await middlewareHarness(null).updateSession(middlewareRequest('/future-map?tab=own'));
  assert.equal(new URL(r.headers.get('location')).searchParams.get('next'),'/future-map?tab=own');
  assert.equal((await middlewareHarness(null,{throw:true}).updateSession(middlewareRequest('/admin'))).status,503);
  assert.equal((await middlewareHarness(null,{missing:true}).updateSession(middlewareRequest('/admin'))).status,503);
  assert.equal((await middlewareHarness(null,{throw:true}).updateSession(middlewareRequest('/about'))).status,200);
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
