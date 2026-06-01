import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { listRecentCommits } from '@/lib/github';

// Recent commits for the Insights feed. Returns an empty list (200) on any
// GitHub hiccup so it never breaks the Insights analytics alongside it.
export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!ctx.repo || !ctx.token) return NextResponse.json({ commits: [] });

  try {
    const commits = await listRecentCommits(ctx.repo, { token: ctx.token });
    return NextResponse.json({ commits, repo: ctx.repo });
  } catch (e) {
    return NextResponse.json({ commits: [], error: (e as Error).message });
  }
}
