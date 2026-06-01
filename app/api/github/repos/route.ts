import { NextResponse } from 'next/server';
import { getContext } from '@/lib/server-context';
import { listRepos } from '@/lib/github';

export async function GET() {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!ctx.token) return NextResponse.json({ error: 'github_not_connected' }, { status: 400 });

  try {
    const repos = await listRepos({ token: ctx.token });
    return NextResponse.json({ repos });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
