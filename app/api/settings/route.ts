import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';
import type { NotificationSettings } from '@/lib/types';

// Read the user's notification + accountability preferences.
export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const p = ctx.profile;
  const settings: NotificationSettings = {
    reminderTime: p.reminder_time ?? '20:00',
    remindersEnabled: p.reminders_enabled ?? true,
    emailEnabled: p.email_enabled ?? true,
    pushEnabled: p.push_enabled ?? false,
    partnerEmail: p.partner_email ?? null,
    email: p.email ?? null,
  };
  return NextResponse.json(settings);
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Update preferences. Only the fields present in the body are touched, so the
// client can patch a single toggle without sending the whole object.
export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json()) as Partial<{
    reminderTime: string;
    remindersEnabled: boolean;
    emailEnabled: boolean;
    partnerEmail: string | null;
  }>;

  const update: Record<string, unknown> = {};

  if (body.reminderTime !== undefined) {
    if (!TIME_RE.test(body.reminderTime)) {
      return NextResponse.json({ error: 'invalid_time' }, { status: 400 });
    }
    update.reminder_time = body.reminderTime;
  }
  if (body.remindersEnabled !== undefined) update.reminders_enabled = !!body.remindersEnabled;
  if (body.emailEnabled !== undefined) update.email_enabled = !!body.emailEnabled;
  if (body.partnerEmail !== undefined) {
    const trimmed = body.partnerEmail?.trim() || null;
    if (trimmed && !EMAIL_RE.test(trimmed)) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }
    update.partner_email = trimmed;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update(update).eq('id', ctx.userId);
  if (error) {
    console.error('[POST /api/settings] update failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
