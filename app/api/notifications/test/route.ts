import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { sendEmail, emailConfigured } from '@/lib/email';
import { reminderEmail } from '@/lib/email-templates';
import { sendPushToUser, pushConfigured } from '@/lib/push';
import { appUrl } from '@/lib/notify';

// Fires a real push (to every subscribed device) and a real email so the user
// can confirm the pipeline end to end. Reports what was attempted vs. sent so
// the UI can explain a no-op (missing key, no subscription, blank email).
export async function POST() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const p = ctx.profile;
  const url = appUrl();

  // ── push ──────────────────────────────────────────────────
  let pushSent = 0;
  let pushReason: string | null = null;
  if (!pushConfigured()) pushReason = 'not_configured';
  else {
    pushSent = await sendPushToUser(p.id, {
      title: 'Commit — test push',
      body: 'Push notifications are working. This is what your daily nudge will look like.',
      url,
      tag: 'commit-test',
    });
    if (pushSent === 0) pushReason = 'no_subscription';
  }

  // ── email ─────────────────────────────────────────────────
  let emailSent = false;
  let emailReason: string | null = null;
  if (!emailConfigured()) emailReason = 'not_configured';
  else if (!p.email) emailReason = 'no_address';
  else {
    const { subject, html, text } = reminderEmail({
      login: p.github_login,
      streak: p.current_streak,
      commitmentBody: 'This is a test email from Commit — your reminders are set up correctly.',
      appUrl: url,
    });
    const result = await sendEmail({ to: p.email, subject: `[test] ${subject}`, html, text });
    emailSent = result.ok;
    if (!result.ok) emailReason = result.error ?? 'send_failed';
  }

  return NextResponse.json({
    push: { sent: pushSent, reason: pushReason },
    email: { sent: emailSent, to: p.email, reason: emailReason },
  });
}
