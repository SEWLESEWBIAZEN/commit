import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await request.json()) as { repos?: string[]; repo?: string };
  // Accept the new array form or the legacy single-repo form.
  const repos = Array.isArray(body.repos)
    ? body.repos.filter((r) => typeof r === 'string' && r.length > 0)
    : body.repo ? [body.repo] : [];
  if (repos.length === 0) return NextResponse.json({ error: 'missing_repo' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('github_connections')
    .update({ selected_repos: repos, selected_repo: repos[0], updated_at: new Date().toISOString() })
    .eq('user_id', ctx.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, repos });
}
