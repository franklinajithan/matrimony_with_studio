import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite(); after(() => db.close());
const admin = '10000000-0000-4000-8000-000000000001';
const member = '10000000-0000-4000-8000-000000000002';
const id = '20000000-0000-4000-8000-000000000001';
await db.exec(`create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create function public.is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
create table public.verification_requests(id uuid primary key,member_id uuid,status text default 'pending',reviewer_id uuid,reviewer_note text,reviewed_at timestamptz);
create table public.admin_audit_log(actor_id uuid,action text,target_type text,target_id text,metadata jsonb);
grant usage on schema public,auth to anon,authenticated;`);
await db.exec(await readFile('supabase/migrations/20260926140000_audited_profile_review_decisions.sql', 'utf8'));
async function actor(uid = admin, role = 'authenticated') { await db.exec(`reset role; select set_config('test.uid','${uid}',false); set role ${role};`); }
beforeEach(async () => {
  await db.exec(`reset role; delete from verification_requests; delete from admin_audit_log;
  insert into verification_requests(id,member_id) values('${id}','${member}');`);
  await actor();
});
const review = (decision = 'approved') => db.query(`select review_profile_verification_request('${id}','${decision}','Reviewed submitted member profile') result`);
test('existing profile review RPC persists the precise decision, verified reviewer and audit atomically', async () => {
  assert.deepEqual((await review()).rows[0].result, { id, status: 'approved' });
  await db.exec('reset role');
  const row = (await db.query('select * from verification_requests')).rows[0];
  assert.equal(row.reviewer_id, admin); assert.equal(row.status, 'approved'); assert.equal(row.reviewer_note, 'Reviewed submitted member profile'); assert.ok(row.reviewed_at);
  const audit = (await db.query('select * from admin_audit_log')).rows[0]; assert.equal(audit.actor_id, admin); assert.equal(audit.action, 'profile_review_approved'); assert.equal(audit.metadata.member_id, member);
});
test('a second reviewer decision cannot overwrite an already reviewed request', async () => {
  await review(); await assert.rejects(review('rejected'), error => error.code === '23505');
  await db.exec('reset role'); assert.equal((await db.query('select status from verification_requests')).rows[0].status, 'approved'); assert.equal((await db.query('select count(*)::int n from admin_audit_log')).rows[0].n, 1);
});
test('ordinary members and anonymous callers cannot execute an admin review', async () => {
  await actor(member); await assert.rejects(review(), error => error.code === '42501');
  await actor('', 'anon'); await assert.rejects(review(), /permission denied/);
});
test('audit failure rolls back the review and leaves it pending for recovery', async () => {
  await db.exec(`reset role;create function fail_verification_audit() returns trigger language plpgsql as $$begin raise exception 'Audit unavailable';end$$;
  create trigger fail_verification_audit before insert on admin_audit_log for each row execute function fail_verification_audit();`);
  try {
    await actor(); await assert.rejects(review(), /Audit unavailable/); await db.exec('reset role');
    assert.equal((await db.query('select status from verification_requests')).rows[0].status, 'pending');
    assert.equal((await db.query('select count(*)::int n from admin_audit_log')).rows[0].n, 0);
  } finally { await db.exec('reset role;drop trigger fail_verification_audit on admin_audit_log'); }
});
