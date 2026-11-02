const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers/load-ts.cjs');
const genders = load('src/lib/profile-gender.ts');
const countries = load('src/data/world-countries.ts', { './diaspora-countries': load('src/data/diaspora-countries.ts') });
const matching = load('src/lib/matching/preferences.ts', { '@/lib/profile-gender': genders, '@/data/world-countries': countries });
const empty = { query: '', countries: [], languages: [], religions: [], professions: [], smoking: [], drinking: [] };

test('discovery and scoring use canonical gender before stale legacy fields', () => {
  const member = { extra: { gender: 'female', matchDetails: { gender: 'Man' } } };
  assert.equal(matching.profileMatchesFilters(member, { ...empty, gender: 'Woman' }), true);
  assert.equal(matching.profileMatchesFilters(member, { ...empty, gender: 'Man' }), false);
  assert.equal(matching.preferenceScore(member, { ...empty, gender: 'Woman' }).percentage, 100);
  assert.equal(matching.defaultDiscoveryGender(member, empty), 'Man');
});

test('saved gender preferences override defaults, including an explicit neutral choice', () => {
  const member = { extra: { gender: 'male' } };
  assert.equal(matching.defaultDiscoveryGender(member, empty), 'Woman');
  assert.equal(matching.defaultDiscoveryGender(member, { ...empty, gender: 'Man' }), 'Man');
  for (const gender of ['No preference', 'Any', 'all']) {
    assert.equal(matching.defaultDiscoveryGender(member, { ...empty, gender }), undefined);
  }
  assert.equal(matching.defaultDiscoveryGender({}, empty), undefined);
});

test('gender filters accept legacy labels, exclude unknowns, and support clearing', () => {
  for (const [value, filter] of [['male', 'Man'], ['Woman', 'female'], ['nonbinary', 'Non-binary']]) {
    const profile = { extra: { matchDetails: { gender: value } } };
    assert.equal(matching.profileMatchesFilters(profile, { ...empty, gender: filter }), true);
  }
  assert.equal(matching.profileMatchesFilters({}, { ...empty, gender: 'Woman' }), false);
  assert.equal(matching.profileMatchesFilters({}, { ...empty, gender: 'No preference' }), true);
});

function signupApi(session) {
  const member = { id: 'test-member', email: 'test@example.com', identities: [{ id: 'identity' }] };
  const api = load('src/lib/supabase/auth.ts', {
    './client': { supabase: { auth: { signUp: async () => ({ data: { user: member, session }, error: null }) } } },
    './env': { getSiteUrl: () => 'https://example.com', isSupabaseConfigured: () => true },
  });
  return { api, member };
}

test('email confirmation signup returns the pending user without authenticating the UI', async () => {
  const original = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ enabled: true }) });
  try {
    const { api, member } = signupApi(null);
    const result = await api.createUserWithEmailAndPassword(null, member.email, 'test-password');
    assert.equal(result.user.uid, member.id);
    assert.equal(result.needsEmailConfirmation, true);
    assert.equal(api.auth.currentUser, null);
  } finally { global.fetch = original; }
});

test('signup with a verified session populates the authenticated cache', async () => {
  const original = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ enabled: true }) });
  try {
    const { api } = signupApi({ user: { id: 'authenticated-member' } });
    const result = await api.createUserWithEmailAndPassword(null, 'test@example.com', 'test-password');
    assert.equal(result.needsEmailConfirmation, false);
    assert.equal(api.auth.currentUser.uid, 'authenticated-member');
  } finally { global.fetch = original; }
});

// Render the real component with isolated hook and network boundaries. Event
// handlers execute unchanged; no real session or database is used.
function discoveryHarness({ shortlist = async () => {}, send = async () => {}, auth } = {}) {
  const fs = require('node:fs');
  const ts = require('typescript');
  const file = 'src/components/discovery/PreferenceDiscovery.tsx';
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const mocks = {};
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const names = statement.importClause?.namedBindings?.elements || [];
    mocks[statement.moduleSpecifier.text] = Object.fromEntries(names.map(n => [n.name.text, n.name.text]));
  }
  const state = []; const effects = []; let cursor = 0;
  const member = { id: 'candidate', displayName: 'Test Member', extra: { gender: 'female' }, isShortlisted: false };
  const toasts = []; const pending = { current: new Set() };
  mocks.react = {
    useState: initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = index === 0 ? [member] : index === 5 ? false : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useRef: () => pending,
    useEffect: fn => { effects.push(fn); }, useCallback: fn => fn, useMemo: fn => fn(),
  };
  mocks['next/navigation'] = { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() };
  mocks['@/lib/supabase/client'] = { supabase: { auth: { getUser: auth || (async () => ({ data: { user: { id: 'self' } }, error: null })) } } };
  mocks['@/lib/supabase/shortlist'] = { addToShortlist: shortlist, removeFromShortlist: shortlist };
  mocks['@/lib/supabase/matches'] = { sendInterest: send };
  mocks['@/lib/matching/preferences'] = matching;
  mocks['@/lib/matching/search-url'] = load('src/lib/matching/search-url.ts');
  mocks['@/hooks/use-toast'] = { useToast: () => ({ toast: value => toasts.push(value) }) };
  mocks['@/components/i18n/I18nProvider'] = { useI18n: () => ({ language: 'en' }) };
  mocks['@/components/i18n/messages'] = { getMessages: () => ({ discover: {} }) };
  mocks['@/data/world-countries'] = countries;
  const { PreferenceDiscovery } = load(file, mocks);
  function render() { cursor = 0; return PreferenceDiscovery(); }
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const found = find(child, predicate); if (found) return found;
    }
  }
  return { state, toasts, pending, effects, render, action: label => {
    const button = find(render(), node => node.type === 'Button' && (label === 'shortlist' ? node.props['aria-label'] === 'Shortlist' : node.props.onClick?.toString().includes('interest(person.id)')));
    assert.ok(button, `missing ${label} button`);
    return button.props.onClick;
  } };
}

for (const action of ['shortlist', 'interest']) {
  test(`${action} handles database errors without changing member state and permits retry`, async () => {
    let fail = true;
    const operation = async () => { if (fail) throw { message: 'Request denied by database' }; };
    const ui = discoveryHarness({ shortlist: operation, send: operation });
    ui.action(action)();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ui.toasts.at(-1).description, 'Request denied by database');
    assert.equal(ui.toasts.at(-1).variant, 'destructive');
    assert.equal(ui.state[0][0].isShortlisted, false);
    assert.equal(ui.pending.current.size, 0);
    fail = false;
    ui.action(action)();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ui.toasts.at(-1).title, action === 'shortlist' ? 'Added to shortlist' : 'Interest sent');
  });

  test(`${action} prevents duplicate requests before auth finishes`, async () => {
    let release; let calls = 0;
    const ui = discoveryHarness({ auth: () => new Promise(resolve => { release = resolve; }), shortlist: async () => { calls++; }, send: async () => { calls++; } });
    const click = ui.action(action);
    click(); click();
    release({ data: { user: { id: 'self' } }, error: null });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, 1);
    assert.equal(ui.toasts.length, 1);
  });

  test(`${action} reports an expired session and clears pending state`, async () => {
    const ui = discoveryHarness({ auth: async () => ({ data: { user: null }, error: null }) });
    ui.action(action)();
    await new Promise(resolve => setImmediate(resolve));
    assert.match(ui.toasts.at(-1).description, /sign in again/);
    assert.equal(ui.pending.current.size, 0);
  });
}

test('shared worldwide country source covers 249 distinct ISO countries and legacy drafts', () => {
  assert.equal(countries.ISO_COUNTRY_CODES.length, 249);
  assert.equal(new Set(countries.ISO_COUNTRY_CODES).size, 249);
  for (const code of ['LK','GB','AU','CA','FR','DE','CH','IN','AE','US','AX','RE','ZW']) {
    assert.ok(countries.WORLD_COUNTRIES.some(country => country.code === code));
  }
  const schema = load('src/lib/onboarding/schema.ts', { '@/data/world-countries': countries });
  assert.equal(schema.COUNTRY_OPTIONS, countries.WORLD_COUNTRY_NAMES);
  const draft = { country: 'Historical country label', region: 'Évry-Courcouronnes' };
  assert.equal(schema.parseOnboardingDraft(draft).country, draft.country);
  assert.equal(schema.parseOnboardingDraft(draft).region, draft.region);
  assert.ok(countries.countryOptionsWithLegacy([draft.country]).includes(draft.country));
});

test('country filtering and scoring compare ISO codes and legacy names compatibly', () => {
  for (const [saved, selected] of [['UK','United Kingdom'],['United States of America','US'],['UAE','United Arab Emirates'],['Côte d’ivoire','CI'],['Turkey','Türkiye']]) {
    const profile = { country: saved };
    assert.equal(matching.profileMatchesFilters(profile, { ...empty, countries: [selected] }), true);
    assert.equal(matching.preferenceScore(profile, { ...empty, countries: [selected] }).percentage, 100);
  }
  assert.equal(countries.countriesMatch('Congo - Kinshasa','Congo - Brazzaville'), false);
  assert.equal(countries.countriesMatch('Historical label', ' historical label '), true);
  assert.equal(countries.countriesMatch('', ''), false);
  assert.equal(matching.profileMatchesFilters({ country: 'Sri Lanka' }, { ...empty, countries: ['Worldwide'] }), true);
  assert.equal(matching.profileMatchesFilters({ country: 'Sri Lanka' }, { ...empty, countries: ['GB'] }), false);
});


test('shared search URLs preserve explicit neutral and selected gender filters', () => {
  const original = global.window;
  try {
    for (const gender of ['Woman', 'Man', 'No preference']) {
      let saved;
      global.window = { location: { pathname: '/discover', search: '' }, history: { replaceState: (_state, _title, value) => { saved = value; } } };
      const ui = discoveryHarness(); ui.render(); ui.state[3] = { ...empty, gender }; ui.effects.length = 0; ui.render();
      const persist = ui.effects.find(effect => effect.toString().includes('searchFromFilters'));
      assert.ok(persist); persist();
      assert.equal(new URL(saved, 'https://example.com').searchParams.get('gender'), gender);
    }
  } finally { global.window = original; }
});
