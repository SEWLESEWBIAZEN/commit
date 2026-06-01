// High-level notification actions that compose email + push. Server-only.
// These never throw: a failed send is logged and swallowed so it can't break
// the request that triggered it (e.g. loading the Today screen).

import { sendEmail } from '@/lib/email';
import { reminderEmail, partnerMissedEmail } from '@/lib/email-templates';
import { sendPushToUser } from '@/lib/push';
import type { Profile } from '@/lib/types';

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

// Fired once when a commitment's day passes unkept. Pings the accountability
// partner by email and nudges the user's own devices via push.
export async function notifyMissed(
  profile: Profile,
  prevStreak: number,
  commitmentBody: string | null,
): Promise<void> {
  const url = appUrl();

  try {
    await sendPushToUser(profile.id, {
      title: 'Streak reset',
      body: prevStreak > 0 ? `A missed day reset your ${prevStreak}-day streak. Start again today.` : 'You missed a day. Start again today.',
      url,
      tag: 'commit-missed',
    });
  } catch (e) {
    console.error('[notify] missed push failed', e);
  }

  if (profile.partner_email) {
    try {
      const { subject, html, text } = partnerMissedEmail({
        partnerEmail: profile.partner_email,
        login: profile.github_login,
        prevStreak,
        commitmentBody,
        appUrl: url,
      });
      await sendEmail({ to: profile.partner_email, subject, html, text });
    } catch (e) {
      console.error('[notify] partner email failed', e);
    }
  }
}

// The daily nudge: email (if enabled) + push (always attempted; no-ops without
// a subscription). Returns true if at least one channel was attempted.
export async function notifyReminder(
  profile: Profile,
  commitmentBody: string | null,
): Promise<void> {
  const url = appUrl();

  try {
    await sendPushToUser(profile.id, {
      title: profile.current_streak > 0 ? `Keep your ${profile.current_streak}-day streak` : 'Did you commit today?',
      body: commitmentBody ? commitmentBody : 'Set today’s commitment and push your work.',
      url,
      tag: 'commit-reminder',
    });
  } catch (e) {
    console.error('[notify] reminder push failed', e);
  }

  if (profile.email_enabled && profile.email) {
    try {
      const { subject, html, text } = reminderEmail({
        login: profile.github_login,
        streak: profile.current_streak,
        commitmentBody,
        appUrl: url,
      });
      await sendEmail({ to: profile.email, subject, html, text });
    } catch (e) {
      console.error('[notify] reminder email failed', e);
    }
  }
}
