import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { listRecentCommitsMulti, listRepos } from '@/lib/github';

// Recent commits across ALL account repos for the Insights feed, newest first,
// each tagged with its repo. Returns an empty list (200) on any GitHub hiccup.
export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!ctx.token) return NextResponse.json({ commits: [] });

  try {
    const repos = (await listRepos({ token: ctx.token })).map((r) => r.full_name);
    const commits = await listRecentCommitsMulti(repos, { token: ctx.token });
    return NextResponse.json({ commits: commits.slice(0, 20), repos });
  } catch (e) {
    return NextResponse.json({ commits: [], error: (e as Error).message });
  }
}
