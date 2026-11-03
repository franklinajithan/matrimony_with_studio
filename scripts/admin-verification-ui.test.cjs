const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers/load-ts.cjs');
const flush = () => new Promise(resolve => setImmediate(resolve));
const first = { id: '20000000-0000-4000-8000-000000000001', member_id: 'member-A', member_note: 'Please review my profile', created_at: '2026-11-01' };
const second = { ...first, id: '20000000-0000-4000-8000-000000000002', member_id: 'member-B' };
const queue = { requests: [first, second], profiles: [], hasMoreRequests: true, hasMoreProfiles: true };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
function fixture(t, fetcher) {
  const previous = global.fetch; global.fetch = fetcher;
  const states = [], refs = [], effects = []; let s = 0, r = 0, e = 0; const pendingEffects = [];
  function cleanup() { for (const effect of effects) effect?.dispose?.(); }
  t.after(() => { cleanup(); global.fetch = previous; });
  const react = {
    useState(initial) { const i = s++; if (!(i in states)) states[i] = initial; return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }]; },
    useRef(initial) { const i = r++; return refs[i] ||= { current: initial }; },
    useEffect(callback, deps) {
      const i = e++; if (!effects[i] || deps.some((v, n) => v !== effects[i].deps[n])) {
        const previous = effects[i]; effects[i] = { deps };
        pendingEffects.push(() => { previous?.dispose?.(); effects[i].dispose = callback(); });
      }
    },
  };
  const named = names => Object.fromEntries(names.split(' ').map(name => [name, name]));
  const component = load('src/app/admin/verifications/page-client.tsx', {
    react, 'next/link': { default: 'Link' }, '@/components/ui/button': named('Button'), '@/components/ui/textarea': named('Textarea'), '@/components/ui/label': named('Label'),
    '@/components/ui/card': named('Card CardContent CardDescription CardHeader CardTitle'),
    '@/components/ui/alert-dialog': named('AlertDialog AlertDialogContent AlertDialogHeader AlertDialogTitle AlertDialogDescription AlertDialogFooter AlertDialogCancel'),
    'lucide-react': named('ShieldCheck RefreshCw'),
  }).default;
  function render() { s = r = e = 0; const tree = component(); while (pendingEffects.length) pendingEffects.shift()(); return tree; }
  function all(node, predicate) { if (!node || typeof node !== 'object') return []; return [...(predicate(node) ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => all(child, predicate))]; }
  function find(predicate) { return all(render(), predicate)[0]; }
  const buttons = label => all(render(), node => node.type === 'Button' && node.props.children === label);
  const button = label => { const node = buttons(label)[0]; assert.ok(node, 'Missing button '+label); return node; };
  const input = value => { const node = find(n => n.type === 'Textarea'); assert.ok(node); node.props.onChange({ target: { value } }); };
  const dialog = () => find(n => n.type === 'AlertDialogContent');
  return { render, find, all, button, buttons, input, dialog, cleanup };
}
async function ready(f) { f.render(); await flush(); f.render(); }
test('load failure is visible and retry restores the pending queue', async t => {
  let calls = 0; const f = fixture(t, async () => { if (++calls === 1) throw Error('offline'); return response(queue); });
  await ready(f); assert.ok(f.find(n => n.props?.role === 'alert')); f.button('Try again').props.onClick(); await ready(f);
  assert.equal(f.buttons('Approve profile review').length, 2); assert.equal(calls, 2);
});
test('member-specific confirmation resets notes when cancelling and selecting another member', async t => {
  let writes = 0; const f = fixture(t, async (_, opts) => { if (opts.method) writes++; return response(queue); }); await ready(f);
  f.buttons('Approve profile review')[0].props.onClick(); assert.equal(writes, 0); assert.ok(f.dialog()); assert.equal(f.button('Confirm profile review').props.disabled, true);
  f.input('Reason specific to member A');
  f.find(n => n.type === 'AlertDialog').props.onOpenChange(false); assert.equal(f.dialog(), undefined);
  f.buttons('Reject')[1].props.onClick();
  assert.equal(f.find(n => n.type === 'Textarea').props.value, ''); assert.equal(f.button('Confirm profile review').props.disabled, true);
  assert.ok(f.find(n => n.type === 'AlertDialogDescription' && n.props.children.includes('member-B')));
});
test('duplicate confirmation uses one persisted write and does not close or claim success early', async t => {
  let writes = 0, release; const f = fixture(t, async (_, opts) => {
    if (opts.method === 'POST') { writes++; return new Promise(resolve => { release = resolve; }); }
    return response(queue);
  }); await ready(f); f.buttons('Approve profile review')[0].props.onClick(); f.input('Reviewed member A profile');
  const submit = f.button('Confirm profile review').props.onClick; submit(); submit(); await flush();
  assert.equal(writes, 1); assert.ok(f.dialog()); assert.equal(f.find(n => n.props?.role === 'status'), undefined);
  f.find(n => n.type === 'AlertDialog').props.onOpenChange(false); assert.ok(f.dialog());
  release(response({ review: { id: first.id, status: 'approved' } })); await flush(); f.render(); await flush();
  assert.equal(f.dialog(), undefined); assert.ok(f.find(n => n.props?.role === 'status' && n.props.children === 'Profile review saved and recorded in the audit log.'));
});
test('network failure preserves review context and reason for recovery without success', async t => {
  const f = fixture(t, async (_, opts) => { if (opts.method === 'POST') throw Error('offline'); return response(queue); }); await ready(f);
  f.buttons('Reject')[0].props.onClick(); f.input('Requested information is incomplete'); f.button('Confirm profile review').props.onClick(); await flush();
  assert.ok(f.dialog()); assert.equal(f.find(n => n.type === 'Textarea').props.value, 'Requested information is incomplete'); assert.ok(f.find(n => n.props?.role === 'alert')); assert.equal(f.button('Confirm profile review').props.disabled, false);
});
test('stale/deleted review closes old confirmation and reloads the oldest pending page', async t => {
  for (const status of [409, 404]) {
    let lastUrl, writes = 0; const f = fixture(t, async (url, opts) => {
      if (opts.method === 'POST') { writes++; return response({ error: 'Request already reviewed' }, status); }
      lastUrl = url; return response(queue);
    }); await ready(f); f.button('Next requests').props.onClick(); await ready(f); assert.match(lastUrl, /requestOffset=20/);
    f.buttons('Approve profile review')[0].props.onClick(); f.input('Reviewed member A profile'); f.button('Confirm profile review').props.onClick(); await flush(); f.render(); await flush();
    assert.equal(writes, 1); assert.equal(f.dialog(), undefined); assert.match(lastUrl, /requestOffset=0/); assert.ok(f.find(n => n.props?.role === 'alert')); f.cleanup();
  }
});
test('paging is independent and late obsolete responses cannot replace the current page', async t => {
  const pending = []; const f = fixture(t, (url, opts) => new Promise(resolve => { pending.push({ url, opts, resolve }); }));
  f.render(); pending[0].resolve(response(queue)); await flush(); f.render();
  f.button('Next requests').props.onClick(); f.render(); assert.match(pending[1].url, /profileOffset=0&requestOffset=20/);
  // Simulate a refresh after a page fetch has begun; the old response ignores abort.
  f.find(n => n.type === 'Button' && n.props.onClick && Array.isArray(n.props.children)).props.onClick(); f.render();
  assert.equal(pending[1].opts.signal.aborted, true); assert.match(pending[2].url, /requestOffset=0/);
  pending[2].resolve(response({ ...queue, requests: [second] })); await flush(); f.render();
  pending[1].resolve(response({ ...queue, requests: [first] })); await flush();
  f.buttons('Reject')[0].props.onClick(); assert.ok(f.find(n => n.type === 'AlertDialogDescription' && n.props.children.includes('member-B')));
});
test('malformed success cannot close confirmation or display a saved review', async t => {
  const f = fixture(t, async (_, opts) => response(opts.method === 'POST' ? { review: { id: 'wrong', status: 'approved' } } : queue));
  await ready(f); f.buttons('Approve profile review')[0].props.onClick(); f.input('Reviewed member A profile'); f.button('Confirm profile review').props.onClick(); await flush();
  assert.ok(f.dialog()); assert.ok(f.find(n => n.props?.role === 'alert')); assert.equal(f.find(n => n.props?.role === 'status'), undefined);
});
test('a last-page response disables next independently for both queues', async t => {
  const f = fixture(t, async () => response({ ...queue, hasMoreRequests: false, hasMoreProfiles: true })); await ready(f);
  assert.equal(f.button('Next requests').props.disabled, true); assert.equal(f.button('Next profiles').props.disabled, false);
});
