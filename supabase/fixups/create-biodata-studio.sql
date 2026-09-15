-- Additive Biodata Studio tables (owner-scoped RLS). Safe to re-run.

create extension if not exists "pgcrypto";

create table if not exists public.biodata_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled biodata',
  template_id text not null,
  template_version integer not null default 1,
  language text not null default 'en' check (language in ('en', 'ta', 'si')),
  content jsonb not null default '{}'::jsonb,
  design jsonb not null default '{}'::jsonb,
  visibility jsonb not null default '{}'::jsonb,
  section_order text[] not null default '{}',
  document_version integer not null default 1,
  is_favourite boolean not null default false,
  last_exported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists biodata_documents_owner_updated_idx
  on public.biodata_documents (owner_id, updated_at desc);

create table if not exists public.biodata_template_favourites (
  owner_id uuid not null references auth.users (id) on delete cascade,
  template_id text not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, template_id)
);

create table if not exists public.biodata_share_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.biodata_documents (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  snapshot jsonb not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  recipient_label text,
  watermark text,
  created_at timestamptz not null default now()
);

create index if not exists biodata_share_links_token_idx
  on public.biodata_share_links (token);

alter table public.biodata_documents enable row level security;
alter table public.biodata_template_favourites enable row level security;
alter table public.biodata_share_links enable row level security;

drop policy if exists biodata_documents_owner_all on public.biodata_documents;
create policy biodata_documents_owner_all
  on public.biodata_documents
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists biodata_template_favourites_owner_all on public.biodata_template_favourites;
create policy biodata_template_favourites_owner_all
  on public.biodata_template_favourites
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists biodata_share_links_owner_all on public.biodata_share_links;
create policy biodata_share_links_owner_all
  on public.biodata_share_links
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Public read of non-revoked, non-expired share snapshots (token holders only via app).
drop policy if exists biodata_share_links_public_select on public.biodata_share_links;
create policy biodata_share_links_public_select
  on public.biodata_share_links
  for select
  to anon, authenticated
  using (revoked_at is null and (expires_at is null or expires_at > now()));
