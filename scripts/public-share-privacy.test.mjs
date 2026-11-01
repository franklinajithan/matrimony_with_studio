import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
const db = new PGlite();
after(() => db.close());
const member = '10000000-0000-4000-8000-000000000001';
const owner = '10000000-0000-4000-8000-000000000002';
const token = 'a'.repeat(64);
await db.exec(`
create role anon; create role authenticated;
create schema auth; create schema private;
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create function private.account_session_active() returns boolean language sql stable as $$ select true $$;
create table public.profiles (
 id uuid primary key, display_name text, dob text, location text, profession text,
 bio text, photo_url text, photo_privacy text, is_verified boolean, is_published boolean,
 suspended_at timestamptz, deactivated_at timestamptz, deletion_requested_at timestamptz
);
create table public.profile_share_links (
 id uuid primary key default gen_random_uuid(), profile_id uuid references public.profiles,
 owner_id uuid references public.profiles, token_hash text, expires_at timestamptz, revoked_at timestamptz
);
create function public.member_is_active(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=p_id and suspended_at is null and deactivated_at is null and deletion_requested_at is null)
$$;
grant usage on schema public to anon, authenticated;
insert into public.profiles (id,display_name,dob,photo_url,photo_privacy,is_published)
 values ('${member}','Disposable member','1990-06-15','https://example.com/photo.jpg','members',true),
 ('${owner}','Disposable owner','1991-06-15',null,'hidden',true);
insert into public.profile_share_links(profile_id,owner_id,token_hash,expires_at)
 values ('${member}','${owner}','${token}',now()+interval '1 day');
`);
await db.exec(await readFile(new URL('../supabase/migrations/20261022221000_permanent_public_member_references.sql', import.meta.url), 'utf8'));
const proposed = await readFile(new URL('../supabase/migrations/20261101122640_harden_public_profile_shares.sql', import.meta.url), 'utf8');
await db.exec(proposed);
async function resolve(role = 'anon', hash = token) {
  await db.exec(`set role ${role}`);
  try { return (await db.query('select * from public.resolve_profile_share($1)', [hash])).rows; }
  finally { await db.exec('reset role'); }
}
async function reset() {
  await db.exec(`update profiles set suspended_at=null,deactivated_at=null,deletion_requested_at=null,is_published=true,photo_privacy='members'; update profile_share_links set revoked_at=null,expires_at=now()+interval '1 day';`);
}

test('valid public share returns only its limited projection for anon and members', async () => {
  for (const role of ['anon', 'authenticated']) {
    const [row] = await resolve(role);
    assert.equal(row.display_name, 'Disposable member');
    assert.equal(row.photo_url, 'https://example.com/photo.jpg');
    assert.equal('dob' in row, false);
    assert.equal('owner_id' in row, false);
    assert.equal('token_hash' in row, false);
  }
});
for (const privacy of ['connections','hidden','unknown',null]) {
  test(`public share does not disclose ${privacy} photos`, async () => {
    await reset();
    await db.query('update profiles set photo_privacy=$1 where id=$2', [privacy, member]);
    const rows = await resolve();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].photo_url, null);
  });
}
for (const column of ['suspended_at','deactivated_at','deletion_requested_at']) {
  test(`${column} on target or sharing owner makes links unavailable`, async () => {
    for (const id of [member, owner]) {
      await reset();
      await db.query(`update profiles set ${column}=now() where id=$1`, [id]);
      assert.deepEqual(await resolve(), []);
    }
  });
}
test('unpublished, revoked, expired and invalid tokens cannot resolve', async () => {
  for (const sql of [
    `update profiles set is_published=false where id='${member}'`,
    'update profile_share_links set revoked_at=now()',
    "update profile_share_links set expires_at=now()-interval '1 second'",
  ]) {
    await reset(); await db.exec(sql); assert.deepEqual(await resolve(), []);
  }
  await reset();
  for (const value of [null, '', 'short', 'b'.repeat(64)]) assert.deepEqual(await resolve('anon', value), []);
});
test('clients cannot execute the internal trigger function and insert trigger still works', async () => {
  for (const role of ['anon','authenticated']) {
    const result = await db.query("select has_function_privilege($1, 'public.assign_member_public_reference()', 'EXECUTE') as allowed", [role]);
    assert.equal(result.rows[0].allowed, false);
  }
  const id = '10000000-0000-4000-8000-000000000003';
  await db.query('insert into profiles(id) values ($1)', [id]);
  assert.equal((await db.query('select count(*)::int as n from member_public_references where member_id=$1', [id])).rows[0].n, 1);
});
test('migration is repeatable and preserves existing links and member data', async () => {
  await reset(); await db.exec(proposed);
  assert.equal((await resolve()).length, 1);
  assert.equal((await db.query('select count(*)::int as n from profiles')).rows[0].n, 3);
});
