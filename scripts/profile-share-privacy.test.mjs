import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {test,after} from 'node:test';
import assert from 'node:assert/strict';

const db=new PGlite();
after(()=>db.close());
await db.exec(`
create role anon; create role authenticated; create role service_role;
create table public.profiles(
 id uuid primary key,display_name text,dob text,location text,profession text,
 bio text,photo_url text,photo_privacy text,is_verified boolean,is_published boolean,
 suspended_at timestamptz
);
create table public.profile_share_links(
 id uuid primary key,profile_id uuid,expires_at timestamptz,token_hash text,revoked_at timestamptz
);
create or replace function public.member_is_active(p_id uuid) returns boolean
 language sql stable as $$ select true $$;
create or replace function public.assign_member_public_reference()
 returns trigger language plpgsql security definer as $$ begin return new; end $$;
insert into public.profiles values(
 '10000000-0000-4000-8000-000000000001','Shared Member','1990-01-02',
 'London','Engineer','Marriage profile',
 'https://example.invalid/photo.jpg','connections',true,true,null
);
insert into public.profile_share_links values (
 '20000000-0000-4000-8000-000000000001',
 '10000000-0000-4000-8000-000000000001',
 now()+interval '2 days',
 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',null
);
`);
await db.exec(await readFile('supabase/migrations/20261108001500_profile_share_privacy_hardening.sql','utf8'));
const token='abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
async function shared(){
 const result=await db.query('select * from public.resolve_profile_share($1)',[token]);
 return result.rows;
}
test('connections-only and hidden photos are never returned from public sharing',async()=>{
 assert.equal((await shared()).length,1);
 assert.equal((await shared())[0].photo_url,null);
 await db.exec("update public.profiles set photo_privacy='hidden'");
 assert.equal((await shared())[0].photo_url,null);
});
test('regular member photo privacy preserves existing token-sharing behavior',async()=>{
 await db.exec("update public.profiles set photo_privacy='members'");
 assert.equal((await shared())[0].photo_url,'https://example.invalid/photo.jpg');
});
test('unpublished, suspended, expired and revoked profile shares fail closed',async()=>{
 await db.exec("update public.profiles set is_published=false");
 assert.equal((await shared()).length,0);
 await db.exec("update public.profiles set is_published=true,suspended_at=now()");
 assert.equal((await shared()).length,0);
 await db.exec("update public.profiles set suspended_at=null;update public.profile_share_links set expires_at=now()-interval '1 day'");
 assert.equal((await shared()).length,0);
 await db.exec("update public.profile_share_links set expires_at=now()+interval '1 day',revoked_at=now()");
 assert.equal((await shared()).length,0);
});
test('anonymous cannot invoke internal reference-assignment trigger routine',async()=>{
 const grants=await db.query("select has_function_privilege('anon','public.assign_member_public_reference()','EXECUTE') as anonymous,has_function_privilege('authenticated','public.assign_member_public_reference()','EXECUTE') as member");
 assert.equal(grants.rows[0].anonymous,false);
 assert.equal(grants.rows[0].member,false);
});
