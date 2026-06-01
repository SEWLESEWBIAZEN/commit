import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';

// Remove a single push endpoint. If the user has no endpoints left, push goes
// quiet automatically (the reminder job only sends when subscriptions exist),
// and we clear push_enabled to keep the settings toggle honest.
export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { endpoint } = (await request.json()) as { endpoint?: string };
  const supabase = await createClient();

  if (endpoint) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', ctx.userId)
      .eq('endpoint', endpoint);
  }

  const { count } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ctx.userId);

  if ((count ?? 0) === 0) {
    await supabase.from('profiles').update({ push_enabled: false }).eq('id', ctx.userId);
  }

  return NextResponse.json({ ok: true });
}
