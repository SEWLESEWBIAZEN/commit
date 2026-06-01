import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';

// Store (or refresh) a Web Push subscription for the signed-in user, and flip
// push_enabled on so the reminder job knows to deliver via push.
export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { endpoint, keys } = (await request.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: ctx.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'endpoint' },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('profiles').update({ push_enabled: true }).eq('id', ctx.userId);

  return NextResponse.json({ ok: true });
}
