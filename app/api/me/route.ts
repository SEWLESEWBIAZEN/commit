import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';

// Lightweight bootstrap: what the client needs to decide which onboarding gate
// (if any) to show before the main app.
export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ authed: false }, { status: 401 });

  const supabase = await createClient();
  const { count } = await supabase
    .from('commitments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ctx.userId);

  return NextResponse.json({
    authed: true,
    repo: ctx.repo,
    hasCommitments: (count ?? 0) > 0,
    streak: ctx.profile.current_streak,
    login: ctx.login,
    avatar: ctx.profile.github_avatar,
    timezone: ctx.profile.timezone,
  });
}
