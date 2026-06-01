import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { listRecentCommitsMulti } from '@/lib/github';

// Recent commits across ALL tracked repos for the Insights feed, newest first,
// each tagged with its repo. Returns an empty list (200) on any GitHub hiccup.
export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (ctx.repos.length === 0 || !ctx.token) return NextResponse.json({ commits: [] });

  try {
    const commits = await listRecentCommitsMulti(ctx.repos, { token: ctx.token });
    return NextResponse.json({ commits: commits.slice(0, 20), repos: ctx.repos });
  } catch (e) {
    return NextResponse.json({ commits: [], error: (e as Error).message });
  }
}
