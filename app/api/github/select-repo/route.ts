import { NextResponse, type NextRequest } from 'next/server';
import { getContext } from '@/lib/server-context';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { repo } = (await request.json()) as { repo?: string };
  if (!repo) return NextResponse.json({ error: 'missing_repo' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('github_connections')
    .update({ selected_repo: repo, updated_at: new Date().toISOString() })
    .eq('user_id', ctx.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, repo });
}
