import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyReminder } from '@/lib/notify';
import { todayInTz } from '@/lib/date';
import type { Profile, Commitment } from '@/lib/types';

// Daily reminder dispatcher. Meant to be hit by a scheduler (Vercel Cron, a
// GitHub Action, or cron-job.org) every ~15 minutes. For each user whose local
// wall-clock has reached their reminder_time (and who hasn't been reminded yet
// today), send the nudge and stamp last_reminder_date so it fires at most once.
//
// Auth: pass the shared secret as `?secret=` or `Authorization: Bearer <secret>`
// (Vercel Cron sends the latter automatically when CRON_SECRET is configured).
export const dynamic = 'force-dynamic';

// How far past reminder_time we still allow a send (covers cron granularity).
const WINDOW_MIN = 90;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get('secret') === secret;
}

// Minutes since local midnight for the current instant in `tz`.
function minutesNowInTz(tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date());
  let h = 0, m = 0;
  for (const p of parts) {
    if (p.type === 'hour') h = +p.value % 24;
    if (p.type === 'minute') m = +p.value;
  }
  return h * 60 + m;
}

function parseHHMM(t: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t);
  return m ? +m[1] * 60 + +m[2] : null;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from('profiles')
    .select('*')
    .eq('reminders_enabled', true)
    .returns<Profile[]>();

  let sent = 0;
  let due = 0;

  for (const p of profiles ?? []) {
    const tz = p.timezone || 'UTC';
    const target = parseHHMM(p.reminder_time || '20:00');
    if (target == null) continue;

    const now = minutesNowInTz(tz);
    const delta = now - target;
    if (delta < 0 || delta > WINDOW_MIN) continue; // not in the send window

    const today = todayInTz(tz);
    if (p.last_reminder_date === today) continue; // already reminded today
    due++;

    // Skip the nudge if today's commitment is already resolved (kept).
    const { data: todays } = await admin
      .from('commitments')
      .select('*')
      .eq('user_id', p.id)
      .eq('target_date', today)
      .maybeSingle<Commitment>();

    if (todays?.status === 'kept') {
      await admin.from('profiles').update({ last_reminder_date: today }).eq('id', p.id);
      continue;
    }

    await notifyReminder(p, todays?.body ?? null);
    await admin.from('profiles').update({ last_reminder_date: today }).eq('id', p.id);
    sent++;
  }

  return NextResponse.json({ ok: true, candidates: profiles?.length ?? 0, due, sent });
}
