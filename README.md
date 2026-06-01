# Commit

Daily discipline coach for self-taught developers. Promise the work, push it, and the coach reads your real git diff and tells you the truth — strict about the code, on your side about you.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase — Postgres + Auth (GitHub OAuth as the login)
- Anthropic Claude — generates the question from your diff and judges your answer
- GitHub REST API (polling) — detects your pushes and reads the diff
- Custom components + CSS variables (GitHub-dark tokens). No UI library.

## What works (core daily loop)

Sign in with GitHub → pick the repo that counts → set a commitment → push your work →
the coach asks one question about the actual diff → answer it → get a two-part verdict
(streak + lesson) → log how the day felt → set tomorrow's commitment. The streak persists.

Deferred for a later phase (UI exists, not yet wired to real data): Insights, accountability
partner, push notifications/scheduling, PWA install, public log.

## Setup

You need a Supabase project, a GitHub OAuth app, and an Anthropic API key.

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the Project URL, the `anon` public key, and the `service_role` key.
3. **SQL Editor**: paste and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

### 2. GitHub OAuth app

1. GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**.
2. **Authorization callback URL**: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (find `<your-project-ref>` in your Supabase URL).
3. Copy the **Client ID** and generate a **Client secret**.
4. In Supabase → **Authentication → Providers → GitHub**: enable it, paste the client id/secret,
   and set scopes to `repo read:user user:email`.
   (`repo` is needed to read commits/diffs from private repos; use `public_repo` if you only
   care about public ones.)

### 3. Anthropic API key

Get a key from [console.anthropic.com](https://console.anthropic.com).

### 4. Environment

Fill in `.env.local` (already git-ignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server only — never exposed to the browser
ANTHROPIC_API_KEY=...                # server only
```

### 5. Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). If keys are missing you'll see a setup
screen instead of a crash.

## Project structure

```
app/
  layout.tsx              — fonts, meta, root layout
  globals.css             — design tokens
  page.tsx                — app shell: auth gates, onboarding, Today + overlays
  auth/callback/route.ts  — OAuth code exchange; stores profile + GitHub token
  api/
    me/route.ts                 — bootstrap (repo selected? any commitments?)
    today/route.ts              — todayState + streak + push/diff + resolution
    commitment/route.ts         — create/replace a commitment
    github/repos/route.ts       — list repos (repo picker)
    github/select-repo/route.ts — save the chosen repo
    resolve/question/route.ts   — detect push, read diff, ask one question
    resolve/submit/route.ts     — judge the answer → verdict (persisted if it counts)
    resolve/emotion/route.ts    — save the check-in, bank the streak
lib/
  supabase/{client,server,admin,middleware}.ts — Supabase clients
  github.ts               — REST wrapper (repos, latest push, commit diff)
  coach.ts                — Claude: generateQuestion + evaluateAnswer
  date.ts                 — timezone-aware "today" helpers
  server-context.ts       — resolves user + profile + GitHub token per request
  types.ts                — DB row types + API DTOs
middleware.ts             — refreshes the auth session on each request
components/               — screens (today, resolve, commitment, onboarding,
                            repo-select, insights, settings) + ui primitives
supabase/migrations/      — schema
```

## How the streak rules work

The streak is about **honesty and understanding, not correctness**. An honest-but-wrong answer
still counts (`verdict: 'wrong'`); only an evasive, bluffed, or "just restates the code" answer is
withheld (`verdict: 'none'`). A commitment whose day passes without a counted resolution resets the
streak to zero. This rule is encoded in the system prompts in [`lib/coach.ts`](lib/coach.ts).
