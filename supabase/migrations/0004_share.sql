-- Commit — public share page (recruiter-facing "public log")
-- Run after 0003. Adds an opt-in public profile flag and a revocable unlisted
-- share token. The public page is derived ONLY from streak/commitment history —
-- it never exposes repo names, commit messages, reflections, or the coach's
-- lessons, so private-repo content can't leak.

alter table public.profiles
  add column if not exists public_enabled boolean not null default false,
  add column if not exists share_token   text unique;

-- Case-insensitive lookup for /u/<github-login>.
create index if not exists profiles_login_lower_idx
  on public.profiles (lower(github_login));
