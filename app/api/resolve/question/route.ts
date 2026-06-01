import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';
import { latestPushToday, commitDiffStat } from '@/lib/github';
import { todayInTz, startOfTodayUtc } from '@/lib/date';
import { generateQuestion } from '@/lib/coach';
import type { Commitment } from '@/lib/types';

// Detect today's push, read the diff, and ask one question about it.
export async function POST(_request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!ctx.repo || !ctx.token || !ctx.login) {
    return NextResponse.json({ error: 'github_not_connected' }, { status: 400 });
  }

  const supabase = await createClient();
  const today = todayInTz(ctx.profile.timezone);

  const { data: commitment } = await supabase
    .from('commitments')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('target_date', today)
    .maybeSingle<Commitment>();

  if (!commitment) return NextResponse.json({ error: 'no_commitment' }, { status: 400 });

  try {
    const latest = await latestPushToday(
      ctx.repo,
      startOfTodayUtc(ctx.profile.timezone).toISOString(),
      ctx.login,
      { token: ctx.token },
    );
    if (!latest) return NextResponse.json({ error: 'no_push' }, { status: 400 });

    const stat = await commitDiffStat(ctx.repo, latest.commit_sha, { token: ctx.token });
    const question = await generateQuestion({
      commitmentBody: commitment.body,
      diff: stat.patch,
    });

    return NextResponse.json({
      commitment_id: commitment.id,
      commit_sha: latest.commit_sha,
      question,
      additions: stat.additions,
      deletions: stat.deletions,
      files: stat.files,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
