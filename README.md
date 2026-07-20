# Commit

Daily discipline coach for self-taught developers. Promise the work, push it, and the coach reads your real git diff and tells you the truth — strict about the code, on your side about you.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase — Postgres + Auth (GitHub OAuth as the login)
- NVIDIA-hosted `gpt-oss` (OpenAI-compatible API) — generates the question from your diff and judges your answer
- GitHub REST API (polling) — detects your pushes and reads the diff
- Resend — transactional email (daily reminder + accountability-partner ping)
- Web Push (VAPID, via `web-push`) — browser/PWA push notifications
- Custom components + CSS variables (GitHub-dark tokens). No UI library.

## What works (core daily loop)

Sign in with GitHub → pick the repo that counts → set a commitment → push your work →
the coach asks one question about the actual diff → answer it → get a two-part verdict
(streak + lesson) → log how the day felt → set tomorrow's commitment. The streak persists.

### Emotion check-in (mood + energy + notes)

The post-verdict check-in is stored on each resolution and now actually does something:

- **Coach uses it.** `resolve/submit` summarizes your recent mood/energy and passes it to
  the coach model as context. It never affects the verdict — it only right-sizes tomorrow's
  suggested commitment (lighter on a low-energy run, a stretch when you're flying).
- **Insights surfaces it.** The Insights tab shows a 14-day mood chart, a 14-day energy
  chart, and a **reflections** list of your past notes.

### Notifications + accountability (wired to real data)

- **Daily reminder** — email and/or push at your chosen local time. Dispatched by
  `/api/cron/reminders` (see Scheduling below).
- **Accountability partner** — set a partner email in Settings; on a missed day Commit
  emails them once and pushes you a "streak reset" nudge.
- **Push notifications** — toggle in Settings registers a service worker and subscribes
  via VAPID. PWA install (`manifest.json` + `sw.js`) is what makes push reach iPhone.

Still a stub: the public-log share page.

## Setup

You need a Supabase project, a GitHub OAuth app, and an NVIDIA API key (for the AI coach).

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the Project URL, the `anon` public key, and the `service_role` key.
3. **SQL Editor**: run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   then [`supabase/migrations/0002_notifications.sql`](supabase/migrations/0002_notifications.sql)
   (notification preferences, push subscriptions, partner column).

### 2. GitHub OAuth app

1. GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**.
2. **Authorization callback URL**: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (find `<your-project-ref>` in your Supabase URL).
3. Copy the **Client ID** and generate a **Client secret**.
4. In Supabase → **Authentication → Providers → GitHub**: enable it, paste the client id/secret,
   and set scopes to `repo read:user user:email`.
   (`repo` is needed to read commits/diffs from private repos; use `public_repo` if you only
   care about public ones.)

### 3. AI coach (NVIDIA API key)

The coach runs on an OpenAI-compatible endpoint — NVIDIA-hosted `openai/gpt-oss-20b`
(`https://integrate.api.nvidia.com/v1`). Get a key from [build.nvidia.com](https://build.nvidia.com).
To use a different model/provider, change the `MODEL`/`baseURL` in [`lib/coach.ts`](lib/coach.ts).

### 4. Email (SMTP / Gmail) — optional but needed for reminders/partner email

1. For Gmail, enable 2-Step Verification, then create an **App Password**
   (Google Account → Security → 2-Step Verification → App passwords).
2. Set `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587` (STARTTLS) or `465` (SSL),
   `EMAIL_USER` to your Gmail address, `EMAIL_PASSWORD` to the App Password, and
   `EMAIL_FROM` to the From header (e.g. `Commit <you@gmail.com>`).

Leaving `EMAIL_PASSWORD` blank is safe: email sends become no-ops (logged, never thrown),
and the rest of the app still works.

### 5. Web Push (VAPID) — optional but needed for push notifications

Generate a keypair once:

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Put the `publicKey` in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the `privateKey` in
`VAPID_PRIVATE_KEY`. Set `VAPID_SUBJECT` to a `mailto:` address. Web Push requires HTTPS
(or `localhost`); on iPhone the user must add the app to their home screen first.

### 6. Environment

Fill in `.env.local` (already git-ignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server only — never exposed to the browser
NVIDIA_API_KEY=...                   # server only — the AI coach

NEXT_PUBLIC_APP_URL=http://localhost:3000   # used in notification links

# Email (SMTP / Gmail) — leave EMAIL_PASSWORD blank to disable email sends
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASSWORD=                       # Gmail App Password (server only)
EMAIL_FROM=Commit <you@gmail.com>

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...                 # server only
VAPID_SUBJECT=mailto:you@example.com

# Protects the reminder cron endpoint
CRON_SECRET=change-me
```

### 7. Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). If the core keys are missing you'll
see a setup screen instead of a crash. Email/push are optional and degrade gracefully.

## Scheduling the daily reminder

`/api/cron/reminders` sends the daily nudge to everyone whose local `reminder_time` has
just passed (and who hasn't been reminded today). It's protected by `CRON_SECRET`.

- **Vercel**: [`vercel.json`](vercel.json) already declares a cron every 15 minutes. Set
  `CRON_SECRET` in the project env and Vercel sends it as a Bearer token automatically.
- **Anywhere else** (cron-job.org, a GitHub Action, your own crontab): hit it on a schedule:

  ```bash
  curl "https://<your-app>/api/cron/reminders?secret=$CRON_SECRET"
  ```

Run it at least as often as your finest reminder granularity; the 90-minute send window
plus the per-day `last_reminder_date` guard keep it idempotent.

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
    resolve/submit/route.ts     — judge the answer → verdict (+ feeds recent mood/energy to the coach)
    resolve/emotion/route.ts    — save the check-in, bank the streak
    settings/route.ts           — read/update notification + partner preferences
    push/subscribe/route.ts     — store a Web Push subscription
    push/unsubscribe/route.ts   — drop a subscription
    cron/reminders/route.ts     — daily reminder dispatcher (secret-protected)
lib/
  supabase/{client,server,admin,middleware}.ts — Supabase clients
  github.ts               — REST wrapper (repos, latest push, commit diff)
  coach.ts                — gpt-oss (NVIDIA): generateQuestion + evaluateAnswer (mood-aware)
  mood.ts                 — summarizes recent mood/energy for the coach
  email.ts                — Resend send wrapper (no-op without a key)
  email-templates.ts      — reminder + partner-missed HTML emails
  push.ts                 — server-side Web Push (VAPID) sender
  push-client.ts          — browser: register SW, subscribe/unsubscribe
  notify.ts               — composes email + push (missed-day + reminder)
  date.ts                 — timezone-aware "today" helpers
  server-context.ts       — resolves user + profile + GitHub token per request
  types.ts                — DB row types + API DTOs
middleware.ts             — refreshes the auth session on each request
components/               — screens (today, resolve, commitment, onboarding,
                            repo-select, insights, settings) + ui primitives
public/                   — sw.js (service worker), manifest.json, icon.svg
supabase/migrations/      — schema (0001 core, 0002 notifications)
vercel.json               — cron schedule for the daily reminder
```

## How the streak rules work

The streak is about **honesty and understanding, not correctness**. An honest-but-wrong answer
still counts (`verdict: 'wrong'`); only an evasive, bluffed, or "just restates the code" answer is
withheld (`verdict: 'none'`). A commitment whose day passes without a counted resolution resets the
streak to zero. This rule is encoded in the system prompts in [`lib/coach.ts`](lib/coach.ts).
