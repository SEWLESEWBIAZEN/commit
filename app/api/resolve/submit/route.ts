import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createClient } from '@/lib/supabase/server';
import { commitDiffStat } from '@/lib/github';
import { evaluateAnswer } from '@/lib/coach';

// Judge the answer against the diff. Persists a resolution only when it counts
// (verdict 'good' | 'wrong'); an evasive 'none' returns the verdict so the user
// can answer again without leaving a row behind.
export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!ctx.repo || !ctx.token) {
    return NextResponse.json({ error: 'github_not_connected' }, { status: 400 });
  }

  const { commitment_id, commit_sha, question, answer } = (await request.json()) as {
    commitment_id?: string;
    commit_sha?: string;
    question?: string;
    answer?: string;
  };
  if (!commitment_id || !commit_sha || !question || !answer?.trim()) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: commitment } = await supabase
      .from('commitments')
      .select('body')
      .eq('id', commitment_id)
      .maybeSingle<{ body: string }>();

    const stat = await commitDiffStat(ctx.repo, commit_sha, { token: ctx.token });
    const verdict = await evaluateAnswer({
      commitmentBody: commitment?.body ?? '',
      diff: stat.patch,
      question,
      answer,
    });

    const counted = verdict.verdict !== 'none';
    if (!counted) {
      return NextResponse.json({ resolution_id: null, ...verdict });
    }

    const { data, error } = await supabase
      .from('resolutions')
      .insert({
        user_id: ctx.userId,
        commitment_id,
        repo: ctx.repo,
        commit_sha,
        additions: stat.additions,
        deletions: stat.deletions,
        files: stat.files,
        question,
        answer,
        verdict: verdict.verdict,
        verdict_title: verdict.verdict_title,
        verdict_body: verdict.verdict_body,
        lesson_title: verdict.lesson_title,
        lesson_body: verdict.lesson_body,
        suggestion: verdict.suggestion,
        counted: true,
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resolution_id: data.id, ...verdict });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
