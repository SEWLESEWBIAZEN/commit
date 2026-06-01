-- Commit — notifications (email + web push) + accountability partner
-- Run in the Supabase SQL editor after 0001_init.sql (or `supabase db push`).
-- Adds notification preferences to profiles, a push-subscription store, and the
-- partner-notified flag that keeps the missed-day ping idempotent.

-- ── profiles: notification preferences ──────────────────────────────────────
alter table public.profiles
  add column if not exists email              text,                       -- the user's own email (for reminders)
  add column if not exists reminder_time      text    not null default '20:00', -- HH:MM, local to timezone
  add column if not exists reminders_enabled  boolean not null default true,
  add column if not exists email_enabled      boolean not null default true,   -- email fallback for the daily nudge
  add column if not exists push_enabled       boolean not null default false,  -- flips true once a subscription exists
  add column if not exists partner_email      text,
  add column if not exists last_reminder_date date;

-- ── commitments: partner-notified guard ─────────────────────────────────────
-- Ensures a missed-day ping to the accountability partner fires at most once.
alter table public.commitments
  add column if not exists partner_notified boolean not null default false;

-- ── push_subscriptions ──────────────────────────────────────────────────────
-- One row per browser/device push endpoint. The endpoint is globally unique.
-- Owner-scoped via RLS; the service-role client (admin.ts) reads these to send.
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: self all" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);
