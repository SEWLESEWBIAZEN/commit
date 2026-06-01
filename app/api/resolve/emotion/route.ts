import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';
import { todayInTz } from '@/lib/date';
import type { Resolution } from '@/lib/types';

// Save the emotion check-in and bank the streak. Idempotent per day: the streak
// only increments once (guarded by last_counted_date).
export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { resolution_id, mood, energy, note } = (await request.json()) as {
    resolution_id?: string;
    mood?: number;
    energy?: number;
    note?: string;
  };
  if (!resolution_id) return NextResponse.json({ error: 'missing_resolution' }, { status: 400 });

  const supabase = await createClient();

  const { data: resolution, error: rErr } = await supabase
    .from('resolutions')
    .update({ mood: mood || null, energy: energy || null, note: note?.trim() || null })
    .eq('id', resolution_id)
    .eq('user_id', ctx.userId)
    .select('commitment_id, counted')
    .single<Pick<Resolution, 'commitment_id' | 'counted'>>();

  if (rErr || !resolution) {
    return NextResponse.json({ error: rErr?.message ?? 'not_found' }, { status: 404 });
  }

  const tz = ctx.profile.timezone;
  const today = todayInTz(tz);
  let streak = ctx.profile.current_streak;

  // Mark the commitment kept.
  await supabase.from('commitments').update({ status: 'kept' }).eq('id', resolution.commitment_id);

  // Bank the streak once per day.
  if (resolution.counted && ctx.profile.last_counted_date !== today) {
    streak = ctx.profile.current_streak + 1;
    const longest = Math.max(ctx.profile.longest_streak, streak);
    await supabase
      .from('profiles')
      .update({ current_streak: streak, longest_streak: longest, last_counted_date: today })
      .eq('id', ctx.userId);
  }

  return NextResponse.json({ streak });
}
