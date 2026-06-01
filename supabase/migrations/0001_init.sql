-- Commit — core daily loop schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Every table is owner-scoped via RLS (owner = auth.uid()).

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  github_login    text,
  github_avatar   text,
  timezone        text not null default 'UTC',
  current_streak  int  not null default 0,
  longest_streak  int  not null default 0,
  last_counted_date date,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: self read"  on public.profiles for select using (auth.uid() = id);
create policy "profiles: self write" on public.profiles for update using (auth.uid() = id);
create policy "profiles: self insert" on public.profiles for insert with check (auth.uid() = id);

-- ── github_connections ───────────────────────────────────────────────────────
-- Holds the OAuth token captured at sign-in so the server can poll the GitHub
-- API later. Token columns are sensitive: no client-facing RLS read policy is
-- granted, so the anon/auth roles cannot select them. The service-role client
-- (admin.ts) bypasses RLS for server-side reads.
create table if not exists public.github_connections (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  provider_token        text,
  provider_refresh_token text,
  selected_repo         text,            -- "owner/name"
  updated_at            timestamptz not null default now()
);

alter table public.github_connections enable row level security;

-- Only allow the owner to see/update the non-sensitive selected_repo via a view
-- below; the base table has no permissive client policies on purpose.

-- A safe, client-readable projection (no tokens).
create or replace view public.my_github_connection
  with (security_invoker = true) as
  select user_id, selected_repo, updated_at
  from public.github_connections
  where user_id = auth.uid();

-- ── commitments ───────────────────────────────────────────────────────────────
create table if not exists public.commitments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  body        text not null,
  type        text not null check (type in ('build', 'learn')),
  target_date date not null,            -- the day this must be kept
  repo        text,
  status      text not null default 'open' check (status in ('open', 'kept', 'missed')),
  created_at  timestamptz not null default now(),
  unique (user_id, target_date)
);

alter table public.commitments enable row level security;

create policy "commitments: self all" on public.commitments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists commitments_user_date_idx
  on public.commitments (user_id, target_date desc);

-- ── resolutions ────────────────────────────────────────────────────────────────
create table if not exists public.resolutions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  commitment_id uuid not null references public.commitments (id) on delete cascade,
  repo          text,
  commit_sha    text,
  additions     int  not null default 0,
  deletions     int  not null default 0,
  files         int  not null default 0,
  question      text,
  answer        text,
  verdict       text check (verdict in ('good', 'wrong', 'none')),
  verdict_title text,
  verdict_body  text,
  lesson_title  text,
  lesson_body   text,
  suggestion    text,
  mood          int,
  energy        int,
  note          text,
  counted       boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.resolutions enable row level security;

create policy "resolutions: self all" on public.resolutions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists resolutions_commitment_idx
  on public.resolutions (commitment_id);
