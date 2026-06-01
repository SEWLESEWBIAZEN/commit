// Web Push delivery (VAPID). Server-only. Reads stored subscriptions via the
// service-role client and prunes any that the push service has expired.
//
// Env:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY — also used by the browser to subscribe
//   VAPID_PRIVATE_KEY            — server only
//   VAPID_SUBJECT                — "mailto:you@example.com" or your site URL

import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PushSubscriptionRow } from '@/lib/types';

let configured = false;
export function pushConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    !!process.env.VAPID_PRIVATE_KEY &&
    !!process.env.VAPID_SUBJECT
  );
}

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// Send a notification to every device the user has subscribed. Returns the
// number of successful sends. Subscriptions that return 404/410 are deleted.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) {
    console.warn('[push] VAPID keys not set — skipping push to', userId);
    return 0;
  }

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .returns<PushSubscriptionRow[]>();

  if (!subs || subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(s.endpoint);
        else console.error('[push] send failed', status, (e as Error).message);
      }
    }),
  );

  if (stale.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', stale);
  }
  return sent;
}
